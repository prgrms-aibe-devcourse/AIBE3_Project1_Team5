import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Destination } from '@/utils/destination/types'; 

export const useDestinationsData = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('travels')
        .select(
          `
          id, name_kr, name_en, country, region, description, image_url, rating_num, view_count,
          cost_flight, cost_hotel_per_night, cost_meal_per_day, cost_sightseeing_per_day,
          tips, best_time, weather_spring, weather_summer, weather_autumn, weather_winter
        `
        )
        .order('view_count', { ascending: false });

      if (supabaseError) {
        console.error('Supabase 에러:', supabaseError);
        throw supabaseError;
      }

      console.log('✅ 데이터 로드 성공:', data?.length || 0, '개');
      setDestinations(data || []);
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { destinations, loading, error, fetchDestinations };
};