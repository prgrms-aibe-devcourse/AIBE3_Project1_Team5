import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2, AlertTriangle, X } from 'lucide-react';

interface ClearOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearConversation: () => void;
  onClearAll: () => void;
}

export default function ClearOptionsModal({
  isOpen,
  onClose,
  onClearConversation,
  onClearAll
}: ClearOptionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            채팅 기록 지우기
          </DialogTitle>
          <DialogDescription>
            어떤 기록을 지우시겠어요?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          
          {/* 대화 내용만 지우기 */}
          <Button
            onClick={() => {
              onClearConversation();
              onClose();
            }}
            variant="outline"
            className="w-full justify-start gap-3 p-4 h-auto hover:bg-blue-50 hover:border-blue-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">대화 내용만 지우기</div>
                <div className="text-xs text-gray-500 mt-1">
                  생성된 여행 계획은 유지됩니다
                </div>
              </div>
            </div>
          </Button>
          
          {/* 모든 기록 지우기 */}
          <Button
            onClick={() => {
              onClearAll();
              onClose();
            }}
            variant="outline"
            className="w-full justify-start gap-3 p-4 h-auto hover:bg-red-50 hover:border-red-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">모든 기록 지우기</div>
                <div className="text-xs text-gray-500 mt-1">
                  대화 내용과 여행 계획을 모두 지웁니다
                </div>
              </div>
            </div>
          </Button>
          
          {/* 경고 메시지 */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700">
              <strong>주의:</strong> "모든 기록 지우기"는 되돌릴 수 없습니다. 
              생성된 여행 계획도 함께 삭제됩니다.
            </div>
          </div>
          
          {/* 취소 버튼 */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}