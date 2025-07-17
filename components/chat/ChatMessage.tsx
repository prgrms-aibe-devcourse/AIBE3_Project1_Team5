// components/chat/ChatMessage.tsx
'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import TravelPlanCard from './TravelPlanCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  travelPlan?: any; // 여행 계획 데이터 (선택사항)
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
        {/* 아바타 */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* 메시지 콘텐츠 */}
        <div className="flex flex-col gap-2">
          {/* 일반 메시지 */}
          <div
            className={`rounded-lg p-3 ${
              isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className={`text-xs mt-1 opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* 여행 계획 카드 (AI 응답에만 표시) */}
          {!isUser && message.travelPlan && (
            <TravelPlanCard 
              plan={message.travelPlan} 
              onDetailView={() => {
                // TODO: 상세 보기 페이지로 이동
                console.log('Detail view clicked');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
