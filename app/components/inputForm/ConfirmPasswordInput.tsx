import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';

export interface ConfirmPasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showPassword: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  required?: boolean;
}

export function ConfirmPasswordInput({
  value,
  onChange,
  error,
  showPassword,
  onToggleShow,
  placeholder = '비밀번호를 다시 입력하세요',
  required = true,
}: ConfirmPasswordInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
        비밀번호 확인
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="pl-10 pr-10"
          required={required}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
