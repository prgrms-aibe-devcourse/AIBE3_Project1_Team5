import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { chatService, ChatSession, ChatMessage } from '@/lib/chatService';
import { ChatSessionService } from '@/lib/chatSessionService';
import { useTravelPlan } from './useTravelPlan';
import { travelPlanService } from '@/lib/travelPlanService';

interface Message {
  id: string;
  session_id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  user_id?: string;
  travelPlan?: any; // 여행 계획 데이터 (선택사항)
  showSettingButtons?: boolean; // 설정 버튼 표시 여부
  showSettingEditor?: boolean; // 설정 편집기 표시 여부
  currentSettings?: any; // 현재 설정 (편집기용)
  isWelcomeMessage?: boolean; // 웰컴 메시지 여부 (중복 감지 제외용)
}

// 키워드 기반 의도 분석
function analyzeByKeywords(content: string, existingParams: any): {intent: string, confidence: number} {
  const lowerContent = content.toLowerCase();
  
  // 1. 진행중인 계획 확인 키워드 (높은 신뢰도)
  const statusInquiryKeywords = [
    '작업중이던', '작업중인', '진행중인', '진행중이던', '진행하던',
    '이전 기록', '기록이 있', '계획이 있', '여행이 있', '일정이 있',
    '계속하던', '하던', '중이던', '기존', '예전', '전에', '이미'
  ];
  
  // 2. 새로운 여행 시작 키워드
  const startKeywords = [
    '새로운 여행', '새 여행', '다른 여행', '여행 계획', '여행 가고',
    '어디로 갈까', '어디 가자', '계획 세우자', '일정 짜자'
  ];
  
  // 3. 여행 재개 키워드
  const resumeKeywords = [
    '계속 해', '계속해줘', '이어서', '재개', '다시 시작', '진행'
  ];
  
  // 4. 여행 취소 키워드
  const cancelKeywords = [
    '그만', '중단', '취소', '멈춰', '안할래', '안갈래', '안간다'
  ];
  
  // 키워드 매칭 및 신뢰도 계산
  for (const keyword of statusInquiryKeywords) {
    if (lowerContent.includes(keyword)) {
      return {intent: 'travel_continue', confidence: 0.9};
    }
  }
  
  for (const keyword of cancelKeywords) {
    if (lowerContent.includes(keyword)) {
      return {intent: 'travel_cancel', confidence: 0.95};
    }
  }
  
  for (const keyword of resumeKeywords) {
    if (lowerContent.includes(keyword)) {
      return {intent: 'travel_resume', confidence: 0.85};
    }
  }
  
  for (const keyword of startKeywords) {
    if (lowerContent.includes(keyword)) {
      return {intent: 'travel_start', confidence: 0.8};
    }
  }
  
  // 일반적인 여행 관련 키워드
  const generalTravelKeywords = ['여행', '계획', '일정', '도시', '나라', '관광'];
  const hasTravelKeyword = generalTravelKeywords.some(keyword => lowerContent.includes(keyword));
  
  if (hasTravelKeyword) {
    return {intent: 'travel_start', confidence: 0.6};
  }
  
  return {intent: 'general', confidence: 0.7};
}

// GPT 기반 의도 분석 (기존 함수)
async function analyzeByGPT(content: string, existingParams: any, messages: Message[]): Promise<{intent: string, confidence: number}> {
  try {
    const recentMessages = messages.slice(-3).map(msg => msg.content);
    const hasExistingParams = existingParams && existingParams.collection_status === 'incomplete';
    
    const response = await fetch('/api/chat/travel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: content,
        action: 'classifyIntent',
        hasExistingParams,
        recentMessages
      }),
    });

    if (!response.ok) {
      throw new Error('GPT API failed');
    }

    const result = await response.json();
    return {
      intent: result.intent,
      confidence: result.confidence || 0.7
    };
  } catch (error) {
    console.error('Error in GPT intent analysis:', error);
    return {intent: 'general', confidence: 0.3};
  }
}

// 결과 종합 및 충돌 해결
function reconcileResults(
  keywordResult: {intent: string, confidence: number},
  gptResult: {intent: string, confidence: number},
  content: string,
  existingParams: any
): {isTravel: boolean, reason: string, shouldOfferContinue: boolean, intent: string} {
  
  console.log('🔍 Double Check Results:', {
    keyword: keywordResult,
    gpt: gptResult,
    input: content
  });
  
  // 1. 높은 신뢰도 키워드 결과 우선 (신뢰도 0.9 이상)
  if (keywordResult.confidence >= 0.9) {
    console.log('✅ High confidence keyword result used');
    return convertToFinalResult(keywordResult.intent, existingParams);
  }
  
  // 2. 두 결과가 일치하는 경우
  if (keywordResult.intent === gptResult.intent) {
    console.log('✅ Both analyses agree');
    return convertToFinalResult(keywordResult.intent, existingParams);
  }
  
  // 3. 충돌 해결 규칙
  const conflictResolution = {
    // 키워드가 상태 확인으로 판단했고, GPT가 다르게 판단한 경우
    'travel_continue': {
      priority: 'keyword', // 상태 확인은 키워드가 더 정확
      reason: 'Status inquiry is better detected by keywords'
    },
    // GPT가 취소로 판단했고, 키워드가 다르게 판단한 경우
    'travel_cancel': {
      priority: 'gpt', // 취소 의도는 GPT가 더 정확
      reason: 'Cancel intent is better detected by GPT context'
    }
  };
  
  // 4. 충돌 해결 로직
  if (keywordResult.intent === 'travel_continue' && gptResult.intent !== 'travel_continue') {
    console.log('🔄 Keyword detected status inquiry, overriding GPT');
    return convertToFinalResult('travel_continue', existingParams);
  }
  
  if (gptResult.intent === 'travel_cancel' && keywordResult.intent !== 'travel_cancel') {
    console.log('🔄 GPT detected cancel intent, overriding keyword');
    return convertToFinalResult('travel_cancel', existingParams);
  }
  
  // 5. 기본적으로 더 높은 신뢰도를 가진 결과 선택
  const chosenResult = keywordResult.confidence >= gptResult.confidence ? keywordResult : gptResult;
  console.log(`🎯 Chosen result: ${chosenResult.intent} (confidence: ${chosenResult.confidence})`);
  
  return convertToFinalResult(chosenResult.intent, existingParams);
}

// 최종 결과 변환 함수
function convertToFinalResult(intent: string, existingParams: any): {isTravel: boolean, reason: string, shouldOfferContinue: boolean, intent: string} {
  const hasExistingParams = existingParams && existingParams.collection_status === 'incomplete';
  
  switch (intent) {
    case 'travel_start':
      return {isTravel: true, reason: 'new_travel_request', shouldOfferContinue: false, intent};
    case 'travel_continue':
      return {isTravel: false, reason: 'travel_status_inquiry', shouldOfferContinue: false, intent};
    case 'travel_resume':
      return {isTravel: true, reason: 'resume_requested', shouldOfferContinue: false, intent};
    case 'travel_cancel':
      return {isTravel: false, reason: 'stop_requested', shouldOfferContinue: false, intent};
    case 'general':
      const shouldOffer = hasExistingParams;
      return {isTravel: false, reason: shouldOffer ? 'general_with_travel_progress' : 'general_conversation', shouldOfferContinue: shouldOffer, intent};
    default:
      return {isTravel: false, reason: 'unknown_intent', shouldOfferContinue: false, intent};
  }
}

// 하이브리드 여행 처리 판단 함수 (Double Check)
async function shouldProcessAsTravel(
  content: string, 
  existingParams: any, 
  messages: Message[]
): Promise<{isTravel: boolean, reason: string, shouldOfferContinue: boolean, intent?: string}> {
  
  try {
    // 1단계: 키워드 기반 분석
    const keywordResult = analyzeByKeywords(content, existingParams);
    
    // 2단계: GPT 기반 분석
    const gptResult = await analyzeByGPT(content, existingParams, messages);
    
    // 3단계: 결과 종합 및 충돌 해결
    const finalResult = reconcileResults(keywordResult, gptResult, content, existingParams);
    
    return finalResult;
  } catch (error) {
    console.error('Error in hybrid intent classification:', error);
    // 에러 발생 시 키워드 방식으로 fallback
    return fallbackKeywordClassification(content, existingParams);
  }
}

// Fallback 키워드 기반 분류 함수
function fallbackKeywordClassification(
  content: string, 
  existingParams: any
): {isTravel: boolean, reason: string, shouldOfferContinue: boolean} {
  const resumeKeywords = ['계속', '다시', '재개', '진행', '이어서', '계속해줘', '다시 시작'];
  const stopKeywords = ['그만', '중단', '취소', '멈춰', '안할래', '안갈래', '안간다'];
  const travelKeywords = ['여행', '계획', '일정', '도쿄', '파리', '뉴욕', '일본', '한국', '유럽', '미국', '중국', '태국', '베트남'];
  
  const hasResumeKeyword = resumeKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  const hasStopKeyword = stopKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  const hasTravelKeyword = travelKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // 진행 중인 여행 파라미터가 있는 경우
  if (existingParams && existingParams.collection_status === 'incomplete') {
    if (hasResumeKeyword) {
      return {isTravel: true, reason: 'resume_requested', shouldOfferContinue: false};
    }
    
    if (hasStopKeyword) {
      return {isTravel: false, reason: 'stop_requested', shouldOfferContinue: false};
    }
    
    if (hasTravelKeyword) {
      return {isTravel: true, reason: 'travel_keyword_with_existing', shouldOfferContinue: false};
    }
    
    // 일반 질문이지만 여행 진행 중이므로 계속 옵션 제공
    return {isTravel: false, reason: 'general_with_travel_progress', shouldOfferContinue: true};
  }
  
  // 새로운 여행 요청 체크
  if (hasTravelKeyword) {
    return {isTravel: true, reason: 'new_travel_request', shouldOfferContinue: false};
  }
  
  return {isTravel: false, reason: 'general_conversation', shouldOfferContinue: false};
}

// 일정 세부사항 요청 감지 함수
function isDetailRequest(content: string): boolean {
  const detailKeywords = [
    '자세한', '상세', '전체', '일정표', '세부', '더보기', '더 보기',
    '구체적', '자세히', '상세히', '세부사항', '일정 보여', '계획 보여',
    '테이블', '표로', '전체보기', '전체 보기'
  ];
  
  const cleanContent = content.toLowerCase().replace(/\s/g, '');
  return detailKeywords.some(keyword => 
    cleanContent.includes(keyword.replace(/\s/g, ''))
  );
}

// 중복 응답 감지 함수
function isDuplicateResponse(newResponse: string, recentMessages: Message[]): boolean {
  // 입력값 검증
  if (!newResponse || typeof newResponse !== 'string') {
    return false;
  }

  const recentAiMessages = recentMessages
    .filter(msg => msg.role === 'assistant' && msg.content && typeof msg.content === 'string' && !msg.isWelcomeMessage) // 웰컴 메시지 제외
    .slice(-3) // 최근 3개 AI 응답만 확인
    .map(msg => msg.content.toLowerCase().replace(/\s/g, ''));
  
  const newResponseClean = newResponse.toLowerCase().replace(/\s/g, '');
  
  // 완전히 동일하거나 80% 이상 유사한 응답인지 확인
  return recentAiMessages.some(prevResponse => {
    if (prevResponse === newResponseClean) return true;
    
    // 간단한 유사도 체크 (공통 부분 비율)
    const commonLength = Math.max(prevResponse.length, newResponseClean.length);
    const similarity = calculateSimilarity(prevResponse, newResponseClean);
    return similarity > 0.8 && commonLength > 50; // 50자 이상이고 80% 이상 유사
  });
}

// 문자열 유사도 계산 (간단한 구현)
function calculateSimilarity(str1: string, str2: string): number {
  // 입력값 검증
  if (!str1 || !str2 || typeof str1 !== 'string' || typeof str2 !== 'string') {
    return 0;
  }

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// 편집 거리 계산 (레벤슈타인 거리)
function getEditDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 일반 대화 응답 생성 헬퍼 함수
async function generateGeneralResponse(
  content: string, 
  messages: Message[]
): Promise<string> {
  const conversationHistory = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message: content,
      conversationHistory: conversationHistory
    }),
  });
  
  if (!response.ok) throw new Error('API request failed');
  const data = await response.json();
  
  
  return data.response;
}

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCollectingTravelParams, setIsCollectingTravelParams] = useState(false);
  
  // 여행 계획 관련 훅
  const travelPlan = useTravelPlan();

  // 세션 초기화 및 메시지 로드
  useEffect(() => {
    if (!user) {
      setIsInitializing(false);
      return;
    }

    const initializeChat = async () => {
      try {
        // 활성 세션 가져오기 또는 생성
        const session = await chatService.getOrCreateActiveSession(user.id);
        if (!session) {
          console.error('Failed to get or create session');
          setIsInitializing(false);
          return;
        }

        setCurrentSession(session);

        // 세션의 메시지 로드
        const sessionMessages = await chatService.getSessionMessages(session.id);
        
        // ChatMessage를 Message 형식으로 변환
        const formattedMessages: Message[] = sessionMessages.map((msg) => ({
          id: msg.id,
          session_id: msg.session_id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          user_id: msg.user_id,
        }));

        // 메시지가 없으면 웰컴 메시지 추가
        if (formattedMessages.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome-' + Date.now(),
            role: 'assistant',
            content: '안녕하세요! 여행 계획을 도와드릴 AI 어시스턴트입니다. 어떤 여행을 계획하고 계신가요?',
            timestamp: new Date(),
            isWelcomeMessage: true,
          };
          setMessages([welcomeMessage]);
        } else {
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [user]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !currentSession) {
        console.error('No user or session available');
        return;
      }

      // 1단계: 현재 세션의 여행 파라미터 수집 상태 확인
      const existingParams = await travelPlanService.getSessionParameters(currentSession.id);

      // 사용자 메시지 추가 (임시 ID로)
      const tempUserMessage: Message = {
        id: 'temp-user-' + Date.now(),
        session_id: currentSession.id,
        role: 'user',
        content,
        timestamp: new Date(),
        user_id: user.id,
      };

      setMessages((prev) => [...prev, tempUserMessage]);
      setIsLoading(true);

      try {
        // 사용자 메시지 저장
        const savedUserMessage = await chatService.saveMessage(
          currentSession.id,
          user.id,
          'user',
          content
        );

        if (savedUserMessage) {
          // 임시 메시지를 실제 저장된 메시지로 교체
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempUserMessage.id
                ? {
                    ...msg,
                    id: savedUserMessage.id,
                    timestamp: new Date(savedUserMessage.created_at),
                  }
                : msg
            )
          );
        }

        // AI 응답 생성
        let aiResponse: string;
        
        try {
          // 우선 일정 세부사항 요청인지 확인 (최근 여행 계획이 있는 경우)
          if (isDetailRequest(content) && travelPlan.currentPlan) {
            aiResponse = `📋 현재 여행 계획의 상세 정보입니다!

아래 카드에서 "전체 일정표" 버튼을 클릭하시면 더 자세한 표 형식의 일정을 확인하실 수 있어요. 수정이나 다운로드도 가능합니다! 😊`;
            
            // AI 응답 메시지 추가 (임시 ID로)
            const tempAiMessage: Message = {
              id: 'temp-ai-' + Date.now(),
              session_id: currentSession.id,
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date(),
              user_id: user.id,
              travelPlan: travelPlan.currentPlan,
            };

            setMessages((prev) => [...prev, tempAiMessage]);

            // AI 응답 저장
            const savedAiMessage = await chatService.saveMessage(
              currentSession.id,
              user.id,
              'assistant',
              aiResponse
            );

            if (savedAiMessage) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempAiMessage.id
                    ? {
                        ...msg,
                        id: savedAiMessage.id,
                        timestamp: new Date(savedAiMessage.created_at),
                        travelPlan: travelPlan.currentPlan,
                      }
                    : msg
                )
              );
            }
            
            return; // 여기서 함수 종료
          }

          // 2단계: GPT 기반 하이브리드 처리 로직
          const shouldContinueTravel = await shouldProcessAsTravel(content, existingParams, messages);
          
          if (shouldContinueTravel.isTravel) {
              // 여행 관련 처리 (타임아웃 120초로 연장)
              const travelTimeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('여행 계획 생성 시간 초과')), 120000)
              );
              
              const travelProcessPromise = async () => {
                // 4단계: 기존 파라미터와 새 파라미터 병합
                let currentParams = {};
                if (existingParams) {
                  currentParams = {
                    destination: existingParams.destination,
                    duration: existingParams.duration,
                    peopleCount: existingParams.people_count,
                    budget: existingParams.budget,
                    travelStyle: existingParams.travel_style,
                    transportation: existingParams.transportation,
                    accommodation: existingParams.accommodation,
                    collection_status: existingParams.collection_status
                  };
                  console.log('📊 현재 파라미터:', currentParams);
                }
                
                // 재개 요청이거나 여행 취소 처리
                if (shouldContinueTravel.intent === 'travel_cancel') {
                  // 여행 파라미터 완전 삭제
                  if (existingParams) {
                    await travelPlanService.deleteSessionParameters(currentSession.id);
                  }
                  return '여행 계획을 취소했습니다. 언제든지 다시 여행 계획을 세우고 싶으시면 말씀해주세요!';
                }
                
                
                if (shouldContinueTravel.reason === 'resume_requested') {
                  const missingParams = existingParams?.missing_params || [];
                  if (missingParams.length > 0) {
                    const question = await travelPlan.generateQuestion(missingParams[0]);
                    return question;
                  }
                }
                
                // 새로운 파라미터 추출 및 기존 파라미터와 병합
                const paramResult = await travelPlan.extractParameters(content, existingParams);
                
                // 목적지 변경 감지 및 확인 처리
                if (paramResult.destinationChanged && existingParams?.destination) {
                  const newDestination = paramResult.collectedParams.destination;
                  const previousDestination = existingParams.destination;
                  
                  if (newDestination && newDestination !== previousDestination) {
                    // 기존 파라미터 확인 메시지 생성
                    const response = await fetch('/api/chat/travel', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ 
                        action: 'generateParameterConfirmation',
                        newDestination,
                        previousDestination,
                        existingParams
                      }),
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      
                      // 임시로 목적지만 업데이트하고 확인 대기 상태로 설정
                      await travelPlanService.createOrUpdateSessionParameters(
                        currentSession.id,
                        user.id,
                        { 
                          ...currentParams,
                          destination: newDestination,
                          collection_status: 'awaiting_confirmation' as const
                        },
                        []
                      );
                      
                      // 버튼을 표시하도록 플래그 설정된 메시지 반환
                      const confirmMessage = {
                        content: result.confirmationMessage,
                        showButtons: true
                      };
                      return confirmMessage;
                    }
                  }
                }
                
                // 설정 변경 메시지 처리
                if (content.startsWith('설정 변경:')) {
                  // 변경된 설정 파싱
                  const changedSettingsStr = content.replace('설정 변경:', '').trim();
                  const changedSettings: any = {};
                  
                  // "기간: 5, 예산: 2000000" 형식 파싱
                  changedSettingsStr.split(',').forEach(item => {
                    const [key, value] = item.split(':').map(s => s.trim());
                    if (key === '기간') changedSettings.duration = parseInt(value);
                    else if (key === '인원') changedSettings.peopleCount = parseInt(value);
                    else if (key === '예산') changedSettings.budget = parseInt(value);
                    else if (key === '여행스타일') changedSettings.travelStyle = value;
                    else if (key === '교통수단') changedSettings.transportation = value;
                    else if (key === '숙박') changedSettings.accommodation = value;
                  });
                  
                  // 기존 파라미터와 병합
                  const updatedParams = { ...currentParams, ...changedSettings };
                  
                  // 파라미터 업데이트 및 계획 생성
                  await travelPlanService.createOrUpdateSessionParameters(
                    currentSession.id,
                    user.id,
                    { ...updatedParams, collection_status: 'complete' as const },
                    []
                  );
                  
                  const plan = await travelPlan.generateTravelPlan(updatedParams);
                  
                  // 여행 계획 저장
                  await travelPlanService.createTravelPlan(
                    user.id,
                    currentSession.id,
                    updatedParams,
                    plan
                  );
                  
                  // 계획 메시지와 함께 반환
                  const planMessage = `🎉 ${plan.title}이 업데이트되었습니다!
                  
📅 변경된 설정으로 ${plan.duration}일간의 새로운 여행 계획을 준비했어요.`;
                  
                  return {
                    content: planMessage,
                    plan: plan
                  };
                }
                
                // 설정 변경 취소 처리
                if (content === '설정 변경을 취소했습니다.') {
                  // collection_status를 다시 complete로 변경
                  await travelPlanService.createOrUpdateSessionParameters(
                    currentSession.id,
                    user.id,
                    { ...currentParams, collection_status: 'complete' as const },
                    []
                  );
                  
                  return '설정 변경을 취소했습니다. 기존 설정을 유지합니다.';
                }
                
                // 사용자 응답이 확인/거부/부분수정인지 체크
                const confirmationKeywords = {
                  keepAll: ['네', '그대로', '유지', '맞아요', '그래요', '계속', '좋아요', '네, 그대로 해주세요'],
                  resetAll: ['다시 설정', '새로', '처음부터', '리셋', '초기화', '안할래', '다시 설정할게요'],
                  partial: ['일부', '부분', '몇개만', '조금만', '바꿀게요', '일부만 바꿀게요']
                };
                
                if (existingParams?.collection_status === 'awaiting_confirmation') {
                  const userResponse = content.toLowerCase();
                  
                  console.log('🔍 사용자 응답:', userResponse);
                  console.log('📋 현재 collection_status:', existingParams.collection_status);
                  
                  // 정확한 매칭을 위해 우선순위 체크
                  if (userResponse === '네, 그대로 해주세요' || confirmationKeywords.keepAll.some(keyword => userResponse === keyword)) {
                    // 기존 설정 유지하고 계획 생성
                    const plan = await travelPlan.generateTravelPlan(currentParams);
                    
                    // 완료된 파라미터 저장
                    await travelPlanService.createOrUpdateSessionParameters(
                      currentSession.id,
                      user.id,
                      { 
                        ...currentParams, 
                        collection_status: 'complete' as const 
                      },
                      []
                    );
                    
                    // 여행 계획 저장
                    await travelPlanService.createTravelPlan(
                      user.id,
                      currentSession.id,
                      currentParams,
                      plan
                    );
                    
                    // 여행 계획과 함께 메시지 생성
                    const planMessage = `🎉 ${plan.title}이 완성되었습니다!

📅 ${plan.duration}일간의 멋진 여행을 준비했어요. 아래 일정을 확인하고 필요시 수정하거나 다운로드해주세요.`;

                    // AI 응답 메시지 추가 (임시 ID로) - 여행 계획 포함
                    const tempAiMessage: Message = {
                      id: 'temp-ai-' + Date.now(),
                      session_id: currentSession.id,
                      role: 'assistant',
                      content: planMessage,
                      timestamp: new Date(),
                      user_id: user.id,
                      travelPlan: plan, // 생성된 여행 계획 포함
                    };

                    setMessages((prev) => [...prev, tempAiMessage]);

                    // AI 응답 저장
                    const savedAiMessage = await chatService.saveMessage(
                      currentSession.id,
                      user.id,
                      'assistant',
                      planMessage
                    );

                    if (savedAiMessage) {
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === tempAiMessage.id
                            ? {
                                ...msg,
                                id: savedAiMessage.id,
                                timestamp: new Date(savedAiMessage.created_at),
                                travelPlan: plan, // 여행 계획 데이터 유지
                              }
                            : msg
                        )
                      );
                    }
                    
                    return; // 여기서 함수 종료
                  } else if (userResponse === '다시 설정할게요' || userResponse === '다시 설정' || userResponse === '처음부터') {
                    console.log('✅ 다시 설정 선택됨');
                    // 모든 파라미터 초기화하고 새로 시작
                    await travelPlanService.createOrUpdateSessionParameters(
                      currentSession.id,
                      user.id,
                      { 
                        destination: (currentParams as any).destination,
                        collection_status: 'incomplete' as const
                      },
                      ['duration', 'peopleCount', 'budget', 'travelStyle', 'transportation', 'accommodation']
                    );
                    
                    // 파라미터 수집 상태를 초기화
                    travelPlan.resetState();
                    
                    return `${(currentParams as any).destination} 여행을 처음부터 새로 계획해드릴게요! 
                    
며칠 동안 여행하실 예정인가요? (예: 2박3일, 1주일 등)`;
                  } else if (userResponse === '일부만 바꿀게요' || userResponse === '일부 수정' || userResponse === '일부만') {
                    console.log('✅ 일부만 수정 선택됨');
                    // 부분 수정 모드 - 편집기 표시
                    const editorMessage = {
                      content: '수정하고 싶은 항목을 선택해주세요. 각 항목 옆의 "수정" 버튼을 클릭하면 변경할 수 있습니다.',
                      showSettingEditor: true,
                      currentSettings: {
                        duration: (currentParams as any).duration,
                        peopleCount: (currentParams as any).people_count,
                        budget: (currentParams as any).budget,
                        travelStyle: (currentParams as any).travel_style,
                        transportation: (currentParams as any).transportation,
                        accommodation: (currentParams as any).accommodation
                      }
                    };
                    return editorMessage;
                  }
                  // 확인 응답이 명확하지 않으면 다시 질문
                  return `죄송해요, 명확하지 않네요. 다시 선택해주세요:
                  
• "네, 그대로 해주세요" → 기존 설정으로 계획 생성
• "다시 설정할게요" → 처음부터 새로 설정
• "일부만 바꿀게요" → 원하는 항목만 수정`;
                }
                
                // 자유 입력 필드 유효성 검사
                const freeInputFields = ['destination', 'transportation', 'accommodation', 'travelStyle'];
                for (const [param, value] of Object.entries(paramResult.collectedParams)) {
                  if (freeInputFields.includes(param) && value) {
                    const validationResponse = await fetch('/api/chat/travel', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ 
                        action: 'validateParameter',
                        paramType: param,
                        userInput: value
                      }),
                    });
                    
                    if (validationResponse.ok) {
                      const validation = await validationResponse.json();
                      if (!validation.isValid) {
                        return `${validation.reason || '올바르지 않은 입력입니다.'}\n${validation.suggestion || '다시 입력해주세요.'}`;
                      }
                    }
                  }
                }
                
                const mergedParams = { 
                  ...currentParams, 
                  ...paramResult.collectedParams
                };
                
                // ambiguousParams 처리 (확인 질문 생성)
                if (paramResult.ambiguousParams && Object.keys(paramResult.ambiguousParams).length > 0) {
                  const ambiguousParam = Object.keys(paramResult.ambiguousParams)[0];
                  const userInput = paramResult.ambiguousParams[ambiguousParam];
                  
                  // 확인 질문 생성
                  const response = await fetch('/api/chat/travel', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                      action: 'generateClarificationQuestion',
                      missingParam: ambiguousParam,
                      userInput: userInput
                    }),
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    return result.question;
                  }
                }
                
                // 필수 파라미터 체크
                const requiredParams = ['destination', 'duration', 'peopleCount', 'budget', 'travelStyle', 'transportation', 'accommodation'];
                const missingParams = requiredParams.filter(param => !mergedParams[param as keyof typeof mergedParams]);
                
                const isComplete = missingParams.length === 0;
                
                console.log('🔍 파라미터 체크:', { isComplete, missingParams, collection_status: mergedParams.collection_status });
                
                // collection_status가 incomplete이거나 awaiting_confirmation이면 계획 생성하지 않음
                if (mergedParams.collection_status === 'incomplete' || mergedParams.collection_status === 'awaiting_confirmation') {
                  console.log('⏸️ collection_status가', mergedParams.collection_status, '이므로 계획 생성 건너뜀');
                  if (missingParams.length > 0) {
                    const question = await travelPlan.generateQuestion(missingParams[0]);
                    return question;
                  }
                  // awaiting_confirmation이면 아무것도 반환하지 않음 (이미 위에서 처리됨)
                  return '설정을 확인 중입니다...';
                }
                
                if (isComplete) {
                  // 진행 상황 메시지 표시
                  const progressMessage: Message = {
                    id: 'progress-' + Date.now(),
                    session_id: currentSession.id,
                    role: 'assistant',
                    content: '🔄 여행 계획을 생성하고 있습니다...\n\n📋 수집된 정보를 바탕으로 맞춤형 일정을 만들어드릴게요. 잠시만 기다려주세요!',
                    timestamp: new Date(),
                    user_id: user.id,
                  };
                  setMessages((prev) => [...prev, progressMessage]);
                  
                  // 모든 파라미터가 수집되었으면 일정 생성
                  const plan = await travelPlan.generateTravelPlan(mergedParams);
                  
                  // 진행 상황 메시지 제거
                  setMessages((prev) => prev.filter(msg => msg.id !== progressMessage.id));
                  
                  // 데이터베이스에 완료된 파라미터 저장
                  await travelPlanService.createOrUpdateSessionParameters(
                    currentSession.id,
                    user.id,
                    mergedParams,
                    [] // 모든 파라미터 수집 완료
                  );
                  
                  // 여행 계획을 데이터베이스에 저장
                  const savedPlan = await travelPlanService.createTravelPlan(
                    user.id,
                    currentSession.id,
                    mergedParams,
                    plan
                  );
                  
                  // 여행 계획과 함께 메시지 생성
                  const planMessage = `🎉 ${plan.title}이 완성되었습니다!

📅 ${plan.duration}일간의 멋진 여행을 준비했어요. 아래 일정을 확인하고 필요시 수정하거나 다운로드해주세요.`;

                  console.log('🎯 여행 계획 생성 완료:', plan.title);
                  console.log('📋 계획 데이터:', plan);
                  console.log('⏰ 계획 생성 시간:', new Date().toISOString());

                  // AI 응답 메시지 추가 (임시 ID로) - 여행 계획 포함
                  const tempAiMessage: Message = {
                    id: 'temp-ai-' + Date.now(),
                    session_id: currentSession.id,
                    role: 'assistant',
                    content: planMessage,
                    timestamp: new Date(),
                    user_id: user.id,
                    travelPlan: plan, // 생성된 여행 계획 포함
                  };

                  console.log('📝 메시지에 여행 계획 포함됨:', !!tempAiMessage.travelPlan);

                  setMessages((prev) => [...prev, tempAiMessage]);

                  // AI 응답 저장
                  const savedAiMessage = await chatService.saveMessage(
                    currentSession.id,
                    user.id,
                    'assistant',
                    planMessage
                  );

                  if (savedAiMessage) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === tempAiMessage.id
                          ? {
                              ...msg,
                              id: savedAiMessage.id,
                              timestamp: new Date(savedAiMessage.created_at),
                              travelPlan: plan, // 여행 계획 데이터 유지
                            }
                          : msg
                      )
                    );
                  }
                  
                  return; // 여기서 함수 종료
                } else {
                  // 부족한 파라미터가 있으면 질문 생성
                  const question = await travelPlan.generateQuestion(missingParams[0]);
                  
                  // 부분적으로 수집된 파라미터 저장 (병합된 파라미터 사용)
                  await travelPlanService.createOrUpdateSessionParameters(
                    currentSession.id,
                    user.id,
                    mergedParams,
                    missingParams
                  );
                  
                  return question;
                }
              };
              
              const result = await Promise.race([travelProcessPromise(), travelTimeoutPromise]);
              
              // 객체로 반환된 경우 (버튼 표시가 필요한 경우 또는 계획이 포함된 경우)
              if (typeof result === 'object' && (result.showButtons || result.showSettingEditor || result.plan)) {
                aiResponse = result.content;
                // 메시지에 버튼 또는 편집기 표시 플래그 추가
                const tempAiMessage: Message = {
                  id: 'temp-ai-' + Date.now(),
                  session_id: currentSession.id,
                  role: 'assistant',
                  content: aiResponse,
                  timestamp: new Date(),
                  user_id: user.id,
                  showSettingButtons: result.showButtons,
                  showSettingEditor: result.showSettingEditor,
                  currentSettings: result.currentSettings,
                  travelPlan: result.plan, // 계획이 있으면 포함
                };
                
                setMessages((prev) => [...prev, tempAiMessage]);
                
                // AI 응답 저장
                const savedAiMessage = await chatService.saveMessage(
                  currentSession.id,
                  user.id,
                  'assistant',
                  aiResponse
                );
                
                if (savedAiMessage) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === tempAiMessage.id
                        ? {
                            ...msg,
                            id: savedAiMessage.id,
                            timestamp: new Date(savedAiMessage.created_at),
                            showSettingButtons: result.showButtons,
                            showSettingEditor: result.showSettingEditor,
                            currentSettings: result.currentSettings,
                            travelPlan: result.plan,
                          }
                        : msg
                    )
                  );
                }
                
                return; // 버튼/편집기 표시 후 함수 종료
              } else {
                aiResponse = result;
                
                // 문자열 응답인 경우 - 추가 처리 없이 메시지만 표시
                if (typeof result === 'string') {
                  const tempAiMessage: Message = {
                    id: 'temp-ai-' + Date.now(),
                    session_id: currentSession.id,
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date(),
                    user_id: user.id,
                  };
                  
                  setMessages((prev) => [...prev, tempAiMessage]);
                  
                  // AI 응답 저장
                  const savedAiMessage = await chatService.saveMessage(
                    currentSession.id,
                    user.id,
                    'assistant',
                    aiResponse
                  );
                  
                  if (savedAiMessage) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === tempAiMessage.id
                          ? {
                              ...msg,
                              id: savedAiMessage.id,
                              timestamp: new Date(savedAiMessage.created_at),
                            }
                          : msg
                      )
                    );
                  }
                  
                  return; // 여기서 함수 종료
                }
              }
            } else {
              // 일반 대화 처리
              if (shouldContinueTravel.intent === 'travel_continue') {
                // 진행중인 여행 계획 상태 확인 요청 처리
                if (existingParams && existingParams.collection_status === 'incomplete') {
                  // 진행중인 계획이 있는 경우
                  const collectedInfo = [];
                  if (existingParams.destination) collectedInfo.push(`📍 목적지: ${existingParams.destination}`);
                  if (existingParams.duration) collectedInfo.push(`📅 기간: ${existingParams.duration}일`);
                  if (existingParams.people_count) collectedInfo.push(`👥 인원: ${existingParams.people_count}명`);
                  if (existingParams.budget) collectedInfo.push(`💰 예산: ${existingParams.budget}만원`);
                  if (existingParams.travel_style) collectedInfo.push(`🎯 여행 스타일: ${existingParams.travel_style}`);
                  if (existingParams.transportation) collectedInfo.push(`🚗 교통수단: ${existingParams.transportation}`);
                  if (existingParams.accommodation) collectedInfo.push(`🏨 숙박: ${existingParams.accommodation}`);
                  
                  const infoText = collectedInfo.length > 0 ? '\n\n' + collectedInfo.join('\n') : '';
                  const missingCount = existingParams.missing_params?.length || 0;
                  const totalCount = 7; // 총 필수 파라미터 개수
                  const progress = Math.round(((totalCount - missingCount) / totalCount) * 100);
                  
                  aiResponse = `네, 현재 진행중인 여행 계획이 있습니다! (진행률: ${progress}%)${infoText}

🔄 계속 진행하시려면 "계속 진행"이라고 말씀해주세요.
🆕 새로운 계획을 시작하시려면 "새로운 계획"이라고 말씀해주세요.`;
                } else {
                  // 진행중인 계획이 없는 경우
                  aiResponse = `아니요, 현재 진행중인 여행 계획이 없습니다.

새로운 여행 계획을 시작해볼까요? 어느 도시나 지역을 방문하고 싶으신가요?`;
                }
              } else if (shouldContinueTravel.shouldOfferContinue) {
                // 기존 여행 계획이 있고 일반 질문을 한 경우 - 자연스러운 선택 유도
                const generalResponse = await generateGeneralResponse(content, messages);
                aiResponse = `${generalResponse}\n\n혹시 진행 중인 여행 계획과 관련된 질문인가요? 관련 질문이시면 "네"라고 답해주시고, 그냥 일반적인 질문이시면 언제든 편하게 물어보세요!`;
              } else {
                // 순수 일반 대화
                aiResponse = await generateGeneralResponse(content, messages);
              }
            }
        } catch (timeoutError) {
          console.error('AI response timeout:', timeoutError);
          
          // 진행 상황 메시지 정리
          setMessages((prev) => prev.filter(msg => !msg.id.startsWith('progress-')));
          
          if (timeoutError.message.includes('시간 초과')) {
            aiResponse = '죄송합니다. 여행 계획 생성에 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.\n\n💡 팁: 더 구체적인 정보(예산, 기간 등)를 제공하시면 더 빠르게 계획을 생성할 수 있어요!';
          } else {
            aiResponse = '죄송합니다. 응답 생성 중 문제가 발생했습니다. 다시 시도해주세요.';
          }
        }

        // 중복 응답 감지 및 대체 응답 생성
        if (isDuplicateResponse(aiResponse, messages)) {
          console.log('Duplicate response detected, generating alternative');
          
          // 대체 응답들
          const alternatives = [
            '다른 방식으로 도와드릴까요? 구체적으로 어떤 정보가 필요하신지 말씀해주세요.',
            '앞서 설명드린 내용과 관련해서 다른 궁금한 점이 있으시면 언제든 말씀해주세요!',
            '혹시 제가 놓친 부분이 있나요? 더 구체적으로 어떤 도움이 필요하신지 알려주시면 더 정확히 도와드릴 수 있어요.',
            '다시 한번 정리해서 말씀드리자면... 아니면 다른 관점에서 접근해볼까요?'
          ];
          
          // 랜덤하게 대체 응답 선택
          aiResponse = alternatives[Math.floor(Math.random() * alternatives.length)];
        }

        // 여행 계획이 아닌 일반 응답인 경우에만 메시지 추가
        if (aiResponse) {
          // AI 응답 메시지 추가 (임시 ID로)
          const tempAiMessage: Message = {
            id: 'temp-ai-' + Date.now(),
            session_id: currentSession.id,
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
            user_id: user.id,
          };

          setMessages((prev) => [...prev, tempAiMessage]);

          // AI 응답 저장
          const savedAiMessage = await chatService.saveMessage(
            currentSession.id,
            user.id,
            'assistant',
            aiResponse
          );

          if (savedAiMessage) {
            // 임시 메시지를 실제 저장된 메시지로 교체
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAiMessage.id
                  ? {
                      ...msg,
                      id: savedAiMessage.id,
                      timestamp: new Date(savedAiMessage.created_at),
                    }
                  : msg
              )
            );
          }
        }

        // 첫 메시지인 경우 세션 제목 업데이트
        if (messages.length <= 1) {
          const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
          await chatService.updateSessionTitle(currentSession.id, title);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // 에러 발생 시 임시 메시지 제거 및 에러 메시지 추가
        setMessages((prev) => {
          // 임시 사용자 메시지 제거
          const filteredMessages = prev.filter((msg) => msg.id !== tempUserMessage.id);
          // 에러 메시지 추가
          return [
            ...filteredMessages,
            {
              id: 'error-' + Date.now(),
              role: 'assistant',
              content: '죄송합니다. 메시지 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n\n오류 내용: ' + (error instanceof Error ? error.message : '알 수 없는 오류'),
              timestamp: new Date(),
            },
          ];
        });
      } finally {
        // 항상 로딩 상태 해제
        setIsLoading(false);
      }
    },
    [user, currentSession, messages.length]
  );

  // 새 세션 시작
  const startNewSession = useCallback(async () => {
    if (!user) return;

    try {
      // 현재 세션 종료
      if (currentSession) {
        await chatService.endSession(currentSession.id);
      }

      // 새 세션 생성
      const newSession = await chatService.getOrCreateActiveSession(user.id);
      if (newSession) {
        setCurrentSession(newSession);
        setMessages([
          {
            id: 'welcome-' + Date.now(),
            role: 'assistant',
            content: '안녕하세요! 여행 계획을 도와드릴 AI 어시스턴트입니다. 어떤 여행을 계획하고 계신가요?',
            timestamp: new Date(),
            isWelcomeMessage: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  }, [user, currentSession]);

  // UI에서만 대화 내용 클리어 (여행 계획은 유지)
  const clearConversationOnly = useCallback(async () => {
    if (!currentSession) {
      console.log('❌ No active session for clearing conversation');
      return;
    }
    
    try {
      console.log('💬 대화 내용 클리어 시작 (여행 계획 유지)');
      
      // 1. DB에서 해당 세션의 메시지 삭제
      console.log('🗑️ Deleting chat messages from database...');
      const messageDeleteResult = await chatService.deleteSessionMessages(currentSession.id);
      console.log('Chat messages delete result:', messageDeleteResult);
      
      // 2. UI에서 메시지 제거 후 웰컴 메시지 추가
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: '안녕하세요! 여행 계획을 도와드릴 AI 어시스턴트입니다. 어떤 여행을 계획하고 계신가요?',
          timestamp: new Date(),
          isWelcomeMessage: true,
        }
      ]);
      console.log('✅ UI messages cleared and welcome message added');
      
      console.log('💬 대화 내용만 클리어됨 (여행 계획 유지)');
    } catch (error) {
      console.error('❌ Error clearing conversation:', error);
    }
  }, [currentSession]);

  // 모든 기록 완전 삭제 (대화 + 여행 계획)
  const clearAllRecords = useCallback(async () => {
    if (!user || !currentSession) {
      console.log('❌ User or session not available for clearing records');
      return;
    }
    
    try {
      console.log('🧹 Starting to clear all records for session:', currentSession.id);
      
      // 1. DB에서 해당 세션의 메시지 삭제
      console.log('🗑️ Deleting chat messages from database...');
      const messageDeleteResult = await chatService.deleteSessionMessages(currentSession.id);
      console.log('Chat messages delete result:', messageDeleteResult);
      
      // 2. UI에서 메시지 제거 후 웰컴 메시지 추가
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: '안녕하세요! 여행 계획을 도와드릴 AI 어시스턴트입니다. 어떤 여행을 계획하고 계신가요?',
          timestamp: new Date(),
          isWelcomeMessage: true,
        }
      ]);
      console.log('✅ UI messages cleared and welcome message added');
      
      // 3. 세션 파라미터 삭제
      console.log('🗑️ Deleting session parameters...');
      const paramResult = await travelPlanService.deleteSessionParameters(currentSession.id);
      console.log('Session parameters delete result:', paramResult);
      
      // 4. 사용자의 모든 plan_modifications 삭제 (완료된 계획 보존)
      console.log('🗑️ Deleting user modifications...');
      const modificationResult = await ChatSessionService.deleteUserModifications(user.id);
      console.log('User modifications delete result:', modificationResult);
      
      // 5. 여행 계획 상태 초기화 (완료된 여행 계획은 유지)
      console.log('🔄 Resetting travel plan state...');
      travelPlan.resetState();
      
      console.log('🧹 모든 기록 완전 삭제됨');
    } catch (error) {
      console.error('❌ Error clearing all records:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        sessionId: currentSession?.id,
        userId: user?.id
      });
    }
  }, [user, currentSession, travelPlan]);

  return {
    messages,
    isLoading,
    isInitializing,
    sendMessage,
    startNewSession,
    clearConversationOnly,
    clearAllRecords,
    currentSession,
  };
}