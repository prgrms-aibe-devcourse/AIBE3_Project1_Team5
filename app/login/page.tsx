'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers/AuthProvider';
import Link from 'next/link';
import SocialLogin from '../components/SocialLogin';
import { useInputValidator } from '@/hooks/useInputValidator';
import { EmailInput } from '@/app/components/inputForm/EmailInput';
import { PasswordInput } from '@/app/components/inputForm/PasswordInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { signIn, isLoading } = useAuth();
  const { emailError, passwordError, handleEmailChange, handlePasswordChange } =
    useInputValidator();

  // 모든 필드가 채워져 있고, 에러가 없을 때만 활성화
  const isFormValid = !emailError && !passwordError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // 방어코드: 각 필드별 에러
    if (emailError || passwordError) {
      setError('입력값을 다시 확인해주세요.');
      return;
    }
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    }
  };

  // 로그인 처리 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">로그인 처리 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          홈으로 돌아가기
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">로그인</CardTitle>
            <CardDescription className="text-gray-600">
              계정에 로그인하여 여행을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <EmailInput
                value={email}
                onChange={(value: string) => {
                  setEmail(value);
                  handleEmailChange(value);
                }}
                error={emailError}
              />

              {/* Password Input */}
              <PasswordInput
                value={password}
                onChange={(value: string) => {
                  setPassword(value);
                  handlePasswordChange(value, '');
                }}
                error={passwordError}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
                placeholder="비밀번호를 입력하세요"
              />

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                계정이 없으신가요?{' '}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700">
                  회원가입하기
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6">
          <SocialLogin />
        </div>
      </div>
    </div>
  );
}
