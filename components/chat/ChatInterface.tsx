// components/chat/ChatInterface.tsx
'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/app/providers/AuthProvider';

export interface ChatInterfaceRef {
  clearConversationOnly: () => void;
  clearAllRecords: () => Promise<void>;
}

const ChatInterface = forwardRef<ChatInterfaceRef>((props, ref) => {
  const { user, isLoading: authLoading } = useAuth();
  const { messages, isLoading, isInitializing, sendMessage, clearConversationOnly, clearAllRecords } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    clearConversationOnly,
    clearAllRecords,
  }), [clearConversationOnly, clearAllRecords]);
  
  // 버튼 클릭 핸들러
  const handleSettingButtonClick = (action: 'keep' | 'reset' | 'partial') => {
    switch (action) {
      case 'keep':
        sendMessage('네, 그대로 해주세요');
        break;
      case 'reset':
        sendMessage('다시 설정할게요');
        break;
      case 'partial':
        sendMessage('일부만 바꿀게요');
        break;
    }
  };
  
  // 설정 업데이트 핸들러
  const handleSettingsUpdate = (settings: any) => {
    if (Object.keys(settings).length > 0) {
      // 변경된 설정을 메시지로 전송
      const changedItems = Object.entries(settings)
        .map(([key, value]) => {
          const keyMap: any = {
            duration: '기간',
            peopleCount: '인원',
            budget: '예산',
            travelStyle: '여행스타일',
            transportation: '교통수단',
            accommodation: '숙박'
          };
          return `${keyMap[key]}: ${value}`;
        })
        .join(', ');
      
      sendMessage(`설정 변경: ${changedItems}`);
    } else {
      sendMessage('설정 변경을 취소했습니다.');
    }
  };

  // 새 메시지 추가시 스크롤 하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }
    await sendMessage(content);
  };

  // 인증 로딩 중
  if (authLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 미인증 사용자
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          로그인이 필요합니다
        </h3>
        <p className="text-gray-500 mb-4">
          AI 여행 어시스턴트를 사용하려면 먼저 로그인해주세요.
        </p>
        <a
          href="/login"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          로그인하기
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onButtonClick={handleSettingButtonClick}
            onSettingsUpdate={handleSettingsUpdate}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;