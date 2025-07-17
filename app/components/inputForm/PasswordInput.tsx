import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showPassword: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  required?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  error,
  showPassword,
  onToggleShow,
  placeholder = '비밀번호',
  required = true,
}: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="password" className="text-sm font-medium text-gray-700">
        비밀번호
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="password"
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
