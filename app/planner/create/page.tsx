'use client';

import { useState } from 'react';
import { MapPin, Plus, Edit3, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// 여행지 목록 (실제로는 API에서 가져올 데이터)
const destinations = [
  { value: 'seoul', label: '서울, 대한민국' },
  { value: 'busan', label: '부산, 대한민국' },
  { value: 'jeju', label: '제주도, 대한민국' },
  { value: 'tokyo', label: '도쿄, 일본' },
  { value: 'kyoto', label: '교토, 일본' },
  { value: 'osaka', label: '오사카, 일본' },
  { value: 'paris', label: '파리, 프랑스' },
  { value: 'london', label: '런던, 영국' },
  { value: 'rome', label: '로마, 이탈리아' },
  { value: 'barcelona', label: '바르셀로나, 스페인' },
  { value: 'newyork', label: '뉴욕, 미국' },
  { value: 'bangkok', label: '방콕, 태국' },
  { value: 'singapore', label: '싱가포르' },
  { value: 'hongkong', label: '홍콩' },
  { value: 'taipei', label: '타이베이, 대만' },
];

interface TripPlan {
  title: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  destinations: string[];
}

export default function CreatePlannerPage() {
  const [tripPlan, setTripPlan] = useState<TripPlan>({
    title: '',
    startDate: undefined,
    endDate: undefined,
    destinations: [],
  });

  const [itinerary, setItinerary] = useState([
    { id: 1, day: 1, time: '09:00', activity: '', location: '', notes: '' },
  ]);

  const [openDestinations, setOpenDestinations] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const addDestination = (destinationValue: string) => {
    if (!tripPlan.destinations.includes(destinationValue)) {
      setTripPlan({
        ...tripPlan,
        destinations: [...tripPlan.destinations, destinationValue],
      });
    }
  };

  const removeDestination = (destinationValue: string) => {
    setTripPlan({
      ...tripPlan,
      destinations: tripPlan.destinations.filter((d) => d !== destinationValue),
    });
  };

  const addActivity = () => {
    const newActivity = {
      id: Date.now(),
      day: 1,
      time: '12:00',
      activity: '',
      location: '',
      notes: '',
    };
    setItinerary([...itinerary, newActivity]);
  };

  const createTrip = () => {
    // 필수 입력 검증
    if (
      !tripPlan.title ||
      !tripPlan.startDate ||
      !tripPlan.endDate ||
      tripPlan.destinations.length === 0
    ) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    setIsCreated(true);
  };

  const isFormValid =
    tripPlan.title && tripPlan.startDate && tripPlan.endDate && tripPlan.destinations.length > 0;

  if (!isCreated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">새 여행 일정 생성</h1>
            <p className="text-gray-600">기본 정보를 입력하여 여행 계획을 시작해보세요</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit3 className="h-5 w-5 mr-2 text-blue-600" />
                여행 기본 정보
              </CardTitle>
              <CardDescription>
                여행의 기본 정보를 입력해주세요. 모든 항목은 필수입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 여행 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  여행 제목 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="예: 제주도 힐링 여행"
                  value={tripPlan.title}
                  onChange={(e) => setTripPlan({ ...tripPlan, title: e.target.value })}
                  className="text-lg"
                />
              </div>

              {/* 날짜 선택 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    출발 날짜 <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !tripPlan.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tripPlan.startDate ? (
                          format(tripPlan.startDate, 'PPP', { locale: ko })
                        ) : (
                          <span>출발 날짜 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={tripPlan.startDate}
                        onSelect={(date) => setTripPlan({ ...tripPlan, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    도착 날짜 <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !tripPlan.endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tripPlan.endDate ? (
                          format(tripPlan.endDate, 'PPP', { locale: ko })
                        ) : (
                          <span>도착 날짜 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={tripPlan.endDate}
                        onSelect={(date) => setTripPlan({ ...tripPlan, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* 여행지 선택 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  여행지 <span className="text-red-500">*</span>
                </Label>
                <Popover open={openDestinations} onOpenChange={setOpenDestinations}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDestinations}
                      className="w-full justify-between bg-transparent"
                    >
                      여행지 검색 및 선택
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="여행지를 검색하세요..." />
                      <CommandList>
                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                        <CommandGroup>
                          {destinations.map((destination) => (
                            <CommandItem
                              key={destination.value}
                              value={destination.value}
                              onSelect={() => {
                                addDestination(destination.value);
                                setOpenDestinations(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  tripPlan.destinations.includes(destination.value)
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {destination.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* 선택된 여행지 표시 */}
                {tripPlan.destinations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tripPlan.destinations.map((destinationValue) => {
                      const destination = destinations.find((d) => d.value === destinationValue);
                      return (
                        <Badge key={destinationValue} variant="secondary" className="px-3 py-1">
                          {destination?.label}
                          <button
                            onClick={() => removeDestination(destinationValue)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 생성 버튼 */}
              <div className="flex justify-end pt-4">
                <Button onClick={createTrip} disabled={!isFormValid} size="lg" className="px-8">
                  여행 계획 생성하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tripPlan.title}</h1>
          <p className="text-gray-600">
            {tripPlan.startDate && tripPlan.endDate && (
              <>
                {format(tripPlan.startDate, 'PPP', { locale: ko })} -{' '}
                {format(tripPlan.endDate, 'PPP', { locale: ko })}
              </>
            )}
          </p>
          <div className="flex justify-center flex-wrap gap-2 mt-2">
            {tripPlan.destinations.map((destinationValue) => {
              const destination = destinations.find((d) => d.value === destinationValue);
              return (
                <Badge key={destinationValue} variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {destination?.label}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>여행 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">여행 제목</Label>
                  <p className="font-medium">{tripPlan.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">여행 기간</Label>
                  <p className="font-medium">
                    {tripPlan.startDate && tripPlan.endDate && (
                      <>
                        {format(tripPlan.startDate, 'MM/dd', { locale: ko })} -{' '}
                        {format(tripPlan.endDate, 'MM/dd', { locale: ko })}
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">여행지</Label>
                  <div className="space-y-1 mt-1">
                    {tripPlan.destinations.map((destinationValue) => {
                      const destination = destinations.find((d) => d.value === destinationValue);
                      return (
                        <div key={destinationValue} className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                          {destination?.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itinerary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>여행 일정</CardTitle>
                  <CardDescription>하루별 세부 일정을 계획해보세요</CardDescription>
                </div>
                <Button onClick={addActivity} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  활동 추가
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {itinerary.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">시간</Label>
                          <Input
                            type="time"
                            value={item.time}
                            onChange={(e) => {
                              setItinerary(
                                itinerary.map((i) =>
                                  i.id === item.id ? { ...i, time: e.target.value } : i
                                )
                              );
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">활동</Label>
                          <Input
                            value={item.activity}
                            placeholder="활동 내용"
                            onChange={(e) => {
                              setItinerary(
                                itinerary.map((i) =>
                                  i.id === item.id ? { ...i, activity: e.target.value } : i
                                )
                              );
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">장소</Label>
                          <Input
                            value={item.location}
                            placeholder="위치"
                            onChange={(e) => {
                              setItinerary(
                                itinerary.map((i) =>
                                  i.id === item.id ? { ...i, location: e.target.value } : i
                                )
                              );
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">메모</Label>
                          <Input
                            value={item.notes}
                            placeholder="메모"
                            onChange={(e) => {
                              setItinerary(
                                itinerary.map((i) =>
                                  i.id === item.id ? { ...i, notes: e.target.value } : i
                                )
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <Button variant="outline">임시저장</Button>
                  <Button>일정 저장</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
