'use client';

import { useState } from 'react';
import { Edit3, Share2, Trash2, MapPin, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// 샘플 여행 데이터 (실제로는 상태 관리나 API에서 가져올 데이터)
const sampleTrips = [
  {
    id: 1,
    title: '제주도 힐링 여행',
    startDate: '2024-03-15',
    endDate: '2024-03-18',
    destinations: ['제주도, 대한민국'],
    image: '/placeholder.svg?height=120&width=160',
    createdAt: '2024-01-15',
    status: 'planned', // planned, ongoing, completed
  },
  {
    id: 2,
    title: '일본 벚꽃 여행',
    startDate: '2024-04-05',
    endDate: '2024-04-10',
    destinations: ['도쿄, 일본', '교토, 일본', '오사카, 일본'],
    image: '/placeholder.svg?height=120&width=160',
    createdAt: '2024-01-10',
    status: 'planned',
  },
  {
    id: 3,
    title: '유럽 배낭여행',
    startDate: '2024-06-01',
    endDate: '2024-06-15',
    destinations: ['파리, 프랑스', '로마, 이탈리아', '바르셀로나, 스페인'],
    image: '/placeholder.svg?height=120&width=160',
    createdAt: '2024-01-08',
    status: 'planned',
  },
  {
    id: 4,
    title: '부산 맛집 투어',
    startDate: '2023-12-20',
    endDate: '2023-12-22',
    destinations: ['부산, 대한민국'],
    image: '/placeholder.svg?height=120&width=160',
    createdAt: '2023-12-15',
    status: 'completed',
  },
];

export default function MyTripsPage() {
  const [trips, setTrips] = useState(sampleTrips);

  const handleEdit = (tripId: number) => {
    console.log('편집:', tripId);
    // 편집 로직 구현
  };

  const handleShare = (tripId: number) => {
    console.log('공유:', tripId);
    // 공유 로직 구현
  };

  const handleDelete = (tripId: number) => {
    if (confirm('정말로 이 여행 일정을 삭제하시겠습니까?')) {
      setTrips(trips.filter((trip) => trip.id !== tripId));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            예정
          </Badge>
        );
      case 'ongoing':
        return (
          <Badge variant="default" className="bg-green-600">
            진행중
          </Badge>
        );
      case 'completed':
        return <Badge variant="secondary">완료</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">내 여행</h1>
            <p className="text-gray-600">나의 여행 기록과 계획을 관리해보세요</p>
          </div>
          <Link href="/planner/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />새 여행 계획
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {trips.filter((trip) => trip.status === 'planned').length}
              </div>
              <div className="text-sm text-gray-600">예정된 여행</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {trips.filter((trip) => trip.status === 'ongoing').length}
              </div>
              <div className="text-sm text-gray-600">진행중인 여행</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-600 mb-1">
                {trips.filter((trip) => trip.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">완료된 여행</div>
            </CardContent>
          </Card>
        </div>

        {/* Trip List */}
        {trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Left Side - Trip Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2">{trip.title}</h2>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </span>
                          </div>
                          <div className="flex items-start text-sm text-gray-600 mb-3">
                            <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {trip.destinations.map((destination, index) => (
                                <span key={index}>
                                  {destination}
                                  {index < trip.destinations.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(trip.status)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(trip.id)}
                          className="flex items-center"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          편집
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(trip.id)}
                          className="flex items-center"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          공유
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(trip.id)}
                          className="flex items-center text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>

                    {/* Right Side - Trip Image */}
                    <div className="w-40 h-32 flex-shrink-0">
                      <img
                        src={trip.image || '/placeholder.svg'}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 여행 계획이 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 여행 계획을 만들어보세요!</p>
              <Link href="/planner/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />새 여행 계획 만들기
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
