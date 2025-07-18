import { supabase } from './supabase';
import { TestResult } from '../test/chatbot-test';

interface ConversationAnalysis {
  sessionId: string;
  totalMessages: number;
  intentAccuracy: number;
  responseQuality: number;
  userSatisfaction: number;
  completionRate: number;
  averageResponseTime: number;
  commonIssues: string[];
  conversationFlow: string[];
  travelParameterCollection: {
    completionRate: number;
    averageSteps: number;
    commonDropoffPoints: string[];
  };
}

interface SystemAnalysis {
  totalConversations: number;
  overallIntentAccuracy: number;
  overallResponseQuality: number;
  overallUserSatisfaction: number;
  commonFailurePatterns: {
    pattern: string;
    frequency: number;
    examples: string[];
  }[];
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    completionRate: number;
  };
  recommendations: string[];
}

export class ChatAnalyzer {
  
  async analyzeConversation(sessionId: string): Promise<ConversationAnalysis> {
    try {
      // 1. 기본 대화 데이터 조회
      const { data: logs, error: logsError } = await supabase
        .from('conversation_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (logsError) throw logsError;

      // 2. 채팅 메시지 데이터 조회
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // 3. 세션 파라미터 조회
      const { data: params, error: paramsError } = await supabase
        .from('session_parameters')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (paramsError && paramsError.code !== 'PGRST116') throw paramsError;

      // 4. 분석 수행
      const analysis = this.performConversationAnalysis(logs || [], messages || [], params);
      
      return analysis;

    } catch (error) {
      console.error('❌ Conversation analysis error:', error);
      throw error;
    }
  }

  private performConversationAnalysis(
    logs: any[],
    messages: any[],
    params: any
  ): ConversationAnalysis {
    const analysis: ConversationAnalysis = {
      sessionId: logs[0]?.session_id || 'unknown',
      totalMessages: messages.length,
      intentAccuracy: 0,
      responseQuality: 0,
      userSatisfaction: 0,
      completionRate: 0,
      averageResponseTime: 0,
      commonIssues: [],
      conversationFlow: [],
      travelParameterCollection: {
        completionRate: 0,
        averageSteps: 0,
        commonDropoffPoints: []
      }
    };

    // 1. 의도 분류 정확도 계산
    analysis.intentAccuracy = this.calculateIntentAccuracyFromLogs(logs);

    // 2. 응답 품질 계산
    analysis.responseQuality = this.calculateResponseQualityFromLogs(logs);

    // 3. 사용자 만족도 계산
    analysis.userSatisfaction = this.calculateUserSatisfactionFromLogs(logs);

    // 4. 완료율 계산
    analysis.completionRate = this.calculateCompletionRate(messages, params);

    // 5. 평균 응답 시간 계산
    analysis.averageResponseTime = this.calculateAverageResponseTime(logs);

    // 6. 공통 이슈 추출
    analysis.commonIssues = this.extractCommonIssues(logs);

    // 7. 대화 흐름 분석
    analysis.conversationFlow = logs.map(log => log.detected_intent);

    // 8. 여행 파라미터 수집 분석
    analysis.travelParameterCollection = this.analyzeTravelParameterCollection(logs, params);

    return analysis;
  }

  private calculateIntentAccuracyFromLogs(logs: any[]): number {
    if (logs.length === 0) return 0;

    const correctIntents = logs.filter(log => {
      const details = log.intent_analysis_details;
      if (!details?.keywordResult || !details?.gptResult) return true;

      // 키워드와 GPT 결과가 일치하면 정확하다고 가정
      return details.keywordResult.intent === details.gptResult.intent;
    });

    return (correctIntents.length / logs.length) * 100;
  }

  private calculateResponseQualityFromLogs(logs: any[]): number {
    if (logs.length === 0) return 0;

    const qualityScores = logs
      .filter(log => log.response_quality?.score)
      .map(log => log.response_quality.score);

    if (qualityScores.length === 0) return 0;

    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  private calculateUserSatisfactionFromLogs(logs: any[]): number {
    if (logs.length === 0) return 0;

    const satisfactionScores = logs.map(log => {
      const satisfaction = log.user_satisfaction;
      if (!satisfaction) return 50; // 기본값

      let score = 50;
      if (satisfaction.continued) score += 30;
      if (satisfaction.abandoned) score -= 40;
      if (satisfaction.reAsked) score -= 20;

      return Math.max(0, Math.min(100, score));
    });

    return satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
  }

  private calculateCompletionRate(messages: any[], params: any): number {
    if (!params) return 0;

    const requiredParams = ['destination', 'duration', 'people_count', 'budget', 'travel_style', 'transportation', 'accommodation'];
    const completedParams = requiredParams.filter(param => params[param]);

    return (completedParams.length / requiredParams.length) * 100;
  }

  private calculateAverageResponseTime(logs: any[]): number {
    const processingTimes = logs
      .filter(log => log.intent_analysis_details?.processingTime)
      .map(log => log.intent_analysis_details.processingTime);

    if (processingTimes.length === 0) return 0;

    return processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
  }

  private extractCommonIssues(logs: any[]): string[] {
    const issues = new Map<string, number>();

    logs.forEach(log => {
      // 응답 품질 이슈
      if (log.response_quality && !log.response_quality.isGood) {
        const reason = log.response_quality.reason;
        issues.set(reason, (issues.get(reason) || 0) + 1);
      }

      // 의도 분석 에러
      if (log.intent_analysis_details?.error) {
        const error = log.intent_analysis_details.error;
        issues.set(error, (issues.get(error) || 0) + 1);
      }

      // 사용자 만족도 이슈
      if (log.user_satisfaction?.abandoned) {
        issues.set('User abandoned conversation', (issues.get('User abandoned conversation') || 0) + 1);
      }

      if (log.user_satisfaction?.reAsked) {
        issues.set('User had to re-ask', (issues.get('User had to re-ask') || 0) + 1);
      }
    });

    // 빈도순 정렬
    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([issue, count]) => `${issue} (${count} times)`)
      .slice(0, 10);
  }

  private analyzeTravelParameterCollection(logs: any[], params: any): {
    completionRate: number;
    averageSteps: number;
    commonDropoffPoints: string[];
  } {
    const travelRelatedLogs = logs.filter(log => 
      log.detected_intent.includes('travel') || 
      log.detected_intent.includes('duration') ||
      log.detected_intent.includes('people') ||
      log.detected_intent.includes('budget')
    );

    const completionRate = this.calculateCompletionRate([], params);
    const averageSteps = travelRelatedLogs.length;

    // 드롭오프 지점 분석
    const dropoffPoints = [];
    if (params) {
      if (!params.destination) dropoffPoints.push('destination');
      if (!params.duration) dropoffPoints.push('duration');
      if (!params.people_count) dropoffPoints.push('people_count');
      if (!params.budget) dropoffPoints.push('budget');
      if (!params.travel_style) dropoffPoints.push('travel_style');
      if (!params.transportation) dropoffPoints.push('transportation');
      if (!params.accommodation) dropoffPoints.push('accommodation');
    }

    return {
      completionRate,
      averageSteps,
      commonDropoffPoints: dropoffPoints
    };
  }

  async analyzeSystemPerformance(days: number = 7): Promise<SystemAnalysis> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 1. 시스템 로그 조회
      const { data: logs, error: logsError } = await supabase
        .from('conversation_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (logsError) throw logsError;

      // 2. 채팅 메시지 조회
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (messagesError) throw messagesError;

      // 3. 세션 파라미터 조회
      const { data: params, error: paramsError } = await supabase
        .from('session_parameters')
        .select('*')
        .gte('updated_at', startDate.toISOString());

      if (paramsError) throw paramsError;

      // 4. 시스템 분석 수행
      const analysis = this.performSystemAnalysis(logs || [], messages || [], params || []);
      
      return analysis;

    } catch (error) {
      console.error('❌ System analysis error:', error);
      throw error;
    }
  }

  private performSystemAnalysis(
    logs: any[],
    messages: any[],
    params: any[]
  ): SystemAnalysis {
    const uniqueSessions = new Set(logs.map(log => log.session_id));
    
    const analysis: SystemAnalysis = {
      totalConversations: uniqueSessions.size,
      overallIntentAccuracy: this.calculateIntentAccuracyFromLogs(logs),
      overallResponseQuality: this.calculateResponseQualityFromLogs(logs),
      overallUserSatisfaction: this.calculateUserSatisfactionFromLogs(logs),
      commonFailurePatterns: [],
      performanceMetrics: {
        averageResponseTime: this.calculateAverageResponseTime(logs),
        errorRate: 0,
        completionRate: 0
      },
      recommendations: []
    };

    // 실패 패턴 분석
    analysis.commonFailurePatterns = this.analyzeFailurePatterns(logs);

    // 성능 메트릭 계산
    analysis.performanceMetrics.errorRate = this.calculateErrorRate(logs);
    analysis.performanceMetrics.completionRate = this.calculateOverallCompletionRate(params);

    // 추천사항 생성
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  private analyzeFailurePatterns(logs: any[]): {
    pattern: string;
    frequency: number;
    examples: string[];
  }[] {
    const patterns = new Map<string, { count: number; examples: string[] }>();

    logs.forEach(log => {
      // 의도 분류 실패 패턴
      if (log.intent_analysis_details?.keywordResult && log.intent_analysis_details?.gptResult) {
        const keyword = log.intent_analysis_details.keywordResult.intent;
        const gpt = log.intent_analysis_details.gptResult.intent;
        
        if (keyword !== gpt) {
          const pattern = `Intent mismatch: ${keyword} vs ${gpt}`;
          if (!patterns.has(pattern)) {
            patterns.set(pattern, { count: 0, examples: [] });
          }
          const data = patterns.get(pattern)!;
          data.count++;
          if (data.examples.length < 3) {
            data.examples.push(log.user_input);
          }
        }
      }

      // 응답 품질 실패 패턴
      if (log.response_quality && !log.response_quality.isGood) {
        const pattern = `Poor response: ${log.response_quality.reason}`;
        if (!patterns.has(pattern)) {
          patterns.set(pattern, { count: 0, examples: [] });
        }
        const data = patterns.get(pattern)!;
        data.count++;
        if (data.examples.length < 3) {
          data.examples.push(log.user_input);
        }
      }
    });

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        examples: data.examples
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private calculateErrorRate(logs: any[]): number {
    if (logs.length === 0) return 0;

    const errorLogs = logs.filter(log => 
      log.intent_analysis_details?.error || 
      (log.response_quality && !log.response_quality.isGood)
    );

    return (errorLogs.length / logs.length) * 100;
  }

  private calculateOverallCompletionRate(params: any[]): number {
    if (params.length === 0) return 0;

    const requiredParams = ['destination', 'duration', 'people_count', 'budget', 'travel_style', 'transportation', 'accommodation'];
    const completedSessions = params.filter(param => 
      requiredParams.every(required => param[required])
    );

    return (completedSessions.length / params.length) * 100;
  }

  private generateRecommendations(analysis: SystemAnalysis): string[] {
    const recommendations = [];

    // 의도 분류 정확도 개선
    if (analysis.overallIntentAccuracy < 80) {
      recommendations.push('Improve intent classification accuracy by enhancing keyword patterns or GPT prompts');
    }

    // 응답 품질 개선
    if (analysis.overallResponseQuality < 70) {
      recommendations.push('Enhance response quality by improving AI response templates and validation');
    }

    // 사용자 만족도 개선
    if (analysis.overallUserSatisfaction < 60) {
      recommendations.push('Focus on user experience improvements to reduce abandonment rate');
    }

    // 성능 개선
    if (analysis.performanceMetrics.averageResponseTime > 5000) {
      recommendations.push('Optimize response time by improving API performance or caching');
    }

    // 완료율 개선
    if (analysis.performanceMetrics.completionRate < 50) {
      recommendations.push('Improve parameter collection flow to increase completion rate');
    }

    // 실패 패턴 기반 추천
    analysis.commonFailurePatterns.slice(0, 3).forEach(pattern => {
      if (pattern.pattern.includes('Intent mismatch')) {
        recommendations.push(`Address intent classification conflicts: ${pattern.pattern}`);
      }
      if (pattern.pattern.includes('Poor response')) {
        recommendations.push(`Fix response quality issues: ${pattern.pattern}`);
      }
    });

    return recommendations;
  }

  // 테스트 결과 분석 (기존 메서드)
  calculateIntentAccuracy(results: TestResult[]): number {
    if (results.length === 0) return 0;

    const totalIntents = results.reduce((sum, result) => sum + result.actualIntents.length, 0);
    const correctIntents = results.reduce((sum, result) => {
      return sum + result.actualIntents.filter((intent, index) => {
        // 기대값과 실제값 비교는 테스트 시나리오에서 정의된 기대값을 사용
        return true; // 실제 구현에서는 expected와 actual 비교
      }).length;
    }, 0);

    return (correctIntents / totalIntents) * 100;
  }

  analyzeResponseQuality(userInput: string, aiResponse: string, expectedIntent: string): {
    isGood: boolean;
    reason: string;
  } {
    // 응답 품질 분석 로직
    if (aiResponse.length < 10) {
      return { isGood: false, reason: 'Response too short' };
    }
    
    if (aiResponse.includes('오류') || aiResponse.includes('죄송')) {
      return { isGood: false, reason: 'Error or apology in response' };
    }
    
    if (expectedIntent === 'travel_start' && !aiResponse.includes('여행')) {
      return { isGood: false, reason: 'Response does not match travel intent' };
    }
    
    return { isGood: true, reason: 'Good response' };
  }

  async generateAnalysisReport(sessionId?: string): Promise<string> {
    try {
      const report = [];
      
      if (sessionId) {
        // 특정 세션 분석
        const sessionAnalysis = await this.analyzeConversation(sessionId);
        report.push(`📋 CONVERSATION ANALYSIS REPORT - Session: ${sessionId}`);
        report.push(`════════════════════════════════════════════════════════`);
        report.push(`📊 Total Messages: ${sessionAnalysis.totalMessages}`);
        report.push(`🎯 Intent Accuracy: ${sessionAnalysis.intentAccuracy.toFixed(1)}%`);
        report.push(`⭐ Response Quality: ${sessionAnalysis.responseQuality.toFixed(1)}/100`);
        report.push(`😊 User Satisfaction: ${sessionAnalysis.userSatisfaction.toFixed(1)}/100`);
        report.push(`✅ Completion Rate: ${sessionAnalysis.completionRate.toFixed(1)}%`);
        report.push(`⏱️  Avg Response Time: ${sessionAnalysis.averageResponseTime.toFixed(0)}ms`);
        report.push(`🔄 Conversation Flow: ${sessionAnalysis.conversationFlow.join(' → ')}`);
        
        if (sessionAnalysis.commonIssues.length > 0) {
          report.push(`\n❌ Common Issues:`);
          sessionAnalysis.commonIssues.forEach(issue => report.push(`   • ${issue}`));
        }
        
        report.push(`\n📝 Travel Parameter Collection:`);
        report.push(`   • Completion Rate: ${sessionAnalysis.travelParameterCollection.completionRate.toFixed(1)}%`);
        report.push(`   • Average Steps: ${sessionAnalysis.travelParameterCollection.averageSteps}`);
        if (sessionAnalysis.travelParameterCollection.commonDropoffPoints.length > 0) {
          report.push(`   • Common Dropoff Points: ${sessionAnalysis.travelParameterCollection.commonDropoffPoints.join(', ')}`);
        }
        
      } else {
        // 시스템 전체 분석
        const systemAnalysis = await this.analyzeSystemPerformance();
        report.push(`📋 SYSTEM PERFORMANCE ANALYSIS REPORT`);
        report.push(`════════════════════════════════════════════════════════`);
        report.push(`💬 Total Conversations: ${systemAnalysis.totalConversations}`);
        report.push(`🎯 Overall Intent Accuracy: ${systemAnalysis.overallIntentAccuracy.toFixed(1)}%`);
        report.push(`⭐ Overall Response Quality: ${systemAnalysis.overallResponseQuality.toFixed(1)}/100`);
        report.push(`😊 Overall User Satisfaction: ${systemAnalysis.overallUserSatisfaction.toFixed(1)}/100`);
        report.push(`⏱️  Avg Response Time: ${systemAnalysis.performanceMetrics.averageResponseTime.toFixed(0)}ms`);
        report.push(`❌ Error Rate: ${systemAnalysis.performanceMetrics.errorRate.toFixed(1)}%`);
        report.push(`✅ Completion Rate: ${systemAnalysis.performanceMetrics.completionRate.toFixed(1)}%`);
        
        if (systemAnalysis.commonFailurePatterns.length > 0) {
          report.push(`\n🔍 Common Failure Patterns:`);
          systemAnalysis.commonFailurePatterns.slice(0, 5).forEach(pattern => {
            report.push(`   • ${pattern.pattern} (${pattern.frequency} times)`);
            if (pattern.examples.length > 0) {
              report.push(`     Examples: ${pattern.examples.join(', ')}`);
            }
          });
        }
        
        if (systemAnalysis.recommendations.length > 0) {
          report.push(`\n💡 Recommendations:`);
          systemAnalysis.recommendations.forEach(rec => report.push(`   • ${rec}`));
        }
      }
      
      return report.join('\n');
      
    } catch (error) {
      console.error('❌ Error generating analysis report:', error);
      return `Error generating analysis report: ${error.message}`;
    }
  }
}