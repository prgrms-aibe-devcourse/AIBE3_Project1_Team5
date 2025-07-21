'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider'; // AuthProvider에서 useAuth 훅 임포트
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin } from 'lucide-react';
import { Button } from '../ui/button';

// travel_schedule 테이블의 데이터 구조에 맞는 타입 정의
interface TravelPlan {
  id: string;
  user_id: string;
  title: string;
  start_date: string; 
  end_date: string;   
  destination: string;
  created_at: string;
  version: number | null;
}

export default function RecentTravelPlans() {
  const { user, isLoading: isAuthLoading } = useAuth(); // 인증 상태 및 로딩 여부
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentPlans() {
      if (!user) { // 사용자가 로그인하지 않았으면 데이터 가져올 필요 없음
        setPlans([]);
        setIsLoadingPlans(false);
        return;
      }

      setIsLoadingPlans(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('travel_schedule')
          .select('*')
          .eq('user_id', user.id) // 현재 로그인된 사용자의 계획만 가져옴
          .order('created_at', { ascending: false }) // 최신 계획부터
          .limit(3); // 최근 3개만 보여주기 (조절 가능)

        if (supabaseError) {
          console.error('여행 계획 불러오기 오류:', supabaseError);
          throw supabaseError;
        }

        setPlans(data || []);
      } catch (err) {
        console.error('여행 계획 로드 중 예외 발생:', err);
        setError(err instanceof Error ? err.message : '여행 계획을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingPlans(false);
      }
    }

    // user 또는 isAuthLoading 상태가 변경될 때마다 데이터 다시 가져오기
    // isAuthLoading이 false가 되고 user 정보가 확정된 후에 fetch 시작
    if (!isAuthLoading) {
      fetchRecentPlans();
    }
  }, [user, isAuthLoading]); // user와 isAuthLoading을 의존성 배열에 추가

  if (isAuthLoading) {
    // AuthProvider에서 인증 정보 로딩 중일 때
    return null; // 또는 간단한 로딩 스켈레톤
  }

  if (!user) {
    // 로그인하지 않은 사용자에게는 이 섹션을 아예 렌더링하지 않음
    return null;
  }

  // 로그인했지만 아직 계획 데이터 로딩 중일 때
  if (isLoadingPlans) {
    return (
      <section className="py-12 px-4 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">최근 여행 계획</h2>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">여행 계획을 불러오는 중...</p>
          </div>
        </div>
      </section>
    );
  }

  // 데이터 로딩 오류 발생 시
  if (error) {
    return (
      <section className="py-12 px-4 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">최근 여행 계획</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">오류:</strong>
            <span className="block sm:inline"> {error}</span>
            <p className="text-sm mt-2">다시 시도하거나 관리자에게 문의해주세요.</p>
          </div>
        </div>
      </section>
    );
  }

  // 모든 조건 통과 후 실제 UI 렌더링
  return (
    <section className="py-12 px-4 bg-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">최근 여행 계획</h2>
          <Link href="/my-trips" className="text-blue-600 hover:text-blue-800 font-medium">
            모두 보기 →
          </Link>
        </div>
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <Link href={`/my-trips/${plan.id}`} passHref>
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" /> {plan.destination}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm flex items-center mb-2">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      {plan.start_date} ~ {plan.end_date}
                    </p>
                    <p className="text-xs text-gray-500">생성일: {new Date(plan.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-gray-500 text-center">아직 여행 계획이 없습니다. 첫 번째 여행을 계획해보세요!</p>
            <div className="text-center mt-4">
              <Link href="/planner" passHref>
                <Button>새로운 여행 계획하기</Button>
              </Link>
            </div>
          </div>
        )} 
      </div>
    </section>
  );
}