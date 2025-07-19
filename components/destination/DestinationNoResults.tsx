import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface DestinationNoResultsProps {
  onResetFilters: () => void;
}

const DestinationNoResults = React.memo(({ onResetFilters }: DestinationNoResultsProps) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Search className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
        <p className="text-gray-500 mb-4">다른 검색어나 필터를 시도해보세요</p>
        <Button onClick={onResetFilters}>필터 초기화</Button>
      </CardContent>
    </Card>
  );
});

DestinationNoResults.displayName = 'DestinationNoResults';

export default DestinationNoResults;