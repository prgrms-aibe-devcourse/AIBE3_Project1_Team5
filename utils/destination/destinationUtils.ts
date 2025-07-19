import { Destination } from '@/utils/destination/types'; // 타입 정의 임포트
import { BUDGET_THRESHOLDS } from '@/utils/destination/constants'; // 상수 임포트

export const calculateTotalCost = (destination: Destination): number => {
  return (
    (destination.cost_flight || 0) +
    (destination.cost_hotel_per_night || 0) +
    (destination.cost_meal_per_day || 0) +
    (destination.cost_sightseeing_per_day || 0)
  );
};

export const getBudgetCategory = (totalCost: number): string => {
  if (totalCost < BUDGET_THRESHOLDS.LOW) return '저예산';
  if (totalCost > BUDGET_THRESHOLDS.HIGH) return '고예산';
  return '중간예산';
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString() + '원';
};

export const POPULAR_THRESHOLD = 8; // 여기에도 필요하다면 상수 재정의