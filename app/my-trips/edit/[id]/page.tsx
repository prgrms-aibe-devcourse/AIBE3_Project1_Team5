'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { v4 as uuidv4 } from 'uuid';
import {
  MapPin,
  CalendarDays,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Route,
  EyeOff,
  Eraser,
  Clock,
  Map,
  PlaneTakeoff,
} from 'lucide-react';

const GOOGLE_MAP_LIBRARIES = ['places'];

const DEFAULT_CENTER = { lat: 33.450701, lng: 126.570667 }; // 제주도 중심

function getDateRange(start: string, end: string) {
  const result = [];
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

// fetchLatLng 함수 (외부 API 호출)
async function fetchLatLng(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API Key is not set.');
    return null;
  }
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
    console.warn(`Could not find coordinates for address: ${address}`, data);
    return null;
  } catch (e) {
    console.error('Error fetching coordinates:', e);
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
  const [selectedDayForRoute, setSelectedDayForRoute] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<{
    [date: string]: Array<{ id: string; lat: number; lng: number; label: string }>;
  }>({});
  const [mapKey, setMapKey] = useState(0); // GoogleMap 강제 리렌더용
  const [pageLoading, setPageLoading] = useState(true); // 페이지 전체 로딩 상태

  const mapRef = useRef<any | null>(null);
  const activitiesRef = useRef(activities); // 활동 상태의 최신 값을 참조하기 위함

  // 구글맵 로딩
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: GOOGLE_MAP_LIBRARIES as unknown as any[],
    language: 'ko', // 한글로 표시
  });

  // 여행 정보 및 활동 fetch
  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true);
      try {
        // 여행 정보 fetch
        const { data: trip, error: tripError } = await supabase
          .from('travel_schedule')
          .select('*')
          .eq('id', tripId)
          .single();

        if (tripError) throw tripError;
        setTripData(trip);

        // 활동 fetch
        const { data: acts, error: activitiesError } = await supabase
          .from('travel_activities')
          .select(
            'id, travel_id, date, time_ampm, time_hour, time_minute, location, created_at, updated_at'
          )
          .eq('travel_id', tripId)
          .order('date', { ascending: true }) // 날짜 순으로 정렬
          .order('time_hour', { ascending: true }); // 시간 순으로 정렬

        if (activitiesError) throw activitiesError;
        setActivities(acts || []);

        // 목적지 중심으로 지도 이동
        if (trip?.destination) {
          const coords = await fetchLatLng(trip.destination);
          if (coords) setMapCenter(coords);
        }
      } catch (error: any) {
        console.error('Failed to fetch trip data:', error.message);
        // 에러 처리 UI 추가 가능
      } finally {
        setPageLoading(false);
      }
    };
    if (tripId) {
      fetchData();
    }
  }, [tripId]);

  // 날짜 목록
  const days = useMemo(() => {
    if (!tripData?.start_date || !tripData?.end_date) return [];
    return getDateRange(tripData.start_date, tripData.end_date);
  }, [tripData?.start_date, tripData?.end_date]);

  // 선택된 날짜의 마커들
  const selectedDayMarkers = useMemo(() => {
    if (!selectedDayForRoute) return [];
    return mapMarkers[selectedDayForRoute] || [];
  }, [selectedDayForRoute, mapMarkers]);

  // 경로 그리기 함수
  const handleDrawRoute = (date: string) => {
    setSelectedDayForRoute(date);

    // 해당 날짜의 활동 위치를 기반으로 마커 생성 및 지도 중앙 이동
    const dayActivities = activities.filter((a) => a.date === date && a.location);
    const newMarkers: Array<{ id: string; lat: number; lng: number; label: string }> = [];
    const fetchAndSetMarkers = async () => {
      for (const act of dayActivities) {
        const coords = await fetchLatLng(act.location);
        if (coords) {
          newMarkers.push({
            id: act.id, // 활동 ID를 마커 ID로 사용
            lat: coords.lat,
            lng: coords.lng,
            label: act.location, // 활동 장소를 라벨로 사용
          });
        }
      }
      setMapMarkers((prev) => ({
        ...prev,
        [date]: newMarkers,
      }));

      if (newMarkers.length > 0) {
        // 모든 마커를 포함하는 경계 계산
        const bounds = new window.google.maps.LatLngBounds();
        newMarkers.forEach((marker) =>
          bounds.extend(new window.google.maps.LatLng(marker.lat, marker.lng))
        );
        if (mapRef.current) {
          mapRef.current.fitBounds(bounds);
        }
      } else if (tripData?.destination) {
        // 활동 마커가 없으면 목적지 중심으로
        const coords = await fetchLatLng(tripData.destination);
        if (coords) setMapCenter(coords);
      }
    };
    fetchAndSetMarkers();
  };

  // 경로 그리기 취소
  const handleClearRoute = () => {
    setSelectedDayForRoute(null);
    setMapKey((k) => k + 1); // 지도 강제 리렌더
  };

  // 지도 클릭 핸들러 (현재는 사용되지 않음, 활동 위치 기반 마커 사용)
  const handleMapClick = (event: any) => {
    // 이 기능은 현재 활동 위치 기반 마커 생성으로 대체됨
    // 필요하다면 여기에 지도 클릭으로 마커를 추가하는 로직을 구현할 수 있습니다.
  };

  // 마커 삭제 함수 (활동 삭제 시 함께 처리)
  const handleDeleteMarker = (markerId: string) => {
    if (!selectedDayForRoute) return;

    setMapMarkers((prev) => ({
      ...prev,
      [selectedDayForRoute]:
        prev[selectedDayForRoute]?.filter((marker) => marker.id !== markerId) || [],
    }));
  };

  // 마커 전체 삭제 함수
  const handleClearAllMarkers = () => {
    if (!selectedDayForRoute) return;
    if (window.confirm('현재 날짜의 모든 마커를 삭제하시겠습니까?')) {
      setMapMarkers((prev) => ({
        ...prev,
        [selectedDayForRoute]: [],
      }));
      setMapKey((k) => k + 1); // 지도 강제 리렌더
    }
  };

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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActivities((prev) => [...prev, newActivity]);
    // 즉시 저장
    await supabase.from('travel_activities').upsert([newActivity], { onConflict: 'id' });
    setHasUnsavedChanges(false); // 추가는 즉시 저장되므로 변경사항 없음
    setLastSaveTime(Date.now());
  };

  // 활동 수정
  const handleActivityChange = async (id: string, field: string, value: any) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, [field]: value, updated_at: new Date().toISOString() } : a
      )
    );
    setHasUnsavedChanges(true);

    // 즉시 저장 (디바운싱 없이)
    const updatedActivity = activitiesRef.current.find((a) => a.id === id);
    if (updatedActivity) {
      const payload = {
        ...updatedActivity,
        [field]: value,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('travel_activities').upsert([payload], { onConflict: 'id' });
      setHasUnsavedChanges(false);
      setLastSaveTime(Date.now());

      // 위치가 변경되면 지도 마커 업데이트
      if (field === 'location' && selectedDayForRoute === updatedActivity.date) {
        handleDrawRoute(updatedActivity.date);
      }
    }
  };

  // 활동 삭제
  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm('정말로 이 활동을 삭제하시겠습니까?')) {
      return;
    }
    // UI에서 먼저 삭제
    setActivities((prev) => prev.filter((a) => a.id !== id));
    // supabase에서 삭제
    const { error } = await supabase.from('travel_activities').delete().eq('id', id);
    if (error) {
      // 삭제 실패 시 UI 복원
      alert('삭제에 실패했습니다. 다시 시도해 주세요.');
      // fetchActivities로 상태 동기화 (전체 다시 불러오기)
      // 이 부분은 실제 구현에서 fetchActivities 함수를 다시 호출하도록 변경해야 합니다.
      // 현재는 fetchActivities가 useEffect 내부에만 있어 직접 호출이 어렵습니다.
      // 간단하게는 window.location.reload()를 사용하거나, fetchActivities를 useCallback으로 감싸 외부로 노출해야 합니다.
      // 여기서는 간단히 새로고침을 제안합니다.
      window.location.reload();
    } else {
      // 마커도 삭제
      setMapMarkers((prev) => {
        const newMarkers = { ...prev };
        for (const date in newMarkers) {
          newMarkers[date] = newMarkers[date].filter((marker) => marker.id !== id);
        }
        return newMarkers;
      });
    }
  };

  // activities 상태가 변경될 때마다 activitiesRef 업데이트
  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  // 저장 상태 표시 컴포넌트
  const renderSaveStatus = () => {
    if (isSaving) {
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">저장 중...</span>
        </div>
      );
    }
    if (!hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">저장 완료</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">저장되지 않은 변경사항</span>
      </div>
    );
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <span className="ml-4 text-xl text-gray-600">여행 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center shadow-lg">
          <CardTitle className="text-2xl font-bold text-red-600 mb-4">
            여행 정보를 찾을 수 없습니다.
          </CardTitle>
          <CardDescription className="text-gray-600 mb-6">
            잘못된 접근이거나 삭제된 여행 일정일 수 있습니다.
          </CardDescription>
          <Button onClick={() => router.push('/my-trips')}>내 여행 목록으로 돌아가기</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* 왼쪽: 정보 + 타임라인 */}
      <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 bg-white shadow-lg h-screen overflow-y-auto">
        {/* 상단: 여행 요약 정보 */}
        <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-20">
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <PlaneTakeoff className="h-8 w-8 text-blue-600" />
                {tripData.title}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                {tripData.destination} 여행 계획 상세
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 text-base space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gray-500" />
                <span>
                  {tripData.start_date} ~ {tripData.end_date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span>{tripData.destination}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 하단: 타임라인 뷰 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Card className="shadow-md border-none">
            <CardHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="h-6 w-6 text-purple-600" />
                일정 타임라인
              </CardTitle>
              {renderSaveStatus()}
            </CardHeader>
            <CardContent className="pt-6">
              {days.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>여행 기간이 설정되지 않았습니다.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {days.map((d, dayIdx) => {
                    const dateStr = d.toISOString().slice(0, 10);
                    const acts = activities
                      .filter((a) => a.date === dateStr)
                      .sort((a: any, b: any) => {
                        // 시간 순으로 정렬 (AM/PM 고려)
                        const timeA =
                          (a.time_ampm === 'PM' && a.time_hour !== 12
                            ? a.time_hour + 12
                            : a.time_hour) *
                            60 +
                          a.time_minute;
                        const timeB =
                          (b.time_ampm === 'PM' && b.time_hour !== 12
                            ? b.time_hour + 12
                            : b.time_hour) *
                            60 +
                          b.time_minute;
                        return timeA - timeB;
                      });
                    const isRouteSelected = selectedDayForRoute === dateStr;
                    const dayMarkers = mapMarkers[dateStr] || [];

                    return (
                      <div
                        key={dateStr}
                        className="border border-blue-200 rounded-xl p-5 bg-blue-50 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="text-xl font-bold text-blue-800">
                              Day {dayIdx + 1} - {dateStr}
                            </div>
                            {isRouteSelected && (
                              <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                                <Map className="h-4 w-4" />
                                경로 표시 중 ({dayMarkers.length}개 마커)
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {isRouteSelected ? (
                              <>
                                <Button size="sm" variant="destructive" onClick={handleClearRoute}>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  경로 숨기기
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleClearAllMarkers}>
                                  <Eraser className="h-4 w-4 mr-2" />
                                  마커 전체 지우기
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDrawRoute(dateStr)}
                              >
                                <Route className="h-4 w-4 mr-2" />
                                경로 그려보기
                              </Button>
                            )}
                            <Button size="sm" onClick={() => handleAddActivity(dateStr)}>
                              <Plus className="h-4 w-4 mr-2" />
                              활동 추가
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {acts.length === 0 ? (
                            <div className="text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-md">
                              <p>이 날짜에 활동이 없습니다. 활동을 추가해보세요!</p>
                            </div>
                          ) : (
                            acts.map((act, idx) => (
                              <Card
                                key={act.id}
                                className="p-4 bg-white shadow-sm border border-gray-100"
                              >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <select
                                      value={act.time_ampm || ''}
                                      onChange={(e) =>
                                        handleActivityChange(act.id, 'time_ampm', e.target.value)
                                      }
                                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="AM">오전</option>
                                      <option value="PM">오후</option>
                                    </select>
                                    <select
                                      value={act.time_hour || ''}
                                      onChange={(e) =>
                                        handleActivityChange(
                                          act.id,
                                          'time_hour',
                                          Number.parseInt(e.target.value)
                                        )
                                      }
                                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">시</option>
                                      {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                          {i + 1}
                                        </option>
                                      ))}
                                    </select>
                                    <span className="text-gray-600 text-sm">시</span>
                                    <select
                                      value={act.time_minute || ''}
                                      onChange={(e) =>
                                        handleActivityChange(
                                          act.id,
                                          'time_minute',
                                          Number.parseInt(e.target.value)
                                        )
                                      }
                                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">분</option>
                                      {[0, 10, 20, 30, 40, 50].map((m) => (
                                        <option key={m} value={m}>
                                          {String(m).padStart(2, '0')}
                                        </option>
                                      ))}
                                    </select>
                                    <span className="text-gray-600 text-sm">분</span>
                                  </div>
                                  <div className="flex-1 w-full sm:w-auto">
                                    <Input
                                      type="text"
                                      placeholder="활동 장소를 자세히 입력해주세요! (예: 경복궁)"
                                      value={act.location || ''}
                                      onChange={(e) =>
                                        handleActivityChange(act.id, 'location', e.target.value)
                                      }
                                      className="w-full text-base px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteActivity(act.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))
                          )}
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
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-200 h-screen sticky top-0">
        <div className="flex-1 flex items-center justify-center relative p-6">
          <Card className="w-full h-full shadow-xl border-none overflow-hidden">
            <CardContent className="p-0 w-full h-full">
              {isLoaded ? (
                <GoogleMap
                  key={mapKey}
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
                  onClick={handleMapClick} // 지도 클릭 이벤트 (현재는 사용 안 함)
                >
                  {/* 선택된 날짜의 마커들 */}
                  {selectedDayMarkers.map((marker) => (
                    <Marker
                      key={marker.id}
                      position={{ lat: marker.lat, lng: marker.lng }}
                      label={{
                        text: marker.label,
                        color: '#333333', // 글자색을 어두운 회색으로 변경
                        fontSize: '14px', // 글자 크기 증가
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleDeleteMarker(marker.id)} // 마커 클릭 시 삭제 (선택 사항)
                    />
                  ))}
                  {/* 마커들을 연결하는 폴리라인 */}
                  {selectedDayMarkers.length > 1 && (
                    <Polyline
                      path={selectedDayMarkers.map((marker) => ({
                        lat: marker.lat,
                        lng: marker.lng,
                      }))}
                      options={{
                        strokeColor: '#4F46E5', // indigo-600
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        geodesic: true,
                      }}
                    />
                  )}
                </GoogleMap>
              ) : loadError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-red-500 text-center p-4">
                  <AlertTriangle className="h-12 w-12 mb-4" />
                  <p className="text-lg font-semibold mb-2">지도를 불러올 수 없습니다.</p>
                  <p className="text-sm">
                    Google Maps API 키를 확인하거나 네트워크 연결을 확인해주세요.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                  <Loader2 className="h-12 w-12 animate-spin mb-4" />
                  <p className="text-lg">지도를 불러오는 중...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
