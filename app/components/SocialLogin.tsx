'use client';

import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';

export default function SocialLogin() {
  const { signInWithGithub, isLoading } = useAuth();

  const handleGithubLogin = async () => {
    try {
      await signInWithGithub();
    } catch (error) {
      console.error('GitHub 로그인 오류:', error);
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
    </div>
  );
}
