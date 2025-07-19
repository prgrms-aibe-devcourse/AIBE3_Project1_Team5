import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Image 컴포넌트 임포트
import { Destination } from '@/utils/destination/types'; // 타입 정의 임포트

interface DestinationCardProps {
  destination: Destination; // Destination 타입 사용
}

// 여행지 카드 컴포넌트 (서버 컴포넌트)
// Link 컴포넌트 사용을 위해 클라이언트 컴포넌트일 필요 없음
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
            <span className="text-sm font-medium ml-1">{destination.rating_num ?? 0}</span>
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