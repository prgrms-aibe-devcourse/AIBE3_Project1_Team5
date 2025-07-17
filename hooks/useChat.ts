import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { chatService, ChatSession, ChatMessage } from '@/lib/chatService';

interface Message {
  id: string;
  session_id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  user_id?: string;
}

export function useChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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

        // AI 응답 생성 (타임아웃 설정)
        let aiResponse: string;
        
        try {
          // 타임아웃 설정 (30초)
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('AI 응답 시간 초과')), 30000)
          );
          
          // TODO: 실제 OpenAI API 호출 구현
          // 현재는 임시 응답 생성 (실제 구현 시 아래 코드를 API 호출로 대체)
          const apiPromise = new Promise<string>((resolve) => {
            setTimeout(() => {
              resolve(`"${content}"에 대한 여행 계획을 도와드리겠습니다. 더 구체적인 정보를 알려주시면 맞춤형 일정을 생성해드릴 수 있어요!`);
            }, 1000); // 임시로 1초 지연
          });
          
          aiResponse = await Promise.race([apiPromise, timeoutPromise]);
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