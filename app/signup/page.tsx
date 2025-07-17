'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers/AuthProvider';
import Link from 'next/link';
import { useInputValidator } from '@/hooks/useInputValidator';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  } = useInputValidator();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 방어코드: 모든 필드 입력 여부
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('모든 필드를 입력해주세요.');
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
        setError(error.message);
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  이름
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      handleNameChange(e.target.value);
                    }}
                    className="pl-10"
                    required
                  />
                </div>
                {nameError && <div className="text-red-500 text-xs mt-1">{nameError}</div>}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      handleEmailChange(e.target.value);
                    }}
                    className="pl-10"
                    required
                  />
                </div>
                {emailError && <div className="text-red-500 text-xs mt-1">{emailError}</div>}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="최소 6자 이상"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handlePasswordChange(e.target.value, confirmPassword);
                    }}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <div className="text-red-500 text-xs mt-1">{passwordError}</div>}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      handleConfirmPasswordChange(password, e.target.value);
                    }}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="text-red-500 text-xs mt-1">{confirmPasswordError}</div>
                )}
              </div>

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
