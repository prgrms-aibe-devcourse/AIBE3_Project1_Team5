import React from 'react';
import { Button } from '@/components/ui/button';

interface DestinationResultsInfoProps {
  filteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
  showResetButton: boolean;
}

const DestinationResultsInfo = React.memo(
  ({ filteredCount, totalCount, onResetFilters, showResetButton }: DestinationResultsInfoProps) => {
    return (
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          총 <span className="font-semibold text-blue-600">{filteredCount}</span>
          개의 여행지를 찾았습니다 (전체 {totalCount}개 중)
        </p>

        {showResetButton && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            필터 초기화
          </Button>
        )}
      </div>
    );
  }
);

DestinationResultsInfo.displayName = 'DestinationResultsInfo';

export default DestinationResultsInfo;