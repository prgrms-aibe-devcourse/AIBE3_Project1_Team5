// components/chat/ChatModal.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface, { ChatInterfaceRef } from './ChatInterface';
import ClearOptionsModal from './ClearOptionsModal';

interface ChatModalProps {
  onClose: () => void;
}

export default function ChatModal({ onClose }: ChatModalProps) {
  const [showClearModal, setShowClearModal] = useState(false);
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-end pr-4">
      {/* 모달 컨테이너 */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-in fade-in-0 slide-in-from-right-4 duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">여행 계획 AI 어시스턴트</h2>
          <div className="flex items-center gap-2">
            {/* Clear 버튼 */}
            <Button 
              onClick={() => setShowClearModal(true)} 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="채팅 기록 지우기"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {/* 닫기 버튼 */}
            <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface ref={chatInterfaceRef} />
        </div>
      </div>

      {/* Clear Options Modal */}
      <ClearOptionsModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onClearConversation={() => chatInterfaceRef.current?.clearConversationOnly()}
        onClearAll={() => chatInterfaceRef.current?.clearAllRecords()}
      />
    </div>
  );
}
