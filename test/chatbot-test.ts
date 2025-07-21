import { ConversationLogger } from '../lib/conversationLogger';
import { ChatAnalyzer } from '../lib/chatAnalyzer';

interface TestScenario {
  name: string;
  description: string;
  inputs: string[];
  expectedIntents: string[];
  expectedResponses: string[];
  timeout?: number;
}

interface TestResult {
  scenarioName: string;
  success: boolean;
  actualIntents: string[];
  actualResponses: string[];
  issues: string[];
  executionTime: number;
}

export class ChatbotTester {
  private logger: ConversationLogger;
  private analyzer: ChatAnalyzer;
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.logger = new ConversationLogger();
    this.analyzer = new ChatAnalyzer();
  }

  private testScenarios: TestScenario[] = [
    {
      name: "여행 계획 시작 - 제주도",
      description: "사용자가 제주도 여행을 계획하는 시나리오",
      inputs: ["제주도 가고싶어", "2박3일", "혼자", "50만원", "힐링", "비행기", "호텔"],
      expectedIntents: ["travel_start", "duration_input", "people_input", "budget_input", "style_input", "transport_input", "accommodation_input"],
      expectedResponses: [
        "목적지 관련 응답",
        "기간 질문",
        "인원 질문", 
        "예산 질문",
        "여행 스타일 질문",
        "교통수단 질문",
        "숙박 질문"
      ]
    },
    {
      name: "기록 조회",
      description: "사용자가 이전 여행 기록을 조회하는 시나리오",
      inputs: ["이전 기록 있어?", "여행 기록", "저장된 계획"],
      expectedIntents: ["travel_query", "travel_query", "travel_query"],
      expectedResponses: [
        "여행 계획 목록 또는 없음 응답",
        "여행 계획 목록 또는 없음 응답", 
        "여행 계획 목록 또는 없음 응답"
      ]
    },
    {
      name: "일반 대화",
      description: "여행과 관련 없는 일반적인 대화",
      inputs: ["안녕하세요", "오늘 날씨 어때요?", "그냥 인사야"],
      expectedIntents: ["general", "general", "general"],
      expectedResponses: [
        "일반적인 인사 응답",
        "일반적인 대화 응답",
        "일반적인 대화 응답"
      ]
    },
    {
      name: "파라미터 입력 중 진행 상태 확인",
      description: "파라미터 입력 도중 진행 상태를 확인하는 시나리오",
      inputs: ["부산 가고싶어", "3일", "진행중인 계획 있어?"],
      expectedIntents: ["travel_start", "duration_input", "travel_continue"],
      expectedResponses: [
        "기간 질문",
        "인원 질문",
        "진행중인 계획 정보 표시"
      ]
    },
    {
      name: "의도 분류 경계 케이스",
      description: "애매한 표현들의 의도 분류 테스트",
      inputs: ["여행 갈까 말까", "어디로 갈지 모르겠어", "계획 있었나?"],
      expectedIntents: ["general", "travel_start", "travel_query"],
      expectedResponses: [
        "일반적인 응답",
        "여행 계획 도움 제안",
        "기록 조회 응답"
      ]
    }
  ];

  async runAllTests(sessionId?: string): Promise<TestResult[]> {
    console.log('🚀 Starting automated chatbot tests...');
    const results: TestResult[] = [];
    
    for (const scenario of this.testScenarios) {
      console.log(`\n📋 Testing: ${scenario.name}`);
      const result = await this.runScenario(scenario, sessionId);
      results.push(result);
      
      // 시나리오 간 간격
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 종합 결과 분석
    await this.generateTestReport(results);
    return results;
  }

  private async runScenario(scenario: TestScenario, sessionId?: string): Promise<TestResult> {
    const startTime = Date.now();
    const result: TestResult = {
      scenarioName: scenario.name,
      success: true,
      actualIntents: [],
      actualResponses: [],
      issues: [],
      executionTime: 0
    };

    try {
      // 세션 시작 (필요시 새 세션 생성)
      const testSessionId = sessionId || `test-${Date.now()}`;
      
      for (let i = 0; i < scenario.inputs.length; i++) {
        const userInput = scenario.inputs[i];
        const expectedIntent = scenario.expectedIntents[i];
        
        console.log(`  📝 Input: "${userInput}"`);
        
        // 메시지 전송 및 응답 수집
        const conversationData = await this.sendMessageAndCollectData(
          userInput,
          testSessionId,
          expectedIntent
        );
        
        result.actualIntents.push(conversationData.detectedIntent);
        result.actualResponses.push(conversationData.aiResponse);
        
        // 의도 분류 검증
        if (conversationData.detectedIntent !== expectedIntent) {
          result.issues.push(
            `Intent mismatch: expected "${expectedIntent}", got "${conversationData.detectedIntent}" for input "${userInput}"`
          );
          result.success = false;
        }
        
        // 응답 품질 검증
        const responseQuality = this.analyzer.analyzeResponseQuality(
          userInput,
          conversationData.aiResponse,
          expectedIntent
        );
        
        if (!responseQuality.isGood) {
          result.issues.push(
            `Poor response quality for "${userInput}": ${responseQuality.reason}`
          );
          result.success = false;
        }
        
        // 대화 로그 저장
        await this.logger.logConversation({
          sessionId: testSessionId,
          userInput,
          detectedIntent: conversationData.detectedIntent,
          aiResponse: conversationData.aiResponse,
          timestamp: new Date(),
          testScenario: scenario.name,
          intentAnalysisDetails: conversationData.intentAnalysisDetails
        });
        
        // 응답 간 간격
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      result.success = false;
      result.issues.push(`Test execution error: ${error.message}`);
      console.error(`❌ Error in scenario ${scenario.name}:`, error);
    }
    
    result.executionTime = Date.now() - startTime;
    console.log(`  ✅ Scenario completed in ${result.executionTime}ms`);
    
    return result;
  }

  private async sendMessageAndCollectData(
    userInput: string,
    sessionId: string,
    expectedIntent: string
  ): Promise<{
    detectedIntent: string;
    aiResponse: string;
    intentAnalysisDetails: any;
  }> {
    // 실제 채팅 API 호출 시뮬레이션
    // 이 부분은 실제 useChat 훅의 로직을 호출하거나
    // API 엔드포인트를 직접 호출해야 합니다.
    
    try {
      // 의도 분석 API 호출
      const intentResponse = await fetch(`${this.baseUrl}/api/chat/travel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          action: 'classifyIntent',
          sessionId: sessionId
        })
      });
      
      const intentData = await intentResponse.json();
      
      // 실제 채팅 응답 API 호출
      const chatResponse = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          sessionId: sessionId
        })
      });
      
      const chatData = await chatResponse.json();
      
      return {
        detectedIntent: intentData.intent || 'unknown',
        aiResponse: chatData.response || 'No response',
        intentAnalysisDetails: intentData
      };
      
    } catch (error) {
      console.error('API call failed:', error);
      return {
        detectedIntent: 'error',
        aiResponse: 'API Error',
        intentAnalysisDetails: { error: error.message }
      };
    }
  }

  private async generateTestReport(results: TestResult[]): Promise<void> {
    console.log('\n📊 TEST REPORT');
    console.log('================');
    
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    // 실패한 테스트 상세 정보
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`\n${result.scenarioName}:`);
        result.issues.forEach(issue => console.log(`  - ${issue}`));
      });
    }
    
    // 성능 정보
    const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
    console.log(`\n⏱️  Average Execution Time: ${avgExecutionTime.toFixed(0)}ms`);
    
    // 의도 분류 정확도
    const intentAccuracy = this.analyzer.calculateIntentAccuracy(results);
    console.log(`🎯 Intent Classification Accuracy: ${intentAccuracy.toFixed(1)}%`);
    
    // 보고서 파일 저장
    await this.saveTestReport(results);
  }

  private async saveTestReport(results: TestResult[]): Promise<void> {
    const reportData = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTests: results.length,
        successfulTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length,
        averageExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        intentAccuracy: this.analyzer.calculateIntentAccuracy(results)
      }
    };
    
    // 파일로 저장
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, '../test-reports', `chatbot-test-${Date.now()}.json`);
    
    // 디렉토리 생성
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Test report saved: ${reportPath}`);
  }
}

// 실행 스크립트
if (require.main === module) {
  const tester = new ChatbotTester();
  tester.runAllTests().then(results => {
    console.log('\n🎉 All tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}