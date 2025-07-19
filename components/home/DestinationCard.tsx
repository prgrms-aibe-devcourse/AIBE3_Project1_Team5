// components/home/DestinationCard.tsx
import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Destination } from '@/utils/destination/types';

interface DestinationCardProps {
  destination: Destination;
}

function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/destinations/${destination.id}`} passHref>
        <div className="relative cursor-pointer">
          <Image
            src={destination.image_url || '/placeholder.svg'}
            alt={destination.name_kr}
            width={400} // 이미지의 고정 너비 (필수)
            height={200} // 이미지의 고정 높이 (필수)
            className="w-full h-48 object-cover"
            priority={true} // 초기 로딩 시 중요한 이미지이므로 우선순위 부여
          />
          <div className="absolute top-4 right-4 bg-white rounded-full px-2 py-1 flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            {/* 평균 점수와 리뷰 개수를 함께 표시 */}
            <span className="text-sm font-medium ml-1">
              {destination.avg_score?.toFixed(1) ?? 0} ({destination.review_count ?? 0})
            </span>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{destination.name_kr}</CardTitle>
          <CardDescription className="text-gray-500">{destination.country}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-2">{destination.description}</p>
        </CardContent>
      </Link>
    </Card>
  );
}

export default DestinationCard;