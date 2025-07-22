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
import { useDestinationLike } from '@/hooks/destination/useDestinationLike';
import LikeButton from '@/components/destination/LikeButton';
import GoogleSearchResults from '@/components/destination/GoogleSearchResults';

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [destination, setDestination] = useState<any>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const destinationId = params.id as string;

  const { isLiked, toggleLike } = useDestinationLike(destinationId);

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

        // 리뷰 작성자 이름 가져오기
        if (reviewsRes.data && reviewsRes.data.length > 0) {
          const uniqueUserIds = Array.from(new Set(reviewsRes.data.map((r: any) => r.user_id)));
          if (uniqueUserIds.length > 0) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('user_id, name')
              .in('user_id', uniqueUserIds);
            if (profileError) {
              console.error('프로필 데이터를 불러오지 못했습니다:', profileError.message);
            } else if (profileData) {
              const namesMap = profileData.reduce((acc: any, profile: any) => {
                acc[profile.user_id] = profile.name;
                return acc;
              }, {} as Record<string, string>);
              setUserNames(namesMap);
            }
          }
        }
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
            <LikeButton isLiked={isLiked} onClick={toggleLike} label={isLiked ? '찜' : '찜하기'} />
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
                    <GoogleSearchResults destination={destination} searchType="spots" />
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
                    <GoogleSearchResults destination={destination} searchType="hotels" />
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
                    <GoogleSearchResults destination={destination} searchType="foods" />
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
                                <div className="flex items-center mb-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-sm font-medium text-blue-600">
                                      {userNames[review.user_id]?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {userNames[review.user_id] || '익명 사용자'}
                                    </p>
                                    <p className="text-xs text-gray-500">리뷰 #{index + 1}</p>
                                  </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{review.content}</p>
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
