'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers/AuthProvider';
import Link from 'next/link';
import { useInputValidator } from '@/hooks/useInputValidator';
import { NicknameInput } from '@/app/components/inputForm/NicknameInput';
import { EmailInput } from '@/app/components/inputForm/EmailInput';
import { PasswordInput } from '@/app/components/inputForm/PasswordInput';
import { ConfirmPasswordInput } from '@/app/components/inputForm/ConfirmPasswordInput';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();
  const {
    nameError,
    emailError,
    passwordError,
    confirmPasswordError,
    handleNameChange,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    checkNameDuplicate,
    isCheckingNameDuplicate,
  } = useInputValidator();
  const [isNameChecked, setIsNameChecked] = useState(false);
  const [nameCheckMessage, setNameCheckMessage] = useState('');

  // 모든 필드가 채워져 있고, 에러가 없을 때만 활성화
  const isFormValid =
    name.trim() &&
    email.trim() &&
    password.trim() &&
    confirmPassword.trim() &&
    !nameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError;

  // 이름 중복확인 버튼 클릭 핸들러
  const handleNameCheck = async () => {
    setIsNameChecked(false);
    setNameCheckMessage('');
    if (!name.trim()) {
      setNameCheckMessage('이름을 입력해주세요.');
      return;
    }
    const duplicated = await checkNameDuplicate(name);
    setIsNameChecked(true);
    if (!duplicated && !nameError) {
      setNameCheckMessage('사용 가능한 이름입니다.');
    } else {
      setNameCheckMessage('');
    }
  };

  // supabase 회원가입 에러 메시지 한글화 함수
  function getSignUpErrorMessage(error: any) {
    if (!error) return '';
    if (
      error.code === 'user_already_exists' ||
      error.message?.includes('User already registered')
    ) {
      return '이미 가입된 이메일입니다.';
    }
    // 기타 에러
    return '회원가입 중 오류가 발생했습니다.';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 방어코드: 모든 필드 입력 여부
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    // 방어코드: 각 필드별 에러
    if (nameError || emailError || passwordError || confirmPasswordError) {
      setError('입력값을 다시 확인해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(getSignUpErrorMessage(error));
        return;
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <CardTitle className="text-2xl font-bold text-gray-900">회원가입</CardTitle>
            <CardDescription className="text-gray-600">
              완벽한 여행을 위한 계정을 만들어보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nickname Input */}
              <NicknameInput
                value={name}
                onChange={(value: string) => {
                  setName(value);
                  handleNameChange(value);
                  setIsNameChecked(false);
                  setNameCheckMessage('');
                }}
                onCheckDuplicate={handleNameCheck}
                isChecking={isCheckingNameDuplicate}
                error={nameError}
                checkMessage={
                  !nameError && isNameChecked && nameCheckMessage ? nameCheckMessage : ''
                }
              />

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
                  handlePasswordChange(value, confirmPassword);
                }}
                error={passwordError}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
                placeholder="최소 6자 이상"
              />

              {/* Confirm Password Input */}
              <ConfirmPasswordInput
                value={confirmPassword}
                onChange={(value: string) => {
                  setConfirmPassword(value);
                  handleConfirmPasswordChange(password, value);
                }}
                error={confirmPasswordError}
                showPassword={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                placeholder="비밀번호를 다시 입력하세요"
              />

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? '가입 중...' : '회원가입'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700">
                  로그인하기
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
