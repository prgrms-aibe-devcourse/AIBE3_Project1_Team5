import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Edit3, Check } from 'lucide-react';

interface TravelSettingButtonsProps {
  onKeepSettings: () => void;
  onResetAll: () => void;
  onPartialEdit: () => void;
  disabled?: boolean;
}

export default function TravelSettingButtons({ 
  onKeepSettings, 
  onResetAll, 
  onPartialEdit,
  disabled = false
}: TravelSettingButtonsProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm text-gray-500 mb-3">어떻게 진행하시겠어요?</div>
      
      <div className="grid gap-2">
        <Button
          onClick={onKeepSettings}
          disabled={disabled}
          variant="outline"
          className="justify-start gap-2 py-3 px-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          <Check className="h-4 w-4 text-blue-600" />
          <div className="text-left">
            <div className="font-medium">기존 설정 유지</div>
            <div className="text-xs text-gray-500">현재 설정으로 바로 계획 생성</div>
          </div>
        </Button>
        
        <Button
          onClick={onResetAll}
          disabled={disabled}
          variant="outline"
          className="justify-start gap-2 py-3 px-4 hover:bg-orange-50 hover:border-orange-300 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-orange-600" />
          <div className="text-left">
            <div className="font-medium">처음부터 다시 설정</div>
            <div className="text-xs text-gray-500">모든 항목을 새로 입력</div>
          </div>
        </Button>
        
        <Button
          onClick={onPartialEdit}
          disabled={disabled}
          variant="outline"
          className="justify-start gap-2 py-3 px-4 hover:bg-purple-50 hover:border-purple-300 transition-colors"
        >
          <Edit3 className="h-4 w-4 text-purple-600" />
          <div className="text-left">
            <div className="font-medium">일부 항목만 수정</div>
            <div className="text-xs text-gray-500">원하는 항목만 선택해서 변경</div>
          </div>
        </Button>
      </div>
      
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>팁:</strong> 목적지가 바뀌면 교통수단이나 예산도 함께 조정하는 것이 좋아요!
        </p>
      </div>
    </div>
  );
}