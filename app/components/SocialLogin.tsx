'use client';

import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';

export default function SocialLogin() {
  const { signInWithGithub, signInWithGoogle, signInWithKakao, isLoading } = useAuth();

  const handleGithubLogin = async () => {
    try {
      await signInWithGithub();
    } catch (error) {
      console.error('GitHub 로그인 오류:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google 로그인 오류:', error);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      await signInWithKakao();
    } catch (error) {
      console.error('Kakao 로그인 오류:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">또는</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        {/* GitHub Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-gray-900 hover:bg-gray-800 text-white border-gray-900 hover:border-gray-800"
          onClick={handleGithubLogin}
          disabled={isLoading}
        >
          <Github className="h-4" />
          {isLoading ? '처리 중...' : 'GitHub로 계속하기'}
        </Button>

        {/* Google Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? '처리 중...' : 'Google로 계속하기'}
        </Button>

        {/* Kakao Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#FEE500] hover:bg-[#ffe066] text-black border border-[#FEE500] hover:border-[#ffe066] flex items-center justify-center"
          onClick={handleKakaoLogin}
          disabled={isLoading}
        >
          <img src="/pngegg.png" alt="카카오" className="h-5 w-5 mr-2" />
          {isLoading ? '처리 중...' : '카카오로 계속하기'}
        </Button>
      </div>
    </div>
  );
}
