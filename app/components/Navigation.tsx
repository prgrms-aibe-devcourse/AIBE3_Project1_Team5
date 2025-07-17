'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, MessageCircle, Star, Calendar, MapPin, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/providers/AuthProvider';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/destinations', label: '여행지', icon: MapPin },
  { href: '/chat', label: 'AI 채팅', icon: MessageCircle },
  { href: '/planner', label: '일정 계획', icon: Calendar },
  { href: '/my-trips', label: '내 여행', icon: UserCircle },
  { href: '/reviews', label: '후기', icon: Star },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, profile, isLoading } = useAuth();

  // 로딩 중일 때 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 rounded-lg p-2">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TravelPlan</span>
            </Link>

            {/* Desktop Navigation Skeleton */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <div key={item.href} className="h-8 bg-gray-20 rounded animate-pulse"></div>
              ))}
            </div>

            {/* User Menu Skeleton */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="h-8 bg-gray-20 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-20 rounded animate-pulse"></div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <div className="h-8 bg-gray-20 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // 사용자가 로그인되어 있고 프로필이 로딩 중일 때 스켈레톤 표시
  const isProfileLoading = user && !profile;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 rounded-lg p-2">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TravelPlan</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {isProfileLoading ? (
                  <div className="h-4 bg-gray-20 rounded animate-pulse w-20"></div>
                ) : (
                  <span className="text-sm text-gray-700">{profile?.name || user.email}</span>
                )}
                <Button variant="outline" size="sm" onClick={signOut}>
                  로그아웃
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    회원가입
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              {user ? (
                <div className="space-y-2">
                  {isProfileLoading ? (
                    <div className="text-center">
                      <div className="h-4 bg-gray-20 rounded animate-pulse w-24 mx-auto mb-2"></div>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-700 px-3 py-2">
                      {profile?.name || user.email}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={signOut}
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      회원가입
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
