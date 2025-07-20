import type React from 'react';
import { supabase } from '@/lib/supabase';
import { Destination } from '@/utils/destination/types';
import HomePageClient from '@/components/home/HomePageClient'; // 새로 생성한 클라이언트 컴포넌트 임포트

export const metadata = {
  title: '완벽한 여행을 계획하세요 - 여행 플래너',
  description: 'AI가 도와주는 맞춤형 여행 계획으로 특별한 추억을 만들어보세요',
  keywords: '여행, 여행계획, 여행지, 맞춤여행, AI여행',
};

// 캐싱 설정 (선택사항): 5분마다 데이터 재검증
export const revalidate = 300; 

// 서버에서 데이터 가져오기 (SSR)
async function getDestinations(): Promise<Destination[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_popular_travels');

    if (error) {
      console.error('데이터 가져오기 오류:', error);
      return [];
    }
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

  // 클라이언트 컴포넌트에 서버에서 가져온 데이터를 props로 전달
  return <HomePageClient destinations={destinations} />;
}