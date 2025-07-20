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
        .from('travels_with_review_summary').select('*');

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