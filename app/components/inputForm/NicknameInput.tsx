import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export interface NicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  onCheckDuplicate: () => void;
  isChecking: boolean;
  error?: string;
  checkMessage?: string;
}

export function NicknameInput({
  value,
  onChange,
  onCheckDuplicate,
  isChecking,
  error,
  checkMessage,
}: NicknameInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="nickname" className="text-sm font-medium text-gray-700">
        닉네임
      </label>
      <div className="relative flex gap-2">
        <div className="flex-1">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="nickname"
            type="text"
            placeholder="닉네임"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={onCheckDuplicate}
          disabled={isChecking || !value.trim()}
        >
          {isChecking ? '확인 중...' : '중복확인'}
        </Button>
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      {!error && checkMessage && <div className="text-green-600 text-xs mt-1">{checkMessage}</div>}
    </div>
  );
}
