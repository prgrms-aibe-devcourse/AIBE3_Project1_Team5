'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Calendar as CalendarIcon, Plus } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">내 여행 일정</h1>
          <Link href="/planner/create">
            <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition">
              <Plus className="h-5 w-5 mr-2" /> 새 여행
            </button>
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-12">불러오는 중...</div>
        ) : !user ? (
          <div className="text-center text-red-500 py-12">로그인이 필요합니다.</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : trips.length === 0 ? (
          <div className="text-center text-gray-400 py-12">등록된 일정이 없습니다.</div>
        ) : (
          <div className="grid gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center bg-white rounded-xl shadow-md hover:shadow-lg transition p-5"
              >
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-xl font-semibold text-gray-900 mr-2">{trip.title}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <CalendarIcon className="h-4 w-4 mr-1 text-blue-500" />
                    {trip.start_date} ~ {trip.end_date}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                    {trip.destination}
                  </div>
                </div>
                <TripImage destination={trip.destination} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TripImage({ destination }: { destination: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      const res = await fetch(`/api/unsplash-image?query=${encodeURIComponent(destination)}`);
      const data = await res.json();
      setImgUrl(data.image);
    };
    fetchImage();
  }, [destination]);

  return (
    <div className="w-36 h-24 flex-shrink-0 ml-6 rounded-lg overflow-hidden border bg-gray-100 shadow">
      {imgUrl ? (
        <img src={imgUrl} alt={destination} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          이미지 없음
        </div>
      )}
    </div>
  );
}
