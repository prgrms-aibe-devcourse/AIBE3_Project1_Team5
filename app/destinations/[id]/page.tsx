'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Star, Heart, Clock, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import axios from 'axios';

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [destination, setDestination] = useState<any>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google 검색 통합 상태 관리
  const [googleSearchState, setGoogleSearchState] = useState({
    hotels: {
      showResults: false,
      response: null,
      results: [],
      loading: false,
      loadingMore: false,
      nextStart: null,
      hasMore: false,
    },
    spots: {
      showResults: false,
      response: null,
      results: [],
      loading: false,
      loadingMore: false,
      nextStart: null,
      hasMore: false,
    },
    foods: {
      showResults: false,
      response: null,
      results: [],
      loading: false,
      loadingMore: false,
      nextStart: null,
      hasMore: false,
    },
  });

  const destinationId = params.id as string;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // travels 먼저 fetch
        const { data: travelData, error: travelError } = await supabase
          .from('travels')
          .select('*')
          .eq('id', destinationId)
          .single();
        if (travelError || !travelData) {
          setError('여행지 정보를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        setDestination(travelData);
        // spots, hotels, foods, tags, reviews 병렬 fetch
        const [spotsRes, hotelsRes, foodsRes, tagsRes, reviewsRes] = await Promise.all([
          supabase.from('travel_spots').select('*').eq('travel_id', destinationId),
          supabase.from('travel_hotels').select('*').eq('travel_id', destinationId),
          supabase.from('travel_foods').select('*').eq('travel_id', destinationId),
          supabase.from('travel_tag').select('*').eq('travel_id', destinationId),
          supabase.from('review').select('*').eq('travel_id', destinationId),
        ]);
        setSpots(spotsRes.data || []);
        setHotels(hotelsRes.data || []);
        setFoods(foodsRes.data || []);
        setReviews(reviewsRes.data || []);
        setTags(tagsRes.data || []);

        // 사용자의 좋아요 상태 확인
        await checkUserLikeStatus(destinationId);
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (destinationId) fetchAll();
  }, [destinationId]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-700">여행지 정보를 불러오는 중...</div>
      </div>
    );
  }

  // 여행지 정보 없을 때
  if (error || !destination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">여행지를 찾을 수 없습니다</h1>
          <Button onClick={() => router.push('/destinations')}>여행지 목록으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  // 사용자 좋아요 상태 확인 함수
  async function checkUserLikeStatus(travelId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLiked(false);
      return;
    }

    const { data, error } = await supabase
      .from('travel_like')
      .select('*')
      .eq('user_id', user.id)
      .eq('travel_id', travelId)
      .maybeSingle();

    if (error) {
      console.error('좋아요 상태 확인 오류:', error);
      setIsLiked(false);
      return;
    }

    setIsLiked(!!data);
  }

  // 좋아요 버튼 토글 함수
  const toggleFavorite = async () => {
    try {
      // 즉시 UI 상태 변경 (낙관적 업데이트)
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);

      if (newLikedState) {
        // 좋아요 추가
        const result = await addLike(destination.id);
        if (!result.success) {
          // 실패 시 원래 상태로 되돌리기
          setIsLiked(false);
          if (
            result.error &&
            typeof result.error === 'object' &&
            'message' in result.error &&
            result.error.message === '로그인이 필요합니다'
          ) {
            alert('로그인이 필요한 서비스입니다.');
          }
        }
      } else {
        // 좋아요 삭제
        const result = await removeLike(destination.id);
        if (!result.success) {
          // 실패 시 원래 상태로 되돌리기
          setIsLiked(true);
        }
      }
    } catch (error) {
      // 에러 발생 시 원래 상태로 되돌리기
      setIsLiked(!isLiked);
      console.error('찜하기 토글 오류:', error);
    }
  };

  // 좋아요 추가 함수
  async function addLike(travelId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { error } = await supabase
        .from('travel_like')
        .insert({ user_id: user.id, travel_id: travelId });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('좋아요 추가 오류:', error);
      return { success: false, error };
    }
  }

  // 좋아요 삭제 함수
  async function removeLike(travelId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      const { error } = await supabase
        .from('travel_like')
        .delete()
        .eq('user_id', user.id)
        .eq('travel_id', travelId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('좋아요 삭제 오류:', error);
      return { success: false, error };
    }
  }

  // 예산 계산 함수
  function calculateBudget(type: 1 | 2 | 3) {
    if (!destination) return 0;
    let multiplier = 1;
    switch (type) {
      case 1: // 절약형
        multiplier = 0.7;
        break;
      case 2: // 일반형
        multiplier = 1;
        break;
      case 3: // 럭셔리
        multiplier = 1.5;
        break;
      default:
        return 0;
    }
    return (
      (destination.cost_flight ?? 0) +
      (destination.cost_hotel_per_night ?? 0) * multiplier * 2 +
      (destination.cost_meal_per_day ?? 0) * multiplier * 3 +
      (destination.cost_sightseeing_per_day ?? 0) * multiplier * 3 +
      (destination.cost_etc_per_day ?? 0) * multiplier * 3
    );
  }

  //후기 평점 계산
  const averageScore =
    reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + review.score, 0) / reviews.length).toFixed(1)
      : '0.0';

  // 구글 검색 결과 로드 함수
  const loadGoogleResults = async (
    searchType: 'hotels' | 'spots' | 'foods',
    start: number = 1,
    append: boolean = false
  ) => {
    // 검색어 설정
    let query = destination.name_kr;
    if (searchType === 'hotels') query += ' 숙소';
    if (searchType === 'spots') query += ' 관광지';
    if (searchType === 'foods') query += ' 맛집';

    try {
      const res = await fetch(
        `/api/google_api_route?query=${encodeURIComponent(query)}&start=${start}`
      );
      const data = await res.json();

      setGoogleSearchState((prev) => ({
        ...prev,
        [searchType]: {
          ...prev[searchType],
          response: data,
          nextStart: data.nextStart,
          hasMore: !!data.nextStart,
          results: append
            ? [...prev[searchType].results, ...(data.results || [])]
            : data.results || [],
        },
      }));
    } catch (error) {
      console.error('Google 검색 오류:', error);
    }
  };

  // 더 많은 결과 로드
  const loadMoreResults = async (searchType: 'hotels' | 'spots' | 'foods') => {
    const currentState = googleSearchState[searchType];

    if (!currentState.nextStart || currentState.loadingMore) return;

    setGoogleSearchState((prev) => ({
      ...prev,
      [searchType]: {
        ...prev[searchType],
        loadingMore: true,
      },
    }));

    await loadGoogleResults(searchType, currentState.nextStart, true);

    setGoogleSearchState((prev) => ({
      ...prev,
      [searchType]: {
        ...prev[searchType],
        loadingMore: false,
      },
    }));
  };

  // Google 검색 결과 UI 컴포넌트
  // 더보기 버튼 컴포넌트
  const MoreButton = ({
    onClick,
    loading = false,
    text = '더보기',
    className = 'mt-8',
  }: {
    onClick: () => void;
    loading?: boolean;
    text?: string;
    className?: string;
  }) => (
    <div className={`text-center ${className}`}>
      <button
        className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-blue-600 bg-white border-2 border-blue-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onClick}
        disabled={loading}
      >
        <span className="mr-2">{loading ? '로딩 중...' : text}</span>
        {!loading && (
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );

  // 구글 검색 결과 컴포넌트
  const GoogleSearchResults = ({ searchType }: { searchType: 'hotels' | 'spots' | 'foods' }) => {
    const currentState = googleSearchState[searchType];

    const handleLoadMore = async () => {
      await loadMoreResults(searchType);
    };

    const handleShowResults = async () => {
      setGoogleSearchState((prev) => ({
        ...prev,
        [searchType]: {
          ...prev[searchType],
          showResults: true,
          loading: true,
        },
      }));

      await loadGoogleResults(searchType, 1, false);

      setGoogleSearchState((prev) => ({
        ...prev,
        [searchType]: {
          ...prev[searchType],
          loading: false,
        },
      }));
    };

    const handleHideResults = () => {
      setGoogleSearchState((prev) => ({
        ...prev,
        [searchType]: {
          ...prev[searchType],
          showResults: false,
          response: null,
          results: [],
          nextStart: null,
          hasMore: false,
        },
      }));
    };

    return (
      <>
        {/* 더보기 버튼 */}
        {!currentState.showResults && <MoreButton onClick={handleShowResults} />}

        {/* 가공된 구글 검색 결과 */}
        {currentState.showResults && (
          <div className="mt-6">
            <div className="flex items-center justify-center mb-4">
              <button
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition"
                onClick={handleHideResults}
              >
                <ChevronUp className="h-4 w-4" />
                <span>접기</span>
              </button>
            </div>
            {currentState.loading ? (
              <div className="text-center py-4">검색 중...</div>
            ) : currentState.results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentState.results.map((result: any) => (
                    <Card
                      key={result.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => window.open(result.link, '_blank', 'noopener,noreferrer')}
                    >
                      <div className="relative h-48">
                        <img
                          src={result.image || result.thumbnail || '/placeholder.jpg'}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.jpg';
                          }}
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{result.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{result.snippet}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 더 많은 결과 로드 버튼 */}
                {currentState.hasMore && (
                  <MoreButton
                    onClick={handleLoadMore}
                    loading={currentState.loadingMore}
                    text="더 많은 결과 보기"
                    className="mt-6"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">검색 결과가 없습니다.</div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {/* Background Image */}
        <div className="relative h-96 w-full">
          <img
            src={destination.image_url}
            alt={destination.name_kr}
            className="w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30"></div>

          {/* Back Button */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              onClick={() => router.push('/destinations')}
              className="bg-white/90 hover:bg-white text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              여행지 목록으로
            </Button>
          </div>

          {/* Favorite Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              onClick={toggleFavorite}
              className="bg-white/90 hover:bg-white border-white/50"
            >
              <Heart
                className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-600'}`}
              />
              <span className="ml-2">{isLiked ? '찜' : '찜하기'}</span>
            </Button>
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-5xl font-bold mb-2">{destination.name_kr}</h1>
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-xl">{destination.country}</span>
              </div>
              <p className="text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
                {destination.description}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium text-lg">{averageScore}</span>
                </div>
                <div className="text-lg text-gray-400">
                  <span>({reviews.length}개 후기)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {' '}
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <Card>
              <CardHeader>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">개요</TabsTrigger>
                    <TabsTrigger value="spots">관광지</TabsTrigger>
                    <TabsTrigger value="hotels">숙소</TabsTrigger>
                    <TabsTrigger value="foods">맛집</TabsTrigger>
                    <TabsTrigger value="reviews">리뷰</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* 여행지 소개 카드 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>✈️ 여행지 소개</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {destination.detail_description}
                        </p>

                        {/* 태그 */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {tags.map((tag: any, index: number) => (
                              <span
                                key={tag.id}
                                className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                              >
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 계절별 날씨와 예산 가이드 카드들 */}
                    <div className="grid grid-cols-1 md:grid-cols-11 gap-6">
                      {/* 계절별 날씨 카드 */}
                      <Card className="md:col-span-7">
                        <CardHeader>
                          <CardTitle className="flex items-center">🌤 계절별 날씨</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium min-w-[100px] text-gray-700">
                                봄 (3-5월)
                              </span>
                              <span className="text-sm text-gray-600 max-w-xs break-words">
                                {destination.weather_spring}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium min-w-[100px] text-gray-700">
                                여름 (6-8월)
                              </span>
                              <span className="text-sm text-gray-600 max-w-xs break-words">
                                {destination.weather_summer}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium min-w-[100px] text-gray-700">
                                가을 (9-11월)
                              </span>
                              <span className="text-sm text-gray-600 max-w-xs break-words">
                                {destination.weather_autumn}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium min-w-[100px] text-gray-700">
                                겨울 (12-2월)
                              </span>
                              <span className="text-sm text-gray-600 max-w-xs break-words">
                                {destination.weather_winter}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {/* 예산 가이드 카드 */}
                      <Card className="md:col-span-4">
                        <CardHeader>
                          <CardTitle className="flex items-center">💰 예산 가이드</CardTitle>
                          <div className="text-xs text-gray-400 mt-1">(2박 3일 기준)</div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="mb-4">
                            <div className="mb-2 p-2 rounded bg-green-50 flex justify-between items-center">
                              <span className="text-sm font-semibold">절약형</span>
                              <span className="text-base font-medium">
                                ₩ {calculateBudget(1).toLocaleString('ko-KR')}
                              </span>
                            </div>
                            <div className="mb-2 p-2 rounded bg-blue-50 flex justify-between items-center">
                              <span className="text-sm font-semibold">일반형</span>
                              <span className="text-base font-medium">
                                ₩ {calculateBudget(2).toLocaleString('ko-KR')}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-purple-50 flex justify-between items-center">
                              <span className="text-sm font-semibold">럭셔리</span>
                              <span className="text-base font-medium">
                                ₩ {calculateBudget(3).toLocaleString('ko-KR')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 여행 팁 카드 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>💡 여행 팁</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-start">
                            <span className="text-blue-500">•</span> {destination.tips}
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 관광지 탭 */}
                  <TabsContent value="spots" className="space-y-4">
                    <div className="mb-6">
                      <p className="text-gray-600">
                        총 <span className="font-semibold text-blue-600">{spots.length}</span>
                        개의 추천 관광지가 있습니다.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {spots.map((spot: any, index: number) => (
                        <Card key={spot.id ?? index} className="overflow-hidden">
                          <div className="relative h-48">
                            <img
                              src={spot.image_url}
                              alt={spot.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{spot.score}</span>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{spot.name}</h4>
                              <Badge variant="outline">{spot.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{spot.content}</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {spot.operation_time}
                              </div>
                              <div className="flex items-center">
                                {spot.price !== undefined && spot.price !== null
                                  ? `₩ ${Number(spot.price).toLocaleString('ko-KR')}`
                                  : ''}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {/* Google 검색 결과 */}
                    <GoogleSearchResults searchType="spots" />
                  </TabsContent>

                  {/* 숙박 탭 */}
                  <TabsContent value="hotels" className="space-y-4">
                    <div className="mb-6">
                      <p className="text-gray-600">
                        총 <span className="font-semibold text-blue-600">{hotels.length}</span>
                        개의 추천 숙소가 있습니다.
                      </p>
                    </div>{' '}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hotels.map((hotel: any, index: number) => (
                        <Card key={hotel.id} className="overflow-hidden">
                          <div className="relative h-48">
                            <img
                              src={hotel.image_url}
                              alt={hotel.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{hotel.score}</span>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{hotel.name}</h4>
                              <Badge variant="outline">{hotel.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{hotel.content}</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                {hotel.price_per_night !== undefined &&
                                hotel.price_per_night !== null
                                  ? `₩ ${Number(hotel.price_per_night).toLocaleString('ko-KR')}`
                                  : ''}{' '}
                                / 1박
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {/* Google 검색 결과 */}
                    <GoogleSearchResults searchType="hotels" />
                  </TabsContent>

                  {/* 맛집 탭 */}
                  <TabsContent value="foods" className="space-y-4">
                    <div className="mb-6">
                      <p className="text-gray-600">
                        총 <span className="font-semibold text-blue-600">{foods.length}</span>
                        개의 추천 맛집이 있습니다.
                      </p>
                    </div>{' '}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {foods.map((food: any, index: number) => (
                        <Card key={food.id} className="overflow-hidden">
                          <div className="relative h-48">
                            <img
                              src={food.image_url}
                              alt={food.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{food.score}</span>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{food.name}</h4>
                              <Badge variant="outline">{food.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{food.content}</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                {food.price !== undefined && food.price !== null
                                  ? `₩ ${Number(food.price).toLocaleString('ko-KR')}`
                                  : ''}{' '}
                                ~
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {/* Google 검색 결과 */}
                    <GoogleSearchResults searchType="foods" />
                  </TabsContent>

                  {/* 리뷰 탭 */}
                  <TabsContent value="reviews" className="space-y-4">
                    <div className="mb-6">
                      <p className="text-gray-600">
                        총 <span className="font-semibold text-blue-600">{reviews.length}</span>
                        개의 리뷰가 있습니다.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {reviews.map((review: any, index: number) => (
                        <Card key={review.id} className="overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-gray-700 leading-relaxed mb-3">
                                  {review.content}
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <span>리뷰 #{index + 1}</span>
                                </div>
                              </div>
                              <div className="ml-4 flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <Badge variant="outline" className="ml-2">
                                  {review.score}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            {' '}
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>여행 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">최적 시기</span>
                  <span className="font-medium">{destination.best_time}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    예상 비용 <span className="text-xs text-gray-400 ml-1">(2박 3일 기준)</span>
                  </span>
                  <span className="font-medium">
                    ₩ {calculateBudget(2).toLocaleString('ko-KR')}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">평점</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">
                      {averageScore}
                      <span className="text-gray-400">({reviews.length}개)</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Plan Trip Button */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">여행 계획하기</h3>
                <p className="text-sm text-gray-600 mb-4">
                  이 여행지를 포함한 맞춤형 여행 계획을 만들어보세요
                </p>
                <Button className="w-full" onClick={() => router.push('/planner')}>
                  여행 계획하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
