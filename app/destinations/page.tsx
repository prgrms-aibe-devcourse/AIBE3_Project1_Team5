'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Heart, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

// 여행지 데이터 타입 정의 (Supabase 테이블 구조에 맞춤)
interface Destination {
  id: number;
  name_kr: string;
  name_en?: string;
  country: string;
  region: string;
  description?: string;
  image_url?: string;
  rating_num?: number;
  view_count?: number;
  cost_flight?: number;
  cost_hotel_per_night?: number;
  cost_meal_per_day?: number;
  cost_sightseeing?: number;
  tips?: string;
  best_time?: string;
  weather_spring?: string;
  weather_summer?: string;
  weather_autumn?: string;
  weather_winter?: string;
}

// 필터 옵션들
const regions = [
  '전체',
  '동아시아',
  '동남아시아',
  '유럽',
  '북미',
  '남미',
  '오세아니아',
  '아프리카',
  '중동',
];
const budgets = ['전체', '저예산', '중간예산', '고예산'];

export default function DestinationsPage() {
  // 타입을 명시적으로 지정
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedBudget, setSelectedBudget] = useState('전체');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Supabase에서 여행지 데이터 가져오기
  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('travels').select('*');

      if (error) {
        console.error('Supabase fetch error:', error);
        setDestinations([]);
      } else {
        setDestinations(data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  // 필터링 로직
  const filteredDestinations = destinations.filter((destination) => {
    const matchesSearch =
      destination.name_kr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = selectedRegion === '전체' || destination.region === selectedRegion;

    // 예산 필터링 - cost 필드들을 기준으로 계산
    const totalCost =
      (destination.cost_flight || 0) +
      (destination.cost_hotel_per_night || 0) +
      (destination.cost_meal_per_day || 0) +
      (destination.cost_sightseeing || 0);

    let budgetCategory = '중간예산';
    if (totalCost < 100000) budgetCategory = '저예산';
    else if (totalCost > 300000) budgetCategory = '고예산';

    const matchesBudget = selectedBudget === '전체' || budgetCategory === selectedBudget;
    const matchesPopular = !showPopularOnly || (destination.view_count || 0) > 1000;

    return matchesSearch && matchesRegion && matchesBudget && matchesPopular;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]));
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">여행지 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">여행지 둘러보기</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            전 세계의 아름다운 여행지를 발견하고 다음 여행을 계획해보세요
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="여행지, 국가, 키워드로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-lg h-12"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="지역" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="예산" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((budget) => (
                        <SelectItem key={budget} value={budget}>
                          {budget}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showPopularOnly ? 'default' : 'outline'}
                    onClick={() => setShowPopularOnly(!showPopularOnly)}
                    className="flex items-center space-x-2"
                  >
                    <Star className="h-4 w-4" />
                    <span>인기 여행지만</span>
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{filteredDestinations.length}</span>
            개의 여행지를 찾았습니다
          </p>
        </div>

        {/* Destinations Grid/List */}
        <Tabs value={viewMode} className="w-full">
          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDestinations.map((destination) => (
                <Card
                  key={destination.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={destination.image_url || '/placeholder.svg'}
                      alt={destination.name_kr}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 flex space-x-2">
                      {destination.view_count > 1000 && (
                        <Badge className="bg-red-500 text-white">인기</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(destination.id);
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.includes(destination.id)
                              ? 'text-red-500 fill-current'
                              : 'text-gray-600'
                          }`}
                        />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-white/90 rounded-full px-2 py-1 flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{destination.rating_num || 0}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({destination.view_count || 0})
                      </span>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{destination.name_kr}</CardTitle>
                        <CardDescription className="flex items-center text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {destination.country}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          const totalCost =
                            (destination.cost_flight || 0) +
                            (destination.cost_hotel_per_night || 0) +
                            (destination.cost_meal_per_day || 0) +
                            (destination.cost_sightseeing || 0);
                          if (totalCost < 100000) return '저예산';
                          if (totalCost > 300000) return '고예산';
                          return '중간예산';
                        })()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {destination.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {destination.tips && (
                        <Badge variant="secondary" className="text-xs">
                          #{destination.tips.substring(0, 10)}...
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">최적 시기:</span>{' '}
                      {destination.best_time || '연중'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {filteredDestinations.map((destination) => (
                <Card
                  key={destination.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex">
                    <div className="relative w-64 h-48 flex-shrink-0">
                      <img
                        src={destination.image_url || '/placeholder.svg'}
                        alt={destination.name_kr}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex space-x-2">
                        {destination.view_count > 1000 && (
                          <Badge className="bg-red-500 text-white">인기</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{destination.name_kr}</h3>
                          <div className="flex items-center text-gray-500 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{destination.country}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium">{destination.rating_num || 0}</span>
                            <span className="text-gray-500 ml-1">
                              ({destination.view_count || 0})
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(destination.id);
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 mr-1 ${
                                favorites.includes(destination.id)
                                  ? 'text-red-500 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                            찜하기
                          </Button>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{destination.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">여행 팁:</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {destination.tips || '정보 없음'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">최적 시기:</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {destination.best_time || '연중'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">예상 비용:</span>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>항공료: {(destination.cost_flight || 0).toLocaleString()}원</div>
                            <div>
                              숙박 (1박): {(destination.cost_hotel_per_night || 0).toLocaleString()}
                              원
                            </div>
                            <div>
                              식비 (1일): {(destination.cost_meal_per_day || 0).toLocaleString()}원
                            </div>
                            <div>
                              관광비: {(destination.cost_sightseeing || 0).toLocaleString()}원
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">날씨 정보:</span>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>봄: {destination.weather_spring || '정보 없음'}</div>
                            <div>여름: {destination.weather_summer || '정보 없음'}</div>
                            <div>가을: {destination.weather_autumn || '정보 없음'}</div>
                            <div>겨울: {destination.weather_winter || '정보 없음'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* No Results */}
        {filteredDestinations.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 mb-4">다른 검색어나 필터를 시도해보세요</p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('전체');
                  setSelectedBudget('전체');
                  setShowPopularOnly(false);
                }}
              >
                필터 초기화
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
