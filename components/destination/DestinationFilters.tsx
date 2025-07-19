import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Star, Grid, List } from 'lucide-react';
import { REGIONS, BUDGETS } from '@/utils/destination/constants'; // 상수 임포트
import { FilterState } from '@/utils/destination/types'; // 타입 정의 임포트

interface DestinationFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | boolean) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const DestinationFilters = React.memo(
  ({ filters, onFilterChange, viewMode, onViewModeChange }: DestinationFiltersProps) => {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="여행지, 국가, 키워드로 검색..."
                value={filters.searchQuery}
                onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>

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
    );
  }
);

DestinationFilters.displayName = 'DestinationFilters';

export default DestinationFilters;