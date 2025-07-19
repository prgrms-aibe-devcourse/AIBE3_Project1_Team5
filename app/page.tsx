import type React from 'react';
import { Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import SearchForm from '@/components/destination/SearchForm'; // 클라이언트 컴포넌트
import DestinationCard from '@/components/home/DestinationCard'; // 서버 컴포넌트
import { Destination } from '@/utils/destination/types'; // 타입 정의 파일 임포트

// 메타데이터 설정 (SEO 최적화)
export const metadata = {
  title: '완벽한 여행을 계획하세요 - 여행 플래너',
  description: 'AI가 도와주는 맞춤형 여행 계획으로 특별한 추억을 만들어보세요',
  keywords: '여행, 여행계획, 여행지, 맞춤여행, AI여행',
};

// 캐싱 설정 (선택사항): 5분마다 데이터 재검증
export const revalidate = 300; 

// 서버에서 데이터 가져오기 (SSR)
async function getDestinations(): Promise<Destination[]> {
  // console.time('SSR Data Fetch'); // 성능 측정 (서버 로그에서 확인 가능)

  try {
    const { data, error } = await supabase
      .from('travels')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(6); // 초기 로딩에 필요한 만큼만 가져옴

    // console.timeEnd('SSR Data Fetch');

    if (error) {
      console.error('데이터 가져오기 오류:', error);
      return [];
    }
    // console.log(`${data?.length || 0}개의 여행지 데이터 로딩 완료 (SSR)`);
    return data || [];
  } catch (error) {
    console.error('SSR 데이터 로드 중 예외 발생:', error);
    return [];
  }
}

// 메인 페이지 컴포넌트 (서버 컴포넌트)
export default async function HomePage() {
  // 서버에서 데이터 미리 로딩
  const destinations = await getDestinations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">완벽한 여행을 계획하세요</h1>
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
              </Button>개
            </Link>
            <Link href="/destinations?popular=true" passHref>
              <Button variant="outline" className="rounded-full px-6 py-3 bg-transparent">
                <Star className="h-4 w-4 mr-2" />
                인기 여행지
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Destinations - 서버에서 렌더링된 데이터 */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">인기 여행지</h2>
          {destinations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}