'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaneTakeoff, Save, Loader2 } from 'lucide-react'; // Lucide icons 추가
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase'; // Assuming this path is correct and configured
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is installed

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <PlaneTakeoff className="h-8 w-8 text-blue-600" />
              새로운 여행 일정 만들기
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              당신의 다음 모험을 위한 완벽한 계획을 시작하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">여행 제목</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="예: 제주도 힐링 여행, 유럽 배낭여행"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">출발 날짜</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">도착 날짜</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="destination">목적지</Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="예: 서울, 제주도, 파리"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

              <Button type="submit" className="w-full py-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    일정 저장
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
