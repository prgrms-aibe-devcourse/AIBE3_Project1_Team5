'use client';

import { useState } from 'react';
import { Search, Star, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterState {
  searchQuery: string;
  selectedRegion: string;
  selectedBudget: string;
  showPopularOnly: boolean;
}

interface SearchAndFilterProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | boolean) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onResetFilters: () => void;
  resultsCount: number;
  totalCount: number;
}

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

export default function SearchAndFilter({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
  resultsCount,
  totalCount,
}: SearchAndFilterProps) {
  return (
    <>
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
                onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <Select
                  value={filters.selectedRegion}
                  onValueChange={(value) => onFilterChange('selectedRegion', value)}
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
                  onValueChange={(value) => onFilterChange('selectedBudget', value)}
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
                  onClick={() => onFilterChange('showPopularOnly', !filters.showPopularOnly)}
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
                  onClick={() => onViewModeChange('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
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
          총 <span className="font-semibold text-blue-600">{resultsCount}</span>
          개의 여행지를 찾았습니다 (전체 {totalCount}개 중)
        </p>

        {resultsCount !== totalCount && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            필터 초기화
          </Button>
        )}
      </div>
    </>
  );
}
