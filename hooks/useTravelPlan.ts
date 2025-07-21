import { useState, useCallback } from 'react';
import { TravelParameters, TravelPlan, ParameterCollectionStatus } from '@/lib/openai';
import { travelPlanService } from '@/lib/travelPlanService';

export type TravelPlanState = 'idle' | 'extracting' | 'collecting' | 'generating' | 'complete' | 'error';

export function useTravelPlan() {
  const [state, setState] = useState<TravelPlanState>('idle');
  const [parameters, setParameters] = useState<TravelParameters>({});
  const [missingParams, setMissingParams] = useState<string[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState<string | null>(null);




  // 여행 일정 생성
  const generateTravelPlan = useCallback(async (params: TravelParameters): Promise<TravelPlan> => {
    try {
      setState('generating');
      setError(null);

      const response = await fetch('/api/chat/travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'generatePlan',
          params 
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result = await response.json();
      setCurrentPlan(result.plan);
      setState('complete');

      return result.plan;
    } catch (error) {
      console.error('Error generating travel plan:', error);
      setState('error');
      setError('여행 일정 생성 중 오류가 발생했습니다.');
      throw error;
    }
  }, []);


  // 상태 리셋
  const resetState = useCallback(() => {
    setState('idle');
    setParameters({});
    setMissingParams([]);
    setCurrentPlan(null);
    setError(null);
  }, []);

  return {
    state,
    parameters,
    missingParams,
    currentPlan,
    error,
    generateTravelPlan,
    resetState
  };
}