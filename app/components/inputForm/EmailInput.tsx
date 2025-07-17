import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export function EmailInput({
  value,
  onChange,
  error,
  placeholder = 'your@email.com',
  required = true,
}: EmailInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="email" className="text-sm font-medium text-gray-700">
        이메일
      </label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="email"
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="pl-10"
          required={required}
        />
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
