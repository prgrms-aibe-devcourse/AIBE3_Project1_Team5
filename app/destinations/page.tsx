'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, MapPin, Star, Heart, Grid, List, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// 상수 정의
const REGIONS = [
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

const BUDGETS = ['전체', '저예산', '중간예산', '고예산'];

const BUDGET_THRESHOLDS = {
  LOW: 100000,
  HIGH: 300000,
};

const POPULAR_THRESHOLD = 1000;

// 타입 정의
interface Destination {
  id: string;
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
  cost_sightseeing_per_day?: number;
  tips?: string;
  best_time?: string;
  weather_spring?: string;
  weather_summer?: string;
  weather_autumn?: string;
  weather_winter?: string;
}

interface FilterState {
  searchQuery: string;
  selectedRegion: string;
  selectedBudget: string;
  showPopularOnly: boolean;
}

// 유틸리티 함수들
const calculateTotalCost = (destination: Destination): number => {
  return (
    (destination.cost_flight || 0) +
    (destination.cost_hotel_per_night || 0) +
    (destination.cost_meal_per_day || 0) +
    (destination.cost_sightseeing_per_day || 0)
  );
};

const getBudgetCategory = (totalCost: number): string => {
  if (totalCost < BUDGET_THRESHOLDS.LOW) return '저예산';
  if (totalCost > BUDGET_THRESHOLDS.HIGH) return '고예산';
  return '중간예산';
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString() + '원';
};

// 커스텀 훅: 데이터 관리
const useDestinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // order 문법 수정: .desc() 메서드 사용
      const { data, error } = await supabase
        .from('travels')
        .select(
          `
          id,
          name_kr,
          name_en,
          country,
          region,
          description,
          image_url,
          rating_num,
          view_count,
          cost_flight,
          cost_hotel_per_night,
          cost_meal_per_day,
          cost_sightseeing_per_day,
          tips,
          best_time,
          weather_spring,
          weather_summer,
          weather_autumn,
          weather_winter
        `
        )
        .order('view_count', { ascending: false }); // 올바른 문법

      if (error) {
        console.error('Supabase 에러:', error);
        throw error;
      }

      console.log('✅ 데이터 로드 성공:', data?.length || 0, '개');
      setDestinations(data || []);
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { destinations, loading, error, fetchDestinations };
};

// 커스텀 훅: 필터링 로직
const useFilteredDestinations = (destinations: Destination[], filters: FilterState) => {
  return useMemo(() => {
    return destinations.filter((destination) => {
      // 검색어 필터링
      const matchesSearch =
        !filters.searchQuery ||
        destination.name_kr?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        destination.name_en?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        destination.country?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        destination.description?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      // 지역 필터링
      const matchesRegion =
        filters.selectedRegion === '전체' || destination.region === filters.selectedRegion;

      // 예산 필터링
      const totalCost = calculateTotalCost(destination);
      const budgetCategory = getBudgetCategory(totalCost);
      const matchesBudget =
        filters.selectedBudget === '전체' || budgetCategory === filters.selectedBudget;

      // 인기 여행지 필터링
      const matchesPopular =
        !filters.showPopularOnly || (destination.view_count || 0) > POPULAR_THRESHOLD;

      return matchesSearch && matchesRegion && matchesBudget && matchesPopular;
    });
  }, [destinations, filters]);
};

export default function DestinationsPage() {
  const { destinations, loading, error, fetchDestinations } = useDestinations();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedRegion: '전체',
    selectedBudget: '전체',
    showPopularOnly: false,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();

  const filteredDestinations = useFilteredDestinations(destinations, filters);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedRegion: '전체',
      selectedBudget: '전체',
      showPopularOnly: false,
    });
  }, []);

  // 수정된 toggleFavorite 함수 (id가 string이므로)
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]));
  }, []);

  // 에러 상태 처리
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>오류가 발생했습니다: {error}</span>
              <Button variant="outline" size="sm" onClick={fetchDestinations} className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // 로딩 상태 처리
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
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="pl-10 text-lg h-12"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <Select
                    value={filters.selectedRegion}
                    onValueChange={(value) => handleFilterChange('selectedRegion', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="지역" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.selectedBudget}
                    onValueChange={(value) => handleFilterChange('selectedBudget', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="예산" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGETS.map((budget) => (
                        <SelectItem key={budget} value={budget}>
                          {budget}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant={filters.showPopularOnly ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('showPopularOnly', !filters.showPopularOnly)}
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

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{filteredDestinations.length}</span>
            개의 여행지를 찾았습니다 (전체 {destinations.length}개 중)
          </p>

          {filteredDestinations.length !== destinations.length && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              필터 초기화
            </Button>
          )}
        </div>

        {/* Destinations Grid/List */}
        <Tabs value={viewMode} className="w-full">
          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDestinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  onClick={() => router.push(`/destinations/${destination.id}`)}
                  isFavorite={favorites.includes(destination.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {filteredDestinations.map((destination) => (
                <DestinationListItem
                  key={destination.id}
                  destination={destination}
                  isFavorite={favorites.includes(destination.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* No Results */}
        {filteredDestinations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500 mb-4">다른 검색어나 필터를 시도해보세요</p>
              <Button onClick={resetFilters}>필터 초기화</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// 개별 카드 컴포넌트
const DestinationCard = ({
  destination,
  isFavorite,
  onToggleFavorite,
  onClick,
}: {
  destination: Destination;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick?: () => void;
}) => {
  const totalCost = calculateTotalCost(destination);
  const budgetCategory = getBudgetCategory(totalCost);
  const isPopular = (destination.view_count || 0) > POPULAR_THRESHOLD;

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={destination.image_url || '/placeholder.svg'}
          alt={destination.name_kr}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 flex space-x-2">
          {isPopular && <Badge className="bg-red-500 text-white">인기</Badge>}
          <Button
            size="sm"
            variant="secondary"
            className="p-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(destination.id);
            }}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`}
            />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-full px-2 py-1 flex items-center">
          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
          <span className="text-sm font-medium">{destination.rating_num || 0}</span>
          <span className="text-xs text-gray-500 ml-1">({destination.view_count || 0})</span>
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
            {budgetCategory}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{destination.description}</p>
        <div className="text-xs text-gray-500">
          <span className="font-medium">최적 시기:</span> {destination.best_time || '연중'}
        </div>
      </CardContent>
    </Card>
  );
};

// 리스트 아이템 컴포넌트
const DestinationListItem = ({
  destination,
  isFavorite,
  onToggleFavorite,
}: {
  destination: Destination;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) => {
  const totalCost = calculateTotalCost(destination);
  const isPopular = (destination.view_count || 0) > POPULAR_THRESHOLD;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex">
        <div className="relative w-64 h-48 flex-shrink-0">
          <img
            src={destination.image_url || '/placeholder.svg'}
            alt={destination.name_kr}
            className="w-full h-full object-cover"
          />
          {isPopular && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-red-500 text-white">인기</Badge>
            </div>
          )}
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
                <span className="text-gray-500 ml-1">({destination.view_count || 0})</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(destination.id);
                }}
              >
                <Heart
                  className={`h-4 w-4 mr-1 ${
                    isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'
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
              <p className="text-sm text-gray-600 mt-1">{destination.tips || '정보 없음'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">최적 시기:</span>
              <p className="text-sm text-gray-600 mt-1">{destination.best_time || '연중'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-700">예상 비용:</span>
              <div className="text-sm text-gray-600 mt-1">
                <div>항공료: {formatCurrency(destination.cost_flight || 0)}</div>
                <div>숙박 (1박): {formatCurrency(destination.cost_hotel_per_night || 0)}</div>
                <div>식비 (1일): {formatCurrency(destination.cost_meal_per_day || 0)}</div>
                <div>관광비: {formatCurrency(destination.cost_sightseeing_per_day || 0)}</div>
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
  );
};
