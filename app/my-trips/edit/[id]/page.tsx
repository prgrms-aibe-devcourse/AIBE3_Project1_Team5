'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_MAP_LIBRARIES = ['places'];

const DEFAULT_CENTER = { lat: 33.450701, lng: 126.570667 };

function getDateRange(start: string, end: string) {
  const result = [];
  let current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

// fetchLatLng 함수 추가
async function fetchLatLng(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=ko&region=KR`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [tripData, setTripData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(10);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const activitiesRef = useRef(activities);
  // activityRefs 관련 선언 제거

  // 구글맵 로딩
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: GOOGLE_MAP_LIBRARIES as unknown as any[],
    language: 'ko', // 한글로 표시
  });

  // 여행 정보 fetch
  useEffect(() => {
    const fetchTrip = async () => {
      const { data } = await supabase.from('travel_schedule').select('*').eq('id', tripId).single();
      setTripData(data);
      if (data?.destination) {
        // 목적지 중심으로 지도 이동
        // (실제 구현에서는 fetchLatLng 함수 필요)
      }
    };
    fetchTrip();
  }, [tripId]);

  // 활동 fetch 함수 분리
  const fetchActivities = async () => {
    const { data } = await supabase
      .from('travel_activities')
      .select(
        'id, travel_id, date, time_ampm, time_hour, time_minute, location, lat, lng, created_at, updated_at'
      )
      .eq('travel_id', tripId);
    setActivities(data || []);
  };

  // 활동 fetch useEffect
  useEffect(() => {
    if (!tripId) return;
    fetchActivities();
  }, [tripId]);

  // 목적지 값 받아와서 상세페이지 진입 시 구글맵 중앙으로 배치
  useEffect(() => {
    if (tripData?.destination) {
      fetchLatLng(tripData.destination).then((coords) => {
        if (coords) setMapCenter(coords);
      });
    }
  }, [tripData?.destination]);

  // 날짜 목록
  const days = useMemo(() => {
    if (!tripData?.start_date || !tripData?.end_date) return [];
    return getDateRange(tripData.start_date, tripData.end_date);
  }, [tripData?.start_date, tripData?.end_date]);

  // 활동 추가
  const handleAddActivity = async (date: string) => {
    const newActivity = {
      id: uuidv4(),
      travel_id: tripId,
      date, // 날짜별로 구분
      time_ampm: 'AM',
      time_hour: null,
      time_minute: null,
      location: '',
      lat: null,
      lng: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActivities((prev) => [...prev, newActivity]);
    await supabase.from('travel_activities').upsert([newActivity], { onConflict: 'id' });
  };

  // 활동 수정
  const handleActivityChange = async (id: string, field: string, value: any) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, [field]: value, updated_at: new Date().toISOString() } : a
      )
    );
    setHasUnsavedChanges(true);

    // 즉시 저장
    const updated = activities.find((a) => a.id === id);
    if (updated) {
      await supabase.from('travel_activities').upsert(
        [
          {
            ...updated,
            [field]: value,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'id' }
      );
      setHasUnsavedChanges(false);
      setLastSaveTime(Date.now());
    }
  };

  // 활동 삭제
  const handleDeleteActivity = async (id: string) => {
    // UI에서 먼저 삭제
    setActivities((prev) => prev.filter((a) => a.id !== id));
    // supabase에서 삭제
    const { error } = await supabase.from('travel_activities').delete().eq('id', id);
    if (error) {
      // 삭제 실패 시 UI 복원
      alert('삭제에 실패했습니다. 다시 시도해 주세요.');
      // fetchActivities로 상태 동기화
      fetchActivities();
    }
  };

  // 저장 함수
  const saveAllActivities = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        activitiesRef.current.map((activity) =>
          supabase.from('travel_activities').upsert(
            [
              {
                id: activity.id,
                travel_id: activity.travel_id,
                date: activity.date,
                time_ampm: activity.time_ampm,
                time_hour: activity.time_hour,
                time_minute: activity.time_minute,
                location: activity.location,
                lat: activity.lat,
                lng: activity.lng,
                created_at: activity.created_at,
                updated_at: activity.updated_at,
              },
            ],
            { onConflict: 'id' }
          )
        )
      );
      setHasUnsavedChanges(false);
      setLastSaveTime(Date.now());
    } catch (e) {
      // 에러 처리
    } finally {
      setIsSaving(false);
    }
  };

  // 컴포넌트 언마운트 시 저장
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges) saveAllActivities();
    };
    // eslint-disable-next-line
  }, [hasUnsavedChanges, activities]);

  // activities 상태가 변경될 때마다 activitiesRef 업데이트
  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  // 저장 상태 표시 컴포넌트
  const renderSaveStatus = () => {
    if (isSaving) {
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm">저장 중...</span>
        </div>
      );
    }
    if (!hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm">저장 완료</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽: 정보 + 타임라인 */}
      <div className="w-1/2 flex flex-col border-r h-screen overflow-y-auto">
        {/* 상단: 여행 요약 정보 */}
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">여행 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {tripData && (
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">제목:</span>
                    <span className="ml-2">{tripData.title}</span>
                  </div>
                  <div>
                    <span className="font-semibold">출발일:</span>
                    <span className="ml-2">{tripData.start_date}</span>
                  </div>
                  <div>
                    <span className="font-semibold">도착일:</span>
                    <span className="ml-2">{tripData.end_date}</span>
                  </div>
                  <div>
                    <span className="font-semibold">목적지:</span>
                    <span className="ml-2">{tripData.destination}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* 하단: 타임라인 뷰 */}
        <div className="flex-1 p-6 pt-0 overflow-y-auto">
          <Card>
            <CardHeader className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">타임라인 뷰</CardTitle>
              {renderSaveStatus()}
            </CardHeader>
            <CardContent>
              {days.length === 0 ? (
                <div className="text-gray-500">출발일과 도착일을 입력하세요.</div>
              ) : (
                <div className="space-y-6">
                  {days.map((d, dayIdx) => {
                    const dateStr = d.toISOString().slice(0, 10);
                    const acts = activities
                      .filter((a) => a.date === dateStr)
                      .sort((a, b) => a.order - b.order);
                    return (
                      <div key={dateStr} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">
                            Day {dayIdx + 1} - {dateStr}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddActivity(dateStr)}
                          >
                            활동 추가
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {acts.map((act, idx) => (
                            <div key={act.id} className="border p-3 rounded bg-white mb-2">
                              <div className="flex items-center gap-2 mb-2">
                                <select
                                  value={act.time_ampm || ''}
                                  onChange={(e) =>
                                    handleActivityChange(act.id, 'time_ampm', e.target.value)
                                  }
                                  className="border rounded px-2 py-1"
                                >
                                  <option value="AM">오전</option>
                                  <option value="PM">오후</option>
                                </select>
                                <select
                                  value={act.time_hour || ''}
                                  onChange={(e) =>
                                    handleActivityChange(act.id, 'time_hour', e.target.value)
                                  }
                                  className="border rounded px-2 py-1"
                                >
                                  <option value="">시</option>
                                  {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                      {i + 1}
                                    </option>
                                  ))}
                                </select>
                                <span>시</span>
                                <select
                                  value={act.time_minute || ''}
                                  onChange={(e) =>
                                    handleActivityChange(act.id, 'time_minute', e.target.value)
                                  }
                                  className="border rounded px-2 py-1"
                                >
                                  <option value="">분</option>
                                  {[0, 10, 20, 30, 40, 50].map((m) => (
                                    <option key={m} value={String(m).padStart(2, '0')}>
                                      {String(m).padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                                <span>분</span>
                                <Input
                                  type="text"
                                  placeholder="새 장소 입력"
                                  value={act.location || ''}
                                  onChange={(e) =>
                                    handleActivityChange(act.id, 'location', e.target.value)
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (window.confirm('정말로 이 활동을 삭제하시겠습니까?')) {
                                      handleDeleteActivity(act.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  삭제
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* 오른쪽: 구글지도 공간 */}
      <div className="w-1/2 flex flex-col bg-white h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5/6 h-5/6 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={mapZoom}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                onZoomChanged={() => {
                  if (mapRef.current) {
                    setMapZoom(mapRef.current.getZoom() || 10);
                  }
                }}
              >
                <Marker position={mapCenter} />
                {activities
                  .filter((a) => a.lat && a.lng)
                  .map((a, i) => (
                    <Marker key={i} position={{ lat: a.lat, lng: a.lng }} />
                  ))}
              </GoogleMap>
            ) : (
              <span className="text-gray-400">지도를 불러오는 중...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
