'use client'; // 이 파일이 클라이언트 컴포넌트임을 명시

import type React from 'react';
import { Calendar, Users, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SearchForm from '@/components/destination/SearchForm';
import DestinationCard from '@/components/home/DestinationCard';
import { Destination } from '@/utils/destination/types';
import { useAuth } from '@/app/providers/AuthProvider'; 

interface HomePageClientProps {
  destinations: Destination[];
}

export default function HomePageClient({ destinations }: HomePageClientProps) {
  const { user, isLoading, profile } = useAuth(); // useAuth 훅을 사용하여 사용자 정보 가져오기

  // 로딩 중일 때 보여줄 UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {user ? (
        // 사용자가 로그인했을 때 보여줄 UI
        <>
          {/* Section - 로그인 사용자용 */}
          <section className="relative py-20 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">환영합니다, {profile?.name || user.email}님!</h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                AI가 도와주는 맞춤형 여행 계획으로 특별한 추억을 만들어보세요
              </p>

              {/* Search Form - 클라이언트 컴포넌트로 분리하여 동적인 상호작용 처리 */}
              <SearchForm />

              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-4 mb-16">
                <Link href="/planner" passHref>
                  <Button variant="outline" className="rounded-full px-6 py-3 bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    일정 만들기
                  </Button>
                </Link>
                <Link href="/group-travel" passHref>
                  <Button variant="outline" className="rounded-full px-6 py-3 bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    그룹 여행
                  </Button>
                </Link>
                <Link href="/destinations?popular=true" passHref>
                  <Button variant="outline" className="rounded-full px-6 py-3 bg-transparent">
                    <Star className="h-4 w-4 mr-2" />
                    인기 여행지
                  </Button>
                </Link> 
              </div>
            </div>
            {/* Recent Plans Section - 로그인 사용자만 */}
{user && (
  <section className="py-12 px-4 bg-blue-50">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">최근 여행 계획</h2>
        <Link href="/planner" className="text-blue-600 hover:text-blue-800 font-medium">
          모두 보기 →
        </Link>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <p className="text-gray-500 text-center">아직 여행 계획이 없습니다. 첫 번째 여행을 계획해보세요!</p>
      </div>
    </div>
  </section>
)}
          </section>

          {/* Popular Destinations - 서버에서 렌더링된 데이터 */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">인기 여행지</h2>
              {destinations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {destinations.map((destination) => (
                    <DestinationCard key={destination.id} destination={destination} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">인기 여행지 데이터를 불러오지 못했습니다.</p>
              )}
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                왜 우리 플랫폼을 선택해야 할까요?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">스마트 검색</h3>
                  <p className="text-gray-600">AI 기반 검색으로 원하는 여행지를 쉽게 찾아보세요</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">맞춤 일정</h3>
                  <p className="text-gray-600">개인 취향에 맞는 완벽한 여행 일정을 자동으로 생성</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">실시간 후기</h3>
                  <p className="text-gray-600">실제 여행자들의 생생한 후기와 팁을 확인하세요</p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        // 사용자가 로그인하지 않았을 때 보여줄 UI (간소화된 버전)
        <section className="relative py-20 px-4 text-center">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">완벽한 여행을 계획하세요</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI가 도와주는 맞춤형 여행 계획으로 특별한 추억을 만들어보세요
            </p>
            <p className="text-gray-700 mb-8">
              로그인하여 나만의 맞춤형 여행 계획을 시작하고, HOOLJJEOK의 모든 기능을 경험해보세요!
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-lg"
              >
                로그인 또는 회원가입
              </Link>
            </div>
            {/* Popular Destinations - 서버에서 렌더링된 데이터 */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">인기 여행지</h2>
              {destinations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {destinations.map((destination) => (
                    <DestinationCard key={destination.id} destination={destination} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">인기 여행지 데이터를 불러오지 못했습니다.</p>
              )}
            </div>
          </section>
            {/* Features Section (로그인 전에도 보여줄 수 있는 공통 섹션) */}
            <div className="py-16 px-4 bg-white mt-16 rounded-lg shadow-md">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                왜 우리 플랫폼을 선택해야 할까요?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">스마트 검색</h3>
                  <p className="text-gray-600">AI 기반 검색으로 원하는 여행지를 쉽게 찾아보세요</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">맞춤 일정</h3>
                  <p className="text-gray-600">개인 취향에 맞는 완벽한 여행 일정을 자동으로 생성</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">실시간 후기</h3>
                  <p className="text-gray-600">실제 여행자들의 생생한 후기와 팁을 확인하세요</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
