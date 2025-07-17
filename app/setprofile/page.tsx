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

export default function SetProfilePage() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!user) {
      setError('사용자정보를 찾을 수 없습니다.');
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // 이미 프로필이 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (profile) {
      router.push('/');
    }
  }, [profile, router]);

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
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? '설정 중...' : '프로필 설정 완료'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
