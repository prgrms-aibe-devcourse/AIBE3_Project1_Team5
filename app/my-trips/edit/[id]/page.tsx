'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function EditTripPage() {
  const params = useParams();
  const tripId = params.id;

  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('travel_schedule')
        .select('*')
        .eq('id', tripId)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setTripData(data);
      }
      setLoading(false);
    };
    fetchTrip();
  }, [tripId]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 에러 발생 시 전체 페이지에 에러 메시지 카드 표시 */}
      {error ? (
        <div className="w-full flex items-center justify-center">
          <div className="max-w-md w-full mt-32">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-red-600">오류 발생</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-red-500 text-center mb-4">{error}</div>
                <div className="flex justify-center">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => window.location.reload()}
                  >
                    다시 시도
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* 왼쪽: 정보 + 타임라인 */}
          <div className="w-1/2 flex flex-col border-r h-screen overflow-y-auto">
            {/* 상단: 여행 요약 정보 */}
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">여행 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div>로딩 중...</div>
                  ) : tripData ? (
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold">제목:</span> {tripData.title}
                      </div>
                      <div>
                        <span className="font-semibold">출발일:</span> {tripData.start_date}
                      </div>
                      <div>
                        <span className="font-semibold">도착일:</span> {tripData.end_date}
                      </div>
                      <div>
                        <span className="font-semibold">목적지:</span> {tripData.destination}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
            {/* 하단: 타임라인 뷰 */}
            <div className="flex-1 p-6 pt-0 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">타임라인 뷰</CardTitle>
                </CardHeader>
                <CardContent>
                  {tripData && tripData.timeline && tripData.timeline.length > 0 ? (
                    <div className="space-y-4">
                      {tripData.timeline.map((item: any, idx: number) => (
                        <div key={idx} className="border-b pb-2 mb-2">
                          <div className="font-semibold">{item.date || `Day ${idx + 1}`}</div>
                          <ul className="list-disc ml-5 text-sm">
                            {item.activities?.map((act: any, i: number) => (
                              <li key={i}>
                                {act.time} - {act.location} {act.notes && `(${act.notes})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">타임라인 데이터가 없습니다.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          {/* 오른쪽: 구글지도 공간 */}
          <div className="w-1/2 flex items-center justify-center bg-white h-screen">
            <div className="w-5/6 h-5/6 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center">
              <span className="text-2xl text-blue-400 mb-2">구글 지도 영역</span>
              <span className="text-gray-400">(여기에 지도 컴포넌트가 들어갈 예정입니다)</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
