import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Star } from 'lucide-react';
import { calculateTotalCost, getBudgetCategory, POPULAR_THRESHOLD } from '@/utils/destination/destinationUtils'; // 유틸리티 함수 임포트
import { Destination } from '@/utils/destination/types'; // 타입 정의 임포트

interface DestinationCardProps {
  destination: Destination;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick?: () => void;
}

const DestinationCard = React.memo(
  ({ destination, isFavorite, onToggleFavorite, onClick }: DestinationCardProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const totalCost = calculateTotalCost(destination);
    const budgetCategory = getBudgetCategory(totalCost);
    const isPopular = (destination.view_count || 0) > POPULAR_THRESHOLD;

    return (
      <Card
        className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
        onClick={onClick}
      >
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-100">
            <Image
              src={destination.image_url || '/placeholder.svg'}
              alt={destination.name_kr}
              fill
              className={`object-cover group-hover:scale-105 transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={isPopular}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />

            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}

            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-400">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">이미지를 불러올 수 없습니다</p>
                </div>
              </div>
            )}
          </div>

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
  }
);

DestinationCard.displayName = 'DestinationCard';

export default DestinationCard;