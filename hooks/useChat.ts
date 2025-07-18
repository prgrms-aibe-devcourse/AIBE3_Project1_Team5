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
}

// GPT 기반 여행 처리 판단 함수
async function shouldProcessAsTravel(
  content: string, 
  existingParams: any, 
  messages: Message[]
): Promise<{isTravel: boolean, reason: string, shouldOfferContinue: boolean, intent?: string}> {
  
  try {
    // 최근 3개 메시지 내용을 컨텍스트로 전달
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
      // API 실패 시 기본 키워드 방식으로 fallback
      console.warn('GPT intent classification failed, falling back to keywords');
      return fallbackKeywordClassification(content, existingParams);
    }

    const result = await response.json();
    
    // GPT 결과를 기존 형식으로 변환
    switch (result.intent) {
      case 'travel_start':
        return {isTravel: true, reason: 'new_travel_request', shouldOfferContinue: false, intent: result.intent};
      case 'travel_continue':
        return {isTravel: true, reason: 'travel_context_continue', shouldOfferContinue: false, intent: result.intent};
      case 'travel_resume':
        return {isTravel: true, reason: 'resume_requested', shouldOfferContinue: false, intent: result.intent};
      case 'travel_cancel':
        return {isTravel: false, reason: 'stop_requested', shouldOfferContinue: false, intent: result.intent};
      case 'general':
        // GPT가 명시적으로 shouldOfferContinue를 false로 했으면 우선 적용
        const shouldOffer = result.shouldOfferContinue !== false && hasExistingParams;
        return {isTravel: false, reason: shouldOffer ? 'general_with_travel_progress' : 'general_conversation', shouldOfferContinue: shouldOffer, intent: result.intent};
      default:
        return {isTravel: false, reason: 'unknown_intent', shouldOfferContinue: false, intent: result.intent};
    }
  } catch (error) {
    console.error('Error in GPT intent classification:', error);
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
  const recentAiMessages = recentMessages
    .filter(msg => msg.role === 'assistant')
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
              // 여행 관련 처리 (타임아웃 60초)
              const travelTimeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('여행 계획 생성 시간 초과')), 60000)
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
                    accommodation: existingParams.accommodation
                  };
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
                          collection_status: 'awaiting_confirmation'
                        },
                        []
                      );
                      
                      return result.confirmationMessage;
                    }
                  }
                }
                
                // 사용자 응답이 확인/거부/부분수정인지 체크
                const confirmationKeywords = {
                  keepAll: ['네', '그대로', '유지', '맞아요', '그래요', '계속', '좋아요'],
                  resetAll: ['다시', '새로', '처음부터', '리셋', '초기화', '안할래'],
                  partial: ['일부', '부분', '몇개만', '조금만', '바꿀게요']
                };
                
                if (existingParams?.collection_status === 'awaiting_confirmation') {
                  const userResponse = content.toLowerCase();
                  
                  if (confirmationKeywords.keepAll.some(keyword => userResponse.includes(keyword))) {
                    // 기존 설정 유지하고 계획 생성
                    const plan = await travelPlan.generateTravelPlan({
                      ...currentParams,
                      collection_status: 'complete'
                    });
                    
                    // 완료된 파라미터 저장
                    await travelPlanService.createOrUpdateSessionParameters(
                      currentSession.id,
                      user.id,
                      { ...currentParams, collection_status: 'complete' },
                      []
                    );
                    
                    // 여행 계획 저장
                    await travelPlanService.createTravelPlan(
                      user.id,
                      currentSession.id,
                      currentParams,
                      plan
                    );
                    
                    return `🎉 ${plan.title}이 완성되었습니다!

📅 ${plan.duration}일간의 멋진 여행을 준비했어요. 아래 일정을 확인하고 필요시 수정하거나 다운로드해주세요.`;
                  } else if (confirmationKeywords.resetAll.some(keyword => userResponse.includes(keyword))) {
                    // 모든 파라미터 초기화하고 새로 시작
                    await travelPlanService.createOrUpdateSessionParameters(
                      currentSession.id,
                      user.id,
                      { destination: currentParams.destination },
                      ['duration', 'peopleCount', 'budget', 'travelStyle', 'transportation', 'accommodation']
                    );
                    
                    return `${currentParams.destination} 여행을 처음부터 새로 계획해드릴게요! 
                    
며칠 동안 여행하실 예정인가요? (예: 2박3일, 1주일 등)`;
                  } else if (confirmationKeywords.partial.some(keyword => userResponse.includes(keyword))) {
                    // 부분 수정 모드
                    return `어떤 항목을 바꾸고 싶으신가요? 
                    
현재 설정:
• 기간: ${currentParams.duration}일
• 인원: ${currentParams.people_count}명
• 예산: ${currentParams.budget?.toLocaleString()}원
• 여행스타일: ${currentParams.travel_style}
• 교통수단: ${currentParams.transportation}
• 숙박: ${currentParams.accommodation}

바꾸고 싶은 항목을 말씀해주세요. (예: "예산을 50만원으로 바꿔줘", "3박4일로 연장해줘")`;
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
                
                const mergedParams = { ...currentParams, ...paramResult.collectedParams };
                
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
                
                if (isComplete) {
                  // 모든 파라미터가 수집되었으면 일정 생성
                  const plan = await travelPlan.generateTravelPlan(mergedParams);
                  
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
                  
                  return `🎉 ${plan.title}이 완성되었습니다!

📅 ${plan.duration}일간의 멋진 여행을 준비했어요. 아래 일정을 확인하고 필요시 수정하거나 다운로드해주세요.`;
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
              
              aiResponse = await Promise.race([travelProcessPromise(), travelTimeoutPromise]);
            } else {
              // 일반 대화 처리
              if (shouldContinueTravel.shouldOfferContinue) {
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
          aiResponse = '죄송합니다. 응답 생성 중 문제가 발생했습니다. 다시 시도해주세요.';
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

        // AI 응답 메시지 추가 (임시 ID로)
        const tempAiMessage: Message = {
          id: 'temp-ai-' + Date.now(),
          session_id: currentSession.id,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          user_id: user.id,
          travelPlan: travelPlan.currentPlan, // 여행 계획 데이터 포함
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
                    travelPlan: travelPlan.currentPlan, // 여행 계획 데이터 유지
                  }
                : msg
            )
          );
        }

        // 첫 메시지인 경우 세션 제목 업데이트
        if (messages.length <= 1) {
          const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
          await chatService.updateSessionTitle(currentSession.id, title);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // 에러 발생 시 임시 메시지 제거 및 에러 메시지 추가
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== tempUserMessage.id),
          {
            id: 'error-' + Date.now(),
            role: 'assistant',
            content: '죄송합니다. 메시지 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            timestamp: new Date(),
          },
        ]);
      } finally {
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
          },
        ]);
      }
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  }, [user, currentSession]);

  return {
    messages,
    isLoading,
    isInitializing,
    sendMessage,
    startNewSession,
    currentSession,
  };
}