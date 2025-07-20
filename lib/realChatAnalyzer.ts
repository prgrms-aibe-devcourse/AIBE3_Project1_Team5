import { supabase } from './supabase';

interface ChatAnalysisResult {
  totalSessions: number;
  totalMessages: number;
  userAbandonmentPatterns: {
    pattern: string;
    count: number;
    examples: string[];
  }[];
  repeatedQuestions: {
    question: string;
    count: number;
    sessions: string[];
  }[];
  errorPatterns: {
    userInput: string;
    aiResponse: string;
    timestamp: string;
  }[];
  commonUserInputs: {
    input: string;
    count: number;
  }[];
  sessionLengths: {
    averageMessages: number;
    shortSessions: number; // 3개 이하 메시지
    mediumSessions: number; // 4-10개 메시지
    longSessions: number; // 11개 이상 메시지
  };
}

export class RealChatAnalyzer {
  
  async analyzeRecentChats(days: number = 7): Promise<ChatAnalysisResult> {
    console.log(`📊 Analyzing chats from the last ${days} days...`);
    
    try {
      // 최근 N일간의 채팅 데이터 조회
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(`📝 Found ${messages?.length || 0} messages`);

      // 세션별로 그룹화
      const sessionGroups = this.groupBySession(messages || []);
      
      const result: ChatAnalysisResult = {
        totalSessions: Object.keys(sessionGroups).length,
        totalMessages: messages?.length || 0,
        userAbandonmentPatterns: await this.analyzeAbandonmentPatterns(sessionGroups),
        repeatedQuestions: await this.analyzeRepeatedQuestions(messages || []),
        errorPatterns: await this.analyzeErrorPatterns(messages || []),
        commonUserInputs: await this.analyzeCommonInputs(messages || []),
        sessionLengths: this.analyzeSessionLengths(sessionGroups)
      };

      return result;
    } catch (error) {
      console.error('❌ Error analyzing chats:', error);
      throw error;
    }
  }

  private groupBySession(messages: any[]): Record<string, any[]> {
    return messages.reduce((groups, message) => {
      const sessionId = message.session_id || 'unknown';
      if (!groups[sessionId]) {
        groups[sessionId] = [];
      }
      groups[sessionId].push(message);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private async analyzeAbandonmentPatterns(sessionGroups: Record<string, any[]>) {
    const patterns = [
      { pattern: '그만', keywords: ['그만', '취소', '안할래', '포기', '멈춰'] },
      { pattern: '혼란/불만', keywords: ['모르겠', '이해 못', '복잡', '어려워'] },
      { pattern: '반복 질문 포기', keywords: ['또?', '계속', '같은'] }
    ];

    const results = [];

    for (const pattern of patterns) {
      const examples: string[] = [];
      let count = 0;

      Object.values(sessionGroups).forEach(messages => {
        const userMessages = messages.filter(m => m.role === 'user');
        userMessages.forEach(msg => {
          if (pattern.keywords.some(keyword => msg.content.toLowerCase().includes(keyword))) {
            count++;
            examples.push(msg.content);
          }
        });
      });

      results.push({
        pattern: pattern.pattern,
        count,
        examples: examples.slice(0, 5) // 최대 5개 예시
      });
    }

    return results;
  }

  private async analyzeRepeatedQuestions(messages: any[]) {
    const aiMessages = messages.filter(m => m.role === 'assistant');
    const questionCounts: Record<string, { count: number; sessions: Set<string> }> = {};

    aiMessages.forEach(msg => {
      // 질문 패턴 감지 (물음표로 끝나거나 특정 패턴)
      if (msg.content.includes('?') || 
          msg.content.includes('어떤') || 
          msg.content.includes('몇') ||
          msg.content.includes('알려주세요')) {
        
        const cleanQuestion = msg.content.substring(0, 100); // 처음 100자만
        
        if (!questionCounts[cleanQuestion]) {
          questionCounts[cleanQuestion] = { count: 0, sessions: new Set() };
        }
        questionCounts[cleanQuestion].count++;
        questionCounts[cleanQuestion].sessions.add(msg.session_id);
      }
    });

    return Object.entries(questionCounts)
      .filter(([_, data]) => data.count > 2) // 3번 이상 반복된 질문만
      .map(([question, data]) => ({
        question,
        count: data.count,
        sessions: Array.from(data.sessions)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 상위 10개
  }

  private async analyzeErrorPatterns(messages: any[]) {
    const errorPatterns: any[] = [];
    
    // 연속된 메시지들을 분석하여 에러 패턴 찾기
    for (let i = 0; i < messages.length - 1; i++) {
      const userMsg = messages[i];
      const aiMsg = messages[i + 1];
      
      if (userMsg.role === 'user' && aiMsg.role === 'assistant') {
        // AI 응답이 에러나 문제를 나타내는 패턴들
        if (aiMsg.content.includes('오류') ||
            aiMsg.content.includes('에러') ||
            aiMsg.content.includes('잠시 후') ||
            aiMsg.content.includes('다시 시도') ||
            aiMsg.content.length < 20) { // 너무 짧은 응답
          
          errorPatterns.push({
            userInput: userMsg.content,
            aiResponse: aiMsg.content,
            timestamp: userMsg.created_at
          });
        }
      }
    }

    return errorPatterns.slice(0, 20); // 최대 20개
  }

  private async analyzeCommonInputs(messages: any[]) {
    const userMessages = messages.filter(m => m.role === 'user');
    const inputCounts: Record<string, number> = {};

    userMessages.forEach(msg => {
      const cleanInput = msg.content.trim().toLowerCase();
      inputCounts[cleanInput] = (inputCounts[cleanInput] || 0) + 1;
    });

    return Object.entries(inputCounts)
      .filter(([_, count]) => count > 1) // 2번 이상 나온 입력만
      .map(([input, count]) => ({ input, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // 상위 20개
  }

  private analyzeSessionLengths(sessionGroups: Record<string, any[]>) {
    const lengths = Object.values(sessionGroups).map(messages => messages.length);
    
    const short = lengths.filter(len => len <= 3).length;
    const medium = lengths.filter(len => len > 3 && len <= 10).length;
    const long = lengths.filter(len => len > 10).length;
    
    const average = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

    return {
      averageMessages: Math.round(average * 10) / 10,
      shortSessions: short,
      mediumSessions: medium,
      longSessions: long
    };
  }

  async generateAnalysisReport(analysis: ChatAnalysisResult): Promise<string> {
    const report = `
📊 REAL CHAT ANALYSIS REPORT
════════════════════════════════════════════════════════

📈 OVERVIEW:
   💬 Total Sessions: ${analysis.totalSessions}
   📝 Total Messages: ${analysis.totalMessages}
   📊 Avg Messages per Session: ${analysis.sessionLengths.averageMessages}

📉 SESSION LENGTH DISTRIBUTION:
   🔸 Short (≤3 msgs): ${analysis.sessionLengths.shortSessions} (${Math.round(analysis.sessionLengths.shortSessions/analysis.totalSessions*100)}%)
   🔸 Medium (4-10 msgs): ${analysis.sessionLengths.mediumSessions} (${Math.round(analysis.sessionLengths.mediumSessions/analysis.totalSessions*100)}%)
   🔸 Long (11+ msgs): ${analysis.sessionLengths.longSessions} (${Math.round(analysis.sessionLengths.longSessions/analysis.totalSessions*100)}%)

🚨 USER ABANDONMENT PATTERNS:
${analysis.userAbandonmentPatterns.map(pattern => 
  `   • ${pattern.pattern}: ${pattern.count} times
     Examples: ${pattern.examples.slice(0, 3).join(', ')}`
).join('\n')}

🔄 REPEATED QUESTIONS (Top 5):
${analysis.repeatedQuestions.slice(0, 5).map(q => 
  `   • "${q.question.substring(0, 80)}..." (${q.count} times)`
).join('\n')}

❌ ERROR PATTERNS (Top 10):
${analysis.errorPatterns.slice(0, 10).map(err => 
  `   • Input: "${err.userInput.substring(0, 40)}..."
     Response: "${err.aiResponse.substring(0, 40)}..."`
).join('\n')}

📝 COMMON USER INPUTS (Top 10):
${analysis.commonUserInputs.slice(0, 10).map(input => 
  `   • "${input.input.substring(0, 50)}..." (${input.count} times)`
).join('\n')}

💡 IMMEDIATE ACTION ITEMS:
   ${analysis.sessionLengths.shortSessions > analysis.totalSessions * 0.5 ? '❗ High abandonment rate - improve first response quality' : '✅ Session lengths look healthy'}
   ${analysis.repeatedQuestions.length > 5 ? '❗ Many repeated questions - review AI response logic' : '✅ Question variety looks good'}
   ${analysis.errorPatterns.length > 10 ? '❗ High error rate - investigate API/logic issues' : '✅ Error rate acceptable'}

════════════════════════════════════════════════════════
Report generated: ${new Date().toISOString()}
`;

    return report;
  }
}