'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaneTakeoff, Save, Loader2, CalendarDays, MapPin, AlertCircle } from 'lucide-react'; // AlertCircle 아이콘 추가
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function CreateTripPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 유효성 검사
    if (!title || title.length > 100) {
      setError('여행 제목을 1~100자로 입력하세요.');
      setLoading(false);
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      setError('출발/도착 날짜를 올바르게 입력하세요.');
      setLoading(false);
      return;
    }
    if (!destination) {
      setError('목적지를 입력하세요.');
      setLoading(false);
      return;
    }

    // 로그인 유저 정보 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    // DB 저장
    const { error: insertError } = await supabase.from('travel_schedule').insert([
      {
        id: uuidv4(),
        user_id: user.id,
        title,
        start_date: startDate,
        end_date: endDate,
        destination,
        // created_at, version은 DB에서 자동 처리
      },
    ]);

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push('/my-trips'); // 성공 시 이동할 페이지
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-xl border-none animate-fade-in-up hover:shadow-2xl transition-shadow">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
            <PlaneTakeoff className="h-10 w-10 text-blue-600" />
            새로운 여행 일정 만들기
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-3">
            당신의 다음 모험을 위한 완벽한 계획을 시작하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <Label htmlFor="title" className="text-base font-medium text-gray-700 mb-2 block">
                여행 제목
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="예: 제주도 힐링 여행, 유럽 배낭여행"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="startDate"
                  className="text-base font-medium text-gray-700 mb-2 block"
                >
                  <CalendarDays className="inline-block h-5 w-5 mr-2 text-gray-500" />
                  출발 날짜
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-base font-medium text-gray-700 mb-2 block">
                  <CalendarDays className="inline-block h-5 w-5 mr-2 text-gray-500" />
                  도착 날짜
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="destination"
                className="text-base font-medium text-gray-700 mb-2 block"
              >
                <MapPin className="inline-block h-5 w-5 mr-2 text-gray-500" />
                목적지
              </Label>
              <Input
                id="destination"
                type="text"
                placeholder="예: 서울, 제주도, 파리"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="h-12 text-base px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  일정 저장
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
