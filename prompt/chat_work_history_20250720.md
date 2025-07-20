# Chat Work History - 2025.07.20

## 작업 내용

### 1. 서버 렌더링 에러 해결
- **문제**: 브라우저 새로고침 시 "Switched to client rendering because the server rendering errored" 에러
- **원인**: AuthProvider에서 `window.location.origin` 사용으로 인한 hydration 불일치
- **해결**: FloatingChat 컴포넌트를 클라이언트 전용 렌더링으로 변경
  ```typescript
  // components/chat/FloatingChat.tsx
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;
  ```

### 2. 406 에러 분석
- **문제**: GET request to session_parameters 테이블에서 406 (Not Acceptable) 에러
- **원인**: title 컬럼 추가 후 RLS 정책이 새 컬럼을 인식하지 못함
- **권장 해결**: Supabase에서 RLS 정책 재생성 필요
  ```sql
  DROP POLICY IF EXISTS "Users can manage own session parameters" ON session_parameters;
  CREATE POLICY "Users can manage own session parameters"
  ON session_parameters FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  ```

### 3. 현재 발생한 새로운 문제
- **문제**: CSS, JavaScript 파일들이 404 에러로 로드되지 않음
- **영향**: 화면이 정상적으로 그려지지 않음
- **파일들**: 
  - layout.css
  - main-app.js
  - app-pages-internals.js
  - page.js files

### 4. 파라미터 추출 맥락 개선
- **문제**: "도쿄" 입력 시 GPT가 빈 객체 `{}` 반환
- **원인**: 파라미터 추출 시 대화 맥락 정보 부족
- **해결**: extractTravelParameters 함수에 10개 대화 이력 추가
  ```typescript
  // lib/openai.ts
  export async function extractTravelParameters(
    userMessage: string, 
    existingParams?: any,
    recentMessages: string[] = []  // 🔥 추가
  )
  
  // hooks/useChat.ts
  const recentMessages = messages.slice(-10).map(msg => `${msg.role}: ${msg.content}`);
  const paramResult = await travelPlan.extractParameters(content, existingParams, recentMessages);
  ```

### 5. 진행 상황
- ✅ 서버 렌더링 에러 해결
- ✅ 파라미터 추출 맥락 개선
- ⏳ RLS 정책 수정 대기 (Supabase 설정)
- 🔴 개발 서버 정적 파일 로딩 문제 발생

## 다음 단계
1. Next.js 개발 서버 재시작 필요
2. "도쿄" 입력 테스트로 개선 효과 확인
3. 406 에러 해결을 위한 Supabase RLS 정책 업데이트