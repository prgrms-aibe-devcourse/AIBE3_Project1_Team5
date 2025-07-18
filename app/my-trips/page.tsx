'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  CalendarIcon,
  Plus,
  PlaneTakeoff,
  Frown,
  Info,
  Edit2,
  Share2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // Skeleton 컴포넌트 추가
import { useRouter } from 'next/navigation'; // useRouter 추가
import { format } from 'date-fns';

interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  destination: string;
}

export default function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trip>>({});

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError('');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(user);
      const { data, error: tripsError } = await supabase
        .from('travel_schedule')
        .select('id, title, start_date, end_date, destination')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });
      if (tripsError) {
        setError(tripsError.message);
      } else {
        setTrips(data || []);
      }
      setLoading(false);
    };
    fetchTrips();
  }, []);

  // 일정 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('travel_schedule').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      setTrips((prev) => prev.filter((trip) => trip.id !== id));
    }
  };

  // 일정 편집(이동) 함수는 인라인 편집으로 대체
  // const handleEdit = (id: string) => { router.push(`/my-trips/edit/${id}`); } // 삭제

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 text-center text-blue-700 font-semibold text-base">
          일정을 클릭해 상세 내용을 직접 계획해 보세요!
        </div>
        <Card className="mb-8 shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <PlaneTakeoff className="h-7 w-7 text-blue-600" />내 여행 일정
              </CardTitle>
              <CardDescription className="mt-1 text-gray-600">
                계획한 여행들을 한눈에 확인하고 관리하세요.
              </CardDescription>
            </div>
            <Link href="/planner/create" passHref>
              <Button className="flex items-center bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                <Plus className="h-5 w-5 mr-2" /> 새 여행 계획
              </Button>
            </Link>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="flex items-center p-5 shadow-md">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="w-36 h-24 ml-6 rounded-lg" />
              </Card>
            ))}
          </div>
        ) : !user ? (
          <Card className="text-center py-12 shadow-md">
            <CardContent className="flex flex-col items-center justify-center">
              <Info className="h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인이 필요합니다.</h2>
              <p className="text-gray-600 mb-4">여행 일정을 확인하려면 먼저 로그인해주세요.</p>
              <Link href="/login" passHref>
                <Button className="bg-blue-600 hover:bg-blue-700">로그인하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="text-center py-12 shadow-md">
            <CardContent className="flex flex-col items-center justify-center">
              <Frown className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">오류 발생</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                다시 시도
              </Button>
            </CardContent>
          </Card>
        ) : trips.length === 0 ? (
          <Card className="text-center py-12 shadow-md">
            <CardContent className="flex flex-col items-center justify-center">
              <MapPin className="h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                아직 등록된 여행 일정이 없습니다.
              </h2>
              <p className="text-gray-600 mb-4">새로운 여행 계획을 세워보세요!</p>
              <Link href="/planner/create" passHref>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> 첫 여행 계획하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="flex flex-col sm:flex-row items-start sm:items-center bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-5 cursor-pointer"
                onClick={
                  editingId === trip.id ? undefined : () => router.push(`/my-trips/edit/${trip.id}`)
                }
              >
                <div className="flex-1 mb-4 sm:mb-0">
                  {editingId === trip.id ? (
                    <>
                      <input
                        className="border rounded px-2 py-1 w-full mb-2"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="제목"
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={editForm.start_date || ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, start_date: e.target.value }))
                          }
                        />
                        ~
                        <input
                          type="date"
                          className="border rounded px-2 py-1"
                          value={editForm.end_date || ''}
                          onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                        />
                      </div>
                      <input
                        className="border rounded px-2 py-1 w-full mb-2"
                        value={editForm.destination || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, destination: e.target.value }))
                        }
                        placeholder="목적지"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={async () => {
                            const { error } = await supabase
                              .from('travel_schedule')
                              .update({
                                title: editForm.title,
                                start_date: editForm.start_date,
                                end_date: editForm.end_date,
                                destination: editForm.destination,
                              })
                              .eq('id', trip.id);
                            if (!error) {
                              setTrips((trips) =>
                                trips.map((t) => (t.id === trip.id ? { ...t, ...editForm } : t))
                              );
                              setEditingId(null);
                            } else {
                              alert('저장 실패: ' + error.message);
                            }
                          }}
                        >
                          저장
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          취소
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{trip.title}</h2>
                      <div className="flex items-center text-gray-600 text-base mb-1">
                        <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
                        <span>
                          {trip.start_date} ~ {trip.end_date}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 text-base">
                        <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(trip.id);
                            setEditForm(trip);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-1" /> 편집
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(trip.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> 삭제
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                {editingId === trip.id ? null : <TripImage destination={trip.destination} />}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TripImage({ destination }: { destination: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      setImgLoading(true);
      try {
        const res = await fetch(`/api/unsplash-image?query=${encodeURIComponent(destination)}`);
        if (!res.ok) {
          throw new Error('Failed to fetch image');
        }
        const data = await res.json();
        setImgUrl(data.image);
      } catch (err) {
        console.error('Error fetching image:', err);
        setImgUrl(null); // 이미지 로드 실패 시 null로 설정
      } finally {
        setImgLoading(false);
      }
    };
    fetchImage();
  }, [destination]);

  return (
    <div className="w-full sm:w-48 h-32 flex-shrink-0 sm:ml-6 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
      {imgLoading ? (
        <Skeleton className="w-full h-full" />
      ) : imgUrl ? (
        <img
          src={imgUrl || '/placeholder.svg'}
          alt={destination}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm p-2 text-center">
          <Frown className="h-6 w-6 mb-1" />
          이미지 없음
        </div>
      )}
    </div>
  );
}
