import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Star } from 'lucide-react';
import { calculateTotalCost, POPULAR_THRESHOLD } from '@/utils/destination/destinationUtils'; // 유틸리티 함수 임포트
import { Destination } from '@/utils/destination/types'; // 타입 정의 임포트

interface DestinationListItemProps {
  destination: Destination;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const DestinationListItem = React.memo(
  ({ destination, isFavorite, onToggleFavorite }: DestinationListItemProps) => {
    const totalCost = calculateTotalCost(destination);
    const isPopular = (destination.view_count || 0) > POPULAR_THRESHOLD;

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-64 h-48 flex-shrink-0">
            <Image
              src={destination.image_url || '/placeholder.svg'}
              alt={destination.name_kr}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={isPopular}
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
          </div>
        </div>
      </Card>
    );
  }
);

DestinationListItem.displayName = 'DestinationListItem';

export default DestinationListItem;