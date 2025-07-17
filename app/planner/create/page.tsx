'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    const { error: insertError } = await supabase.from('trips').insert([
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
      router.push('/my-trips');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">여행 일정 만들기</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="여행 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          maxLength={100}
          required
        />
        <div className="flex space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded w-1/2"
            required
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded w-1/2"
            required
          />
        </div>
        <input
          type="text"
          placeholder="목적지(도시명)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? '저장 중...' : '일정 저장'}
        </button>
      </form>
    </div>
  );
}
