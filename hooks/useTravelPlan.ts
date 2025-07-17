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

  // OpenAI를 통한 여행 의도 분류
  const isTravelRequest = useCallback(async (message: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/chat/travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message, 
          action: 'classifyIntent' 
        }),
      });

      if (!response.ok) {
        console.warn('Intent classification API failed');
        return false; // API 실패시 일반 대화로 처리
      }

      const result = await response.json();
      return result.isTravelRequest || false;
    } catch (error) {
      console.error('Error classifying intent:', error);
      // 에러 발생 시 false 반환 (일반 대화로 처리)
      return false;
    }
  }, []);

  // 파라미터 추출
  const extractParameters = useCallback(async (message: string): Promise<ParameterCollectionStatus> => {
    try {
      setState('extracting');
      setError(null);

      const response = await fetch('/api/chat/travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message, 
          action: 'extractParams' 
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result: ParameterCollectionStatus = await response.json();
      
      setParameters(prev => ({ ...prev, ...result.collectedParams }));
      setMissingParams(result.missingParams);
      
      if (result.isComplete) {
        setState('complete');
      } else {
        setState('collecting');
      }

      return result;
    } catch (error) {
      console.error('Error extracting parameters:', error);
      setState('error');
      setError('여행 정보 추출 중 오류가 발생했습니다.');
      throw error;
    }
  }, []);

  // 질문 생성
  const generateQuestion = useCallback(async (missingParam: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat/travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: '', // 빈 메시지 추가 (API Route가 message를 요구함)
          action: 'generateQuestion',
          missingParam 
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result = await response.json();
      return result.question;
    } catch (error) {
      console.error('Error generating question:', error);
      return '더 자세한 정보를 알려주시겠어요?';
    }
  }, []);

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

  // 파라미터 업데이트
  const updateParameter = useCallback((key: keyof TravelParameters, value: any) => {
    setParameters(prev => {
      const updated = { ...prev, [key]: value };
      
      // 필수 파라미터 체크 (모든 7개 파라미터)
      const requiredParams = ['destination', 'duration', 'peopleCount', 'budget', 'travelStyle', 'transportation', 'accommodation'];
      const newMissingParams = requiredParams.filter(param => !updated[param as keyof TravelParameters]);
      
      setMissingParams(newMissingParams);
      
      if (newMissingParams.length === 0) {
        setState('complete');
      }
      
      return updated;
    });
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
    isTravelRequest,
    extractParameters,
    generateQuestion,
    generateTravelPlan,
    updateParameter,
    resetState
  };
}