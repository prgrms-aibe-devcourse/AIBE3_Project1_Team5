'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError('');
      // 로그인 유저 정보 가져오기
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(user);
      // trips 불러오기
      const { data, error: tripsError } = await supabase
        .from('trips')
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

  if (loading) {
    return <div className="max-w-xl mx-auto p-4">불러오는 중...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-4 text-center text-red-500">로그인이 필요합니다.</div>
    );
  }

  if (error) {
    return <div className="max-w-xl mx-auto p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">내 여행 일정</h1>
      {trips.length === 0 ? (
        <div className="text-gray-500">등록된 일정이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip.id} className="border rounded p-4 shadow-sm bg-white">
              <div className="text-lg font-semibold mb-1">{trip.title}</div>
              <div className="text-sm text-gray-600 mb-1">
                {trip.start_date} ~ {trip.end_date}
              </div>
              <div className="text-sm">목적지: {trip.destination}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
