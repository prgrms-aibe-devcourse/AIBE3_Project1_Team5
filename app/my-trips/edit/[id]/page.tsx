'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Plus, Search, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

// 샘플 여행 데이터 (실제로는 API에서 가져올 데이터)
const sampleTripData = {
  id: 1,
  title: '제주도 힐링 여행',
  startDate: '2024-03-15',
  endDate: '2024-03-18',
  destinations: ['제주도, 대한민국'],
  timeline: [
    {
      id: 1,
      day: 1,
      date: '2024-03-15',
      activities: [
        {
          id: 1,
          time: '09:00',
          location: '김포공항',
          notes: '체크인 2시간 전 도착',
        },
        { id: 2, time: '11:00', location: '제주국제공항', notes: '' },
        {
          id: 3,
          time: '12:30',
          location: '제주공항 렌터카',
          notes: '롯데렌터카 예약',
        },
        {
          id: 4,
          time: '14:00',
          location: '흑돼지 맛집',
          notes: '현지 추천 맛집',
        },
        { id: 5, time: '16:00', location: '제주 신라호텔', notes: '' },
      ],
    },
    {
      id: 2,
      day: 2,
      date: '2024-03-16',
      activities: [
        { id: 6, time: '08:00', location: '제주 신라호텔', notes: '' },
        { id: 7, time: '09:30', location: '성산일출봉', notes: '일출 명소' },
        { id: 8, time: '12:00', location: '성산포 맛집', notes: '' },
        { id: 9, time: '14:00', location: '우도', notes: '페리 이용' },
      ],
    },
  ],
};

export default function EditTripPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id;

  const [tripData, setTripData] = useState(sampleTripData);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // 자동 저장 시뮬레이션
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      setIsAutoSaving(true);
      setTimeout(() => setIsAutoSaving(false), 1000);
    }, 10000); // 10초마다 자동 저장

    return () => clearInterval(autoSaveInterval);
  }, []);

  const handleAddActivity = (dayId: number) => {
    const newActivity = {
      id: Date.now(),
      time: '12:00',
      location: '', // 장소 필드 유지
      notes: '', // 메모 필드 유지
    };

    setTripData((prev) => ({
      ...prev,
      timeline: prev.timeline.map((day) =>
        day.id === dayId ? { ...day, activities: [...day.activities, newActivity] } : day
      ),
    }));
  };

  const handleDeleteActivity = (dayId: number, activityId: number) => {
    setTripData((prev) => ({
      ...prev,
      timeline: prev.timeline.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: day.activities.filter((activity) => activity.id !== activityId),
            }
          : day
      ),
    }));
  };

  const handleActivityChange = (
    dayId: number,
    activityId: number,
    field: string,
    value: string
  ) => {
    setTripData((prev) => ({
      ...prev,
      timeline: prev.timeline.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: day.activities.map((activity) =>
                activity.id === activityId ? { ...activity, [field]: value } : activity
              ),
            }
          : day
      ),
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tripData.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{tripData.destinations.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAutoSaving && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  자동 저장 중...
                </div>
              )}
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel: Trip Info & Timeline */}
        <div className="w-1/2 p-6 overflow-y-auto border-r">
          <div className="space-y-6">
            {/* Trip Summary (Editable) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">여행 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">여행 제목</Label>
                  <Input
                    value={tripData.title}
                    onChange={(e) =>
                      setTripData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">출발일</Label>
                    <Input
                      type="date"
                      value={tripData.startDate}
                      onChange={(e) =>
                        setTripData((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">도착일</Label>
                    <Input
                      type="date"
                      value={tripData.endDate}
                      onChange={(e) =>
                        setTripData((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">여행지</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tripData.destinations.map((destination, index) => (
                      <Badge key={index} variant="outline">
                        {destination}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline View */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">여행 일정 (타임라인)</h2>

              {tripData.timeline.map((day) => (
                <Card key={day.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Day {day.day} - {formatDate(day.date)}
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handleAddActivity(day.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        활동 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {day.activities.map((activity, index) => (
                        <div key={activity.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-12 gap-4 items-start">
                            {/* 시간 */}
                            <div className="col-span-3">
                              <Label className="text-xs text-gray-500">시간</Label>
                              <Input
                                type="time"
                                value={activity.time}
                                onChange={(e) =>
                                  handleActivityChange(day.id, activity.id, 'time', e.target.value)
                                }
                                className="mt-1"
                              />
                            </div>
                            {/* 메모 (한 줄) */}
                            <div className="col-span-7">
                              <Label className="text-xs text-gray-500">메모 (한 줄)</Label>
                              <Input
                                placeholder="간단한 메모"
                                value={activity.notes}
                                onChange={(e) =>
                                  handleActivityChange(day.id, activity.id, 'notes', e.target.value)
                                }
                                className="mt-1"
                              />
                            </div>
                            {/* 삭제 버튼 */}
                            <div className="col-span-2 flex justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteActivity(day.id, activity.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {/* 장소 (검색 가능한 입력란) */}
                            <div className="col-span-12">
                              <Label className="text-xs text-gray-500">장소</Label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  placeholder="장소 검색 또는 지도 클릭으로 추가"
                                  value={activity.location}
                                  onChange={(e) =>
                                    handleActivityChange(
                                      day.id,
                                      activity.id,
                                      'location',
                                      e.target.value
                                    )
                                  }
                                  className="pl-10 mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Google Map View */}
        <div className="w-1/2 p-6 bg-white flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                여행지 지도
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="w-full flex-1 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">Google Maps 연동 예정</p>
                  <p className="text-sm">여행지 위치와 경로가 표시됩니다</p>
                  <p className="text-xs mt-2">지도를 클릭하여 장소를 추가할 수 있습니다.</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">지도 기능</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 여행지 위치 마커 표시</li>
                  <li>• 일정 순서대로 경로 표시</li>
                  <li>• 지도 클릭으로 새 장소 추가</li>
                  <li>• 거리 및 이동 시간 계산</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
