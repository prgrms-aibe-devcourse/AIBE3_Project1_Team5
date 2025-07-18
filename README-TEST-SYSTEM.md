# 🤖 Chatbot Test System

## 개요
이 테스트 시스템은 AI 챗봇의 의도 분석, 응답 품질, 사용자 만족도를 자동으로 테스트하고 분석하는 종합적인 도구입니다.

## 📋 시스템 구성

### 1. 자동 테스트 스크립트 (`test/chatbot-test.ts`)
- **기능**: 다양한 시나리오의 자동 테스트 실행
- **테스트 시나리오**:
  - 여행 계획 시작 (제주도, 부산 등)
  - 기록 조회 (이전 기록, 저장된 계획)
  - 일반 대화 (인사, 날씨 등)
  - 파라미터 입력 중 상태 확인
  - 의도 분류 경계 케이스

### 2. 실시간 로깅 시스템 (`lib/conversationLogger.ts`)
- **기능**: 대화 과정을 실시간으로 모니터링 및 로깅
- **추적 항목**:
  - 사용자 입력과 AI 응답
  - 의도 분석 결과 (키워드 vs GPT)
  - 응답 품질 평가
  - 사용자 만족도 추정
  - 무한 루프 감지

### 3. DB 분석 도구 (`lib/chatAnalyzer.ts`)
- **기능**: 데이터베이스의 대화 로그를 분석하여 성능 메트릭 제공
- **분석 항목**:
  - 의도 분류 정확도
  - 응답 품질 점수
  - 사용자 만족도
  - 여행 파라미터 수집 완료율
  - 실패 패턴 분석

### 4. 통합 실행 스크립트 (`scripts/run-tests.ts`)
- **기능**: 모든 테스트 시스템을 통합 관리
- **제공 명령어**:
  - `setup`: 데이터베이스 스키마 설정
  - `test`: 단일 테스트 실행
  - `continuous`: 연속 테스트 실행
  - `analyze`: 분석만 실행
  - `all`: 전체 테스트 실행

## 🚀 사용법

### 1. 초기 설정
```bash
# 의존성 설치
npm install

# 데이터베이스 스키마 설정
npm run test-setup
```

### 2. 테스트 실행

#### 단일 테스트 실행
```bash
npm run test-run
```

#### 연속 테스트 실행 (30분간, 60초 간격)
```bash
npm run test-continuous 30 60
```

#### 분석만 실행
```bash
npm run test-analyze
```

#### 전체 테스트 실행
```bash
npm run test-all
```

### 3. 커스텀 명령어
```bash
# 특정 세션 테스트
npm run test-chatbot test session-id-123

# 1시간 연속 테스트, 30초 간격
npm run test-chatbot continuous 60 30

# 개발 서버 시작
npm run test-chatbot server
```

## 📊 분석 리포트

### 실시간 콘솔 출력
```
🔄 REAL-TIME CONVERSATION LOG
================================
📅 Time: 2024-01-15T10:30:00.000Z
🔑 Session: test-session-123
👤 User Input: "제주도 가고싶어"
🎯 Detected Intent: travel_start
🤖 AI Response: "제주도 여행 계획을 도와드릴게요..."
🔍 Keyword Analysis: travel_start (0.8)
🧠 GPT Analysis: travel_start (0.9)
✅ Final Result: travel_start (new_travel_request)
✅ Response Quality: 85/100 - Good response
😊 User Satisfaction: continued=true, abandoned=false, reAsked=false
```

### 분석 리포트 예시
```
📋 SYSTEM PERFORMANCE ANALYSIS REPORT
════════════════════════════════════════════════════════
💬 Total Conversations: 156
🎯 Overall Intent Accuracy: 82.5%
⭐ Overall Response Quality: 78.3/100
😊 Overall User Satisfaction: 71.2/100
⏱️  Avg Response Time: 1250ms
❌ Error Rate: 8.7%
✅ Completion Rate: 45.2%

🔍 Common Failure Patterns:
   • Intent mismatch: travel_start vs general (15 times)
   • Poor response: Response too short (8 times)
   • Poor response: Duplicate response (5 times)

💡 Recommendations:
   • Improve intent classification accuracy by enhancing keyword patterns
   • Enhance response quality by improving AI response templates
   • Address intent classification conflicts: travel_start vs general
```

## 🗃️ 데이터베이스 스키마

### 주요 테이블
- **conversation_logs**: 대화 로그 및 분석 결과
- **test_results**: 자동 테스트 실행 결과
- **system_metrics**: 일일 시스템 성능 메트릭
- **failure_patterns**: 실패 패턴 추적

### 주요 뷰
- **daily_performance_summary**: 일일 성과 요약
- **intent_accuracy_summary**: 의도 분류 정확도
- **failure_pattern_analysis**: 실패 패턴 분석

## 🔧 설정 옵션

### 테스트 시나리오 커스터마이징
`test/chatbot-test.ts`에서 테스트 시나리오를 수정할 수 있습니다:

```typescript
private testScenarios: TestScenario[] = [
  {
    name: "커스텀 시나리오",
    description: "사용자 정의 테스트",
    inputs: ["사용자 입력1", "사용자 입력2"],
    expectedIntents: ["예상 의도1", "예상 의도2"],
    expectedResponses: ["예상 응답1", "예상 응답2"]
  }
];
```

### 로깅 설정
`lib/conversationLogger.ts`에서 로깅 간격과 품질 기준을 조정할 수 있습니다:

```typescript
// 로그 플러시 간격 (밀리초)
this.flushInterval = setInterval(() => {
  this.flushLogs();
}, 5000);

// 응답 품질 점수 기준
return {
  isGood: score >= 70,  // 70점 이상을 양호로 판정
  reason: issues.join(', ') || 'Good response',
  score
};
```

## 📈 성능 모니터링

### 실시간 모니터링
- 콘솔에서 실시간 로그 확인
- 의도 분석 결과 즉시 표시
- 응답 품질 실시간 평가

### 일일 메트릭
- 자동으로 일일 성능 메트릭 계산
- 트렌드 분석 가능
- 실패 패턴 추적

### 알림 설정
필요시 `conversationLogger.ts`에서 임계값 기반 알림 설정:

```typescript
// 응답 품질이 낮거나 에러 발생 시 즉시 플러시
if (data.intentAnalysisDetails.error || !data.responseQuality.isGood) {
  await this.flushLogs();
  // 여기에 알림 로직 추가 가능
}
```

## 🛠️ 트러블슈팅

### 자주 발생하는 문제

1. **데이터베이스 연결 오류**
   ```bash
   # Supabase 연결 설정 확인
   # .env.local 파일의 SUPABASE_URL, SUPABASE_ANON_KEY 확인
   ```

2. **개발 서버 시작 실패**
   ```bash
   # 포트 3000이 사용 중인지 확인
   lsof -i :3000
   kill -9 <PID>
   ```

3. **테스트 시간 초과**
   ```bash
   # 타임아웃 설정 증가
   # chatbot-test.ts에서 timeout 값 조정
   ```

### 디버깅 팁

1. **상세 로그 활성화**
   ```typescript
   // 더 자세한 로그를 위해 console.log 추가
   console.log('🔍 Debug:', { userInput, detectedIntent, processingTime });
   ```

2. **특정 시나리오만 테스트**
   ```bash
   # 특정 시나리오만 실행하도록 코드 수정
   npm run test-chatbot test
   ```

3. **분석 결과 확인**
   ```bash
   # 분석 결과를 파일로 저장
   npm run test-analyze > analysis-report.txt
   ```

## 📝 기여 가이드

### 새로운 테스트 시나리오 추가
1. `test/chatbot-test.ts`에 새 시나리오 추가
2. 예상 결과 정의
3. 테스트 실행 및 검증

### 새로운 분석 메트릭 추가
1. `lib/chatAnalyzer.ts`에 새 분석 함수 추가
2. 데이터베이스 스키마 업데이트 (필요시)
3. 리포트 생성 로직 수정

### 로깅 개선
1. `lib/conversationLogger.ts`에 새 로깅 항목 추가
2. 품질 평가 기준 조정
3. 실시간 모니터링 개선

이 테스트 시스템을 통해 챗봇의 성능을 지속적으로 모니터링하고 개선할 수 있습니다.