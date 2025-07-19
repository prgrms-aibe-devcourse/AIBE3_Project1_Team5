'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface HeroSectionProps {
  isAuthenticated?: boolean;
  userName?: string;
}

export default function HeroSection({ isAuthenticated = false, userName }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/destinations?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {isAuthenticated && userName ? (
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            안녕하세요, {userName}님!
            <br />
            오늘은 어디로 떠나볼까요?
          </h1>
        ) : (
          <h1 className="text-5xl font-bold text-gray-900 mb-6">완벽한 여행을 계획하세요</h1>
        )}

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI가 도와주는 맞춤형 여행 계획으로 특별한 추억을 만들어보세요
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="relative flex items-center bg-white rounded-full shadow-lg p-2">
            <MapPin className="h-5 w-5 text-gray-400 ml-4" />
            <Input
              type="text"
              placeholder="어디로 여행을 떠나고 싶으신가요?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none focus:ring-0 text-lg px-4"
            />
            <Button type="submit" className="rounded-full px-8 py-3 bg-blue-600 hover:bg-blue-700">
              <Search className="h-5 w-5 mr-2" />
              검색
            </Button>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {isAuthenticated ? (
            <>
              <Link href="/planner">
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3 bg-white/80 hover:bg-white border-blue-200"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  일정 만들기
                </Button>
              </Link>
              <Link href="/my-trips">
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3 bg-white/80 hover:bg-white border-blue-200"
                >
                  <Users className="h-4 w-4 mr-2" />내 여행
                </Button>
              </Link>
              <Link href="/destinations">
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3 bg-white/80 hover:bg-white border-blue-200"
                >
                  <Star className="h-4 w-4 mr-2" />
                  여행지 둘러보기
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3 bg-white/80 hover:bg-white border-blue-200"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  일정 만들기
                </Button>
              </Link>
              <Link href="/destinations">
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3 bg-white/80 hover:bg-white border-blue-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  여행지 둘러보기
                </Button>
              </Link>
              <Link href="/destinations">
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3 bg-white/80 hover:bg-white border-blue-200"
                >
                  <Star className="h-4 w-4 mr-2" />
                  인기 여행지
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
