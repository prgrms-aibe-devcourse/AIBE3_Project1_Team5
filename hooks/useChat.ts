import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { chatService, ChatSession, ChatMessage } from '@/lib/chatService';
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
                const paramResult = await travelPlan.extractParameters(content);
                
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
                  
                  return `완벽한 여행 계획을 생성했습니다! 

📍 **${plan.title}**
📅 총 ${plan.duration}일
💰 예상 비용: ${plan.totalBudget?.toLocaleString()}원

첫째 날부터 간단히 소개해드릴게요:
${plan.schedule[0]?.description || '멋진 여행이 시작됩니다!'}

자세한 일정을 확인하시겠어요?`;
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