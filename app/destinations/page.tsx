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
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedBudget, setSelectedBudget] = useState('전체');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

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
      destination.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = selectedRegion === '전체' || destination.region === selectedRegion;
    const matchesBudget = selectedBudget === '전체' || destination.budget === selectedBudget;
    const matchesPopular = !showPopularOnly || destination.isPopular;

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
                      alt={destination._kr}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 flex space-x-2">
                      {destination.isPopular && (
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
                      <span className="text-sm font-medium">{destination.rating_num}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({destination.reviewCount})
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
                        {destination.budget}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {destination.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {destination.tags?.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">최적 시기:</span> {destination.bestTime}
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
                        src={destination.image || '/placeholder.svg'}
                        alt={destination.name_kr}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex space-x-2">
                        {destination.isPopular && (
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
                            <span className="font-medium">{destination.rating_num}</span>
                            <span className="text-gray-500 ml-1">({destination.reviewCount})</span>
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
                          <span className="text-sm font-medium text-gray-700">주요 명소:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {destination.highlights?.slice(0, 4).map((highlight, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">최적 시기:</span>
                          <p className="text-sm text-gray-600 mt-1">{destination.best_time}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {destination.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
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
