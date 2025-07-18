import { supabase } from './supabase';

interface ConversationLog {
  sessionId: string;
  userInput: string;
  detectedIntent: string;
  aiResponse: string;
  timestamp: Date;
  testScenario?: string;
  intentAnalysisDetails: {
    keywordResult?: {
      intent: string;
      confidence: number;
    };
    gptResult?: {
      intent: string;
      confidence: number;
    };
    finalResult?: {
      intent: string;
      reason: string;
      shouldOfferContinue: boolean;
    };
    processingTime?: number;
    error?: string;
  };
  responseQuality?: {
    isGood: boolean;
    reason: string;
    score: number;
  };
  userSatisfaction?: {
    continued: boolean;
    abandoned: boolean;
    reAsked: boolean;
  };
}

interface ConversationContext {
  sessionId: string;
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    intent?: string;
  }>;
  travelParameters: {
    destination?: string;
    duration?: number;
    peopleCount?: number;
    budget?: number;
    travelStyle?: string;
    transportation?: string;
    accommodation?: string;
    collectionStatus?: string;
  };
  conversationFlow: string[];
  issues: string[];
}

export class ConversationLogger {
  private contexts: Map<string, ConversationContext> = new Map();
  private logBuffer: ConversationLog[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    // 5초마다 로그 플러시
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 5000);
  }

  async logConversation(data: ConversationLog): Promise<void> {
    try {
      // 컨텍스트 업데이트
      this.updateContext(data);
      
      // 응답 품질 분석
      if (!data.responseQuality) {
        data.responseQuality = this.analyzeResponseQuality(data);
      }
      
      // 사용자 만족도 추정
      data.userSatisfaction = this.estimateUserSatisfaction(data);
      
      // 로그 버퍼에 추가
      this.logBuffer.push(data);
      
      // 실시간 콘솔 출력
      this.printRealTimeLog(data);
      
      // 즉시 플러시가 필요한 경우 (에러, 중요 이벤트)
      if (data.intentAnalysisDetails.error || !data.responseQuality.isGood) {
        await this.flushLogs();
      }
      
    } catch (error) {
      console.error('❌ Conversation logging error:', error);
    }
  }

  private updateContext(data: ConversationLog): void {
    const context = this.contexts.get(data.sessionId) || {
      sessionId: data.sessionId,
      messageHistory: [],
      travelParameters: {},
      conversationFlow: [],
      issues: []
    };

    // 메시지 히스토리 업데이트
    context.messageHistory.push(
      {
        role: 'user',
        content: data.userInput,
        timestamp: data.timestamp,
        intent: data.detectedIntent
      },
      {
        role: 'assistant',
        content: data.aiResponse,
        timestamp: data.timestamp
      }
    );

    // 대화 흐름 추적
    context.conversationFlow.push(data.detectedIntent);

    // 여행 파라미터 추출 (AI 응답에서)
    this.extractTravelParameters(data.aiResponse, context.travelParameters);

    // 이슈 감지
    if (data.intentAnalysisDetails.error) {
      context.issues.push(`Intent analysis error: ${data.intentAnalysisDetails.error}`);
    }
    
    if (data.responseQuality && !data.responseQuality.isGood) {
      context.issues.push(`Poor response quality: ${data.responseQuality.reason}`);
    }

    // 무한 루프 감지
    if (this.detectInfiniteLoop(context.conversationFlow)) {
      context.issues.push('Infinite loop detected in conversation flow');
    }

    this.contexts.set(data.sessionId, context);
  }

  private analyzeResponseQuality(data: ConversationLog): {
    isGood: boolean;
    reason: string;
    score: number;
  } {
    let score = 100;
    const issues: string[] = [];

    // 응답 길이 체크
    if (data.aiResponse.length < 10) {
      score -= 30;
      issues.push('Response too short');
    }
    
    if (data.aiResponse.length > 500) {
      score -= 10;
      issues.push('Response too long');
    }

    // 중복 응답 체크
    const context = this.contexts.get(data.sessionId);
    if (context) {
      const recentResponses = context.messageHistory
        .filter(msg => msg.role === 'assistant')
        .slice(-3)
        .map(msg => msg.content);
      
      if (recentResponses.some(prev => prev === data.aiResponse)) {
        score -= 50;
        issues.push('Duplicate response');
      }
    }

    // 의도와 응답 일치성 체크
    if (data.detectedIntent === 'travel_start' && !data.aiResponse.includes('여행')) {
      score -= 20;
      issues.push('Response does not match travel intent');
    }

    if (data.detectedIntent === 'travel_query' && !data.aiResponse.includes('계획')) {
      score -= 20;
      issues.push('Response does not match query intent');
    }

    // 에러 메시지 체크
    if (data.aiResponse.includes('오류') || data.aiResponse.includes('죄송')) {
      score -= 15;
      issues.push('Error or apology in response');
    }

    return {
      isGood: score >= 70,
      reason: issues.join(', ') || 'Good response',
      score
    };
  }

  private estimateUserSatisfaction(data: ConversationLog): {
    continued: boolean;
    abandoned: boolean;
    reAsked: boolean;
  } {
    const context = this.contexts.get(data.sessionId);
    if (!context) {
      return { continued: false, abandoned: false, reAsked: false };
    }

    const recentInputs = context.messageHistory
      .filter(msg => msg.role === 'user')
      .slice(-3)
      .map(msg => msg.content);

    // 재질문 패턴 감지
    const reAsked = recentInputs.some(input => 
      input.includes('다시') || input.includes('다른') || input.includes('안돼')
    );

    // 포기 패턴 감지
    const abandoned = recentInputs.some(input => 
      input.includes('그만') || input.includes('취소') || input.includes('안할래')
    );

    // 계속 진행 패턴 감지
    const continued = context.conversationFlow.length > 1 && !abandoned;

    return { continued, abandoned, reAsked };
  }

  private extractTravelParameters(response: string, params: any): void {
    // 응답에서 여행 파라미터 추출
    const destinationMatch = response.match(/목적지[:\s]*([^\s\n]+)/);
    if (destinationMatch) params.destination = destinationMatch[1];

    const durationMatch = response.match(/기간[:\s]*(\d+)/);
    if (durationMatch) params.duration = parseInt(durationMatch[1]);

    const peopleMatch = response.match(/인원[:\s]*(\d+)/);
    if (peopleMatch) params.peopleCount = parseInt(peopleMatch[1]);

    const budgetMatch = response.match(/예산[:\s]*(\d+)/);
    if (budgetMatch) params.budget = parseInt(budgetMatch[1]);

    // 진행률 추출
    const progressMatch = response.match(/진행률[:\s]*(\d+)%/);
    if (progressMatch) {
      const progress = parseInt(progressMatch[1]);
      params.collectionStatus = progress === 100 ? 'complete' : 'incomplete';
    }
  }

  private detectInfiniteLoop(flow: string[]): boolean {
    if (flow.length < 6) return false;
    
    const recentFlow = flow.slice(-6);
    const pattern = recentFlow.slice(0, 3);
    const nextPattern = recentFlow.slice(3, 6);
    
    return JSON.stringify(pattern) === JSON.stringify(nextPattern);
  }

  private printRealTimeLog(data: ConversationLog): void {
    console.log('\n🔄 REAL-TIME CONVERSATION LOG');
    console.log('================================');
    console.log(`📅 Time: ${data.timestamp.toISOString()}`);
    console.log(`🔑 Session: ${data.sessionId}`);
    console.log(`👤 User Input: "${data.userInput}"`);
    console.log(`🎯 Detected Intent: ${data.detectedIntent}`);
    console.log(`🤖 AI Response: "${data.aiResponse.substring(0, 100)}${data.aiResponse.length > 100 ? '...' : ''}"`);
    
    // 의도 분석 상세 정보
    if (data.intentAnalysisDetails.keywordResult) {
      console.log(`🔍 Keyword Analysis: ${data.intentAnalysisDetails.keywordResult.intent} (${data.intentAnalysisDetails.keywordResult.confidence})`);
    }
    
    if (data.intentAnalysisDetails.gptResult) {
      console.log(`🧠 GPT Analysis: ${data.intentAnalysisDetails.gptResult.intent} (${data.intentAnalysisDetails.gptResult.confidence})`);
    }
    
    if (data.intentAnalysisDetails.finalResult) {
      console.log(`✅ Final Result: ${data.intentAnalysisDetails.finalResult.intent} (${data.intentAnalysisDetails.finalResult.reason})`);
    }

    // 응답 품질
    if (data.responseQuality) {
      const qualityIcon = data.responseQuality.isGood ? '✅' : '❌';
      console.log(`${qualityIcon} Response Quality: ${data.responseQuality.score}/100 - ${data.responseQuality.reason}`);
    }

    // 사용자 만족도
    if (data.userSatisfaction) {
      const satisfaction = data.userSatisfaction;
      console.log(`😊 User Satisfaction: continued=${satisfaction.continued}, abandoned=${satisfaction.abandoned}, reAsked=${satisfaction.reAsked}`);
    }

    // 에러가 있다면 강조
    if (data.intentAnalysisDetails.error) {
      console.log(`❌ ERROR: ${data.intentAnalysisDetails.error}`);
    }

    console.log('================================\n');
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      console.log(`💾 Flushing ${this.logBuffer.length} logs to database...`);
      
      // Supabase에 로그 저장
      const { error } = await supabase
        .from('conversation_logs')
        .insert(this.logBuffer.map(log => ({
          session_id: log.sessionId,
          user_input: log.userInput,
          detected_intent: log.detectedIntent,
          ai_response: log.aiResponse,
          timestamp: log.timestamp.toISOString(),
          test_scenario: log.testScenario,
          intent_analysis_details: log.intentAnalysisDetails,
          response_quality: log.responseQuality,
          user_satisfaction: log.userSatisfaction
        })));

      if (error) {
        console.error('❌ Error saving logs to database:', error);
      } else {
        console.log(`✅ Successfully saved ${this.logBuffer.length} logs to database`);
      }

      // 버퍼 클리어
      this.logBuffer = [];

    } catch (error) {
      console.error('❌ Log flush error:', error);
    }
  }

  public async getConversationContext(sessionId: string): Promise<ConversationContext | null> {
    return this.contexts.get(sessionId) || null;
  }

  public async getAllContexts(): Promise<ConversationContext[]> {
    return Array.from(this.contexts.values());
  }

  public async generateConversationReport(sessionId: string): Promise<string> {
    const context = this.contexts.get(sessionId);
    if (!context) return 'No conversation context found';

    const report = [];
    report.push(`📋 CONVERSATION REPORT - Session: ${sessionId}`);
    report.push(`📅 Messages: ${context.messageHistory.length}`);
    report.push(`🎯 Conversation Flow: ${context.conversationFlow.join(' → ')}`);
    report.push(`📊 Travel Parameters: ${JSON.stringify(context.travelParameters, null, 2)}`);
    
    if (context.issues.length > 0) {
      report.push(`❌ Issues Found:`);
      context.issues.forEach(issue => report.push(`  - ${issue}`));
    }

    return report.join('\n');
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs(); // 마지막 플러시
  }
}