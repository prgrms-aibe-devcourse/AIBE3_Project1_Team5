// components/chat/FloatingChat.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatModal from './ChatModal';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 클라이언트에서만 렌더링
  if (!isClient) {
    return null;
  }

  const toggleChat = () => {
    try {
      setIsOpen(!isOpen);
    } catch (error) {
      // 컴포넌트가 언마운트된 상태에서 상태 업데이트 시도 시 에러 방지
      console.warn('FloatingChat toggle failed:', error);
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* 채팅 모달 */}
      {isOpen && <ChatModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
