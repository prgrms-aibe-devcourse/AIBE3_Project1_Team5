'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useInputValidator } from '@/hooks/useInputValidator';
import { NicknameInput } from '@/app/components/inputForm/NicknameInput';

export default function SetProfilePage() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { nameError, handleNameChange, checkNameDuplicate, isCheckingNameDuplicate } =
    useInputValidator();
  const [isNameChecked, setIsNameChecked] = useState(false);
  const [nameCheckMessage, setNameCheckMessage] = useState('');

  useEffect(() => {
    // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // 이름 관련 에러는 nameError로만 관리 (전역 에러 메시지로 setError 사용하지 않음)
    if (nameError) return;
    // 이름 관련 에러는 nameError로만 관리 (전역 에러 메시지로 setError 사용하지 않음)
    if (nameError) return;
    if (!user) {
      setError('사용자정보를 찾을 수 없습니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      // profiles 테이블에 프로필 생성
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          user_id: user.id,
          name: name.trim(),
        },
      ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setError('프로필 생성 중 오류가 발생했습니다.');
        return;
      }

      // 프로필 상태 갱신
      await refreshProfile();

      // 성공 시 홈페이지로 리다이렉트
      router.push('/');
    } catch (err) {
      setError('프로필 설정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setIsSubmitting(false);
    }
  };

  // 이미 프로필이 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (profile) {
      router.push('/');
    }
  }, [profile, router]);

  // 닉네임 중복확인 버튼 클릭 핸들러
  const handleNameCheck = async () => {
    setIsNameChecked(false);
    setNameCheckMessage('');
    if (!name.trim()) {
      setNameCheckMessage('닉네임을 입력해주세요.');
      return;
    }
    const duplicated = await checkNameDuplicate(name);
    setIsNameChecked(true);
    if (!duplicated && !nameError) {
      setNameCheckMessage('사용 가능한 닉네임입니다.');
    } else {
      setNameCheckMessage('');
    }
  };

  if (!user) {
    return null; // 로그인되지 않은 경우 아무것도 렌더링하지 않음
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/login"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          로그인으로 돌아가기
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">프로필 설정</CardTitle>
            <CardDescription className="text-gray-600">
              소셜 로그인으로 가입하셨습니다. 이름을 입력해주세요.
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

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                disabled={isSubmitting || !!nameError}
              >
                {isSubmitting ? '설정 중...' : '프로필 설정 완료'}
                {isSubmitting ? '설정 중...' : '프로필 설정 완료'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
