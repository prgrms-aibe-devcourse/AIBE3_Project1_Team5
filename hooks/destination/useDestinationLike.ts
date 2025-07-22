import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useDestinationLike(travelId: string | number | undefined) {
  const [isLiked, setIsLiked] = useState(false);

  // 찜 상태 확인
  async function checkUserLikeStatus(travelId: string | number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsLiked(false);
      return;
    }
    const { data, error } = await supabase
      .from('travel_like')
      .select('*')
      .eq('user_id', user.id)
      .eq('travel_id', travelId)
      .maybeSingle();
    if (error) {
      setIsLiked(false);
      return;
    }
    setIsLiked(!!data);
  }

  // 찜 추가
  async function addLike(travelId: string | number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    const { error } = await supabase
      .from('travel_like')
      .insert({ user_id: user.id, travel_id: travelId });
    if (error) throw error;
  }

  // 찜 제거
  async function removeLike(travelId: string | number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');
    const { error } = await supabase
      .from('travel_like')
      .delete()
      .eq('user_id', user.id)
      .eq('travel_id', travelId);
    if (error) throw error;
  }

  // 찜 토글
  const toggleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인 후 이용해주세요');
      return;
    }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    try {
      if (newLikedState) {
        await addLike(travelId!);
      } else {
        await removeLike(travelId!);
      }
    } catch (error) {
      setIsLiked(!newLikedState); // 실패 시 원상복구
      // 필요시 에러 처리
    }
  };

  useEffect(() => {
    if (travelId) checkUserLikeStatus(travelId);
    // eslint-disable-next-line
  }, [travelId]);

  return { isLiked, toggleLike, checkUserLikeStatus };
}
