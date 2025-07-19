'use client';

import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DestinationCard from '@/components/destination/DestinationCard';
import DestinationListItem from '@/components/destination/DestinationListItem';
import DestinationFilters from '@/components/destination/DestinationFilters';
import DestinationHeader from '@/components/destination/DestinationHeader';
import DestinationResultsInfo from '@/components/destination/DestinationResultsInfo';
import DestinationNoResults from '@/components/destination/DestinationNoResults';
import { useDestinationsData } from '@/hooks/destination/useDestinationsData';
import { useDestinationFilters } from '@/hooks/destination/useDestinationFilters';
import { Destination } from '@/utils/destination/types'; // 타입 정의 파일 필요

export default function DestinationsPage() {
  const { destinations, loading, error, fetchDestinations } = useDestinationsData();
  const { filters, handleFilterChange, resetFilters, filteredDestinations } = useDestinationFilters(destinations);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]));
  }, []);

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
        <DestinationHeader />

        <DestinationFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <DestinationResultsInfo
          filteredCount={filteredDestinations.length}
          totalCount={destinations.length}
          onResetFilters={resetFilters}
          showResetButton={filteredDestinations.length !== destinations.length}
        />

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

        {filteredDestinations.length === 0 && <DestinationNoResults onResetFilters={resetFilters} />}
      </div>
    </div>
  );
}