'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin, Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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

// 캐시를 위한 간단한 메모리 저장소
const cache = new Map<string, { data: TravelPlan[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

export default function RecentTravelPlans() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐시된 데이터 확인
  const getCachedData = useCallback((userId: string): TravelPlan[] | null => {
    const cached = cache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  // 캐시에 데이터 저장
  const setCachedData = useCallback((userId: string, data: TravelPlan[]) => {
    cache.set(userId, { data, timestamp: Date.now() });
  }, []);

  // 최적화된 데이터 페칭 함수
  const fetchRecentPlans = useCallback(async (userId: string) => {
    // 캐시된 데이터 먼저 확인
    const cachedData = getCachedData(userId);
    if (cachedData) {
      setPlans(cachedData);
      return;
    }

    setIsLoadingPlans(true);
    setError(null);

    try {
      // 데이터베이스 쿼리 최적화
      const { data, error: supabaseError } = await supabase
        .from('travel_schedule')
        .select(`
          id,
          user_id,
          title,
          start_date,
          end_date,
          destination,
          created_at,
          version
        `) // 필요한 컬럼만 선택
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (supabaseError) {
        console.error('여행 계획 불러오기 오류:', supabaseError);
        throw new Error('여행 계획을 불러오는데 실패했습니다.');
      }

      const plansData = data || [];
      setPlans(plansData);
      
      // 캐시에 저장
      setCachedData(userId, plansData);

    } catch (err) {
      console.error('여행 계획 로드 중 예외 발생:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoadingPlans(false);
    }
  }, [getCachedData, setCachedData]);

  // useEffect 최적화 - user.id가 실제로 변경될 때만 실행
  useEffect(() => {
    if (!isAuthLoading && user?.id) {
      fetchRecentPlans(user.id);
    } else if (!isAuthLoading && !user) {
      // 로그아웃된 경우 상태 초기화
      setPlans([]);
      setIsLoadingPlans(false);
      setError(null);
    }
  }, [user?.id, isAuthLoading, fetchRecentPlans]); // user 객체 전체가 아닌 user.id만 의존성에 추가

  // 메모이제이션으로 불필요한 리렌더링 방지
  const planCards = useMemo(() => {
    return plans.map((plan) => (
      <TravelPlanCard key={plan.id} plan={plan} />
    ));
  }, [plans]);

  // 로딩 스켈레톤 컴포넌트
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Early returns로 불필요한 렌더링 방지
  if (isAuthLoading) {
    return (
      <section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">인증 정보를 확인하는 중...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return null; // 로그인하지 않은 사용자에게는 섹션 숨김
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">최근 여행 계획</h2>
          <Link 
            href="/my-trips" 
            className="text-blue-600 font-medium transition-colors duration-200" // hover:text-blue-800 hover:underline 제거
          >
            모두 보기 →
          </Link>
        </div>

        {error ? (
          <ErrorMessage 
            error={error} 
            onRetry={() => user?.id && fetchRecentPlans(user.id)}
          />
        ) : isLoadingPlans ? (
          <LoadingSkeleton />
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planCards}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

// 개별 여행 계획 카드 컴포넌트 (메모이제이션)
const TravelPlanCard = React.memo(({ plan }: { plan: TravelPlan }) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCreatedDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return '날짜 없음';
    }
  };

  return (
    <Link href={`/my-trips/edit/${plan.id}`}>
      <Card className="group transition-all duration-300 cursor-pointer border-0 shadow-md bg-white"> {/* hover:shadow-xl hover:scale-105 제거 */}
        <CardHeader className="pb-3">
          <CardTitle className="text-xl transition-colors line-clamp-2"> {/* group-hover:text-blue-600 제거 */}
            {plan.title}
          </CardTitle>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{plan.destination}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-gray-700 text-sm mb-3">
            <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
            <span>
              {formatDate(plan.start_date)} ~ {formatDate(plan.end_date)}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            생성일: {formatCreatedDate(plan.created_at)}
          </div>
          {/* {plan.version && (
            <div className="text-xs text-green-600 mt-1">
              버전 {plan.version}
            </div>
          )} */}
        </CardContent>
      </Card>
    </Link>
  );
});

TravelPlanCard.displayName = 'TravelPlanCard';

// 에러 상태 컴포넌트
const ErrorMessage = React.memo(({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry: () => void; 
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <div className="text-red-600 mb-4">
      <strong>오류가 발생했습니다</strong>
    </div>
    <p className="text-red-700 mb-4">{error}</p>
    <Button 
      onClick={onRetry}
      variant="outline" 
      className="border-red-300 text-red-600" // hover:bg-red-50 제거
    >
      다시 시도
    </Button>
  </div>
));

ErrorMessage.displayName = 'ErrorMessage';

// 빈 상태 컴포넌트
const EmptyState = React.memo(() => (
  <div className="bg-white rounded-xl p-12 shadow-sm text-center border-2 border-dashed border-gray-200">
    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Plus className="h-10 w-10 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      첫 번째 여행을 계획해보세요!
    </h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      AI가 도와주는 맞춤형 여행 계획으로 특별한 추억을 만들어보세요.
    </p>
    <Link href="/planner">
      <Button className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-all duration-300"> {/* hover:bg-blue-700 hover:shadow-xl 제거 */}
        <Plus className="h-5 w-5 mr-2" />
        새로운 여행 계획하기
      </Button>
    </Link>
  </div>
));

EmptyState.displayName = 'EmptyState';

// 컴포넌트 언마운트 시 캐시 정리 (메모리 누수 방지)
export const clearTravelPlansCache = () => {
  cache.clear();
};
