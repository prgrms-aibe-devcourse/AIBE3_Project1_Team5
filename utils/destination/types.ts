export interface Destination {
  id: string;
  name_kr: string;
  name_en?: string;
  country: string;
  region: string;
  description?: string;
  image_url?: string;
  rating_num?: number; // 기존 평점 (별개로 유지 가능)
  view_count?: number;
  cost_flight?: number;
  cost_hotel_per_night?: number;
  cost_meal_per_day?: number;
  cost_sightseeing_per_day?: number;
  tips?: string;
  best_time?: string;
  weather_spring?: string;
  weather_summer?: string;
  weather_autumn?: string;
  weather_winter?: string;
  avg_score?: number; // 리뷰 평균 점수 (0-5)
  review_count?: number;  // 리뷰 개수
}

export interface FilterState {
  searchQuery: string;
  selectedRegion: string;
  selectedBudget: string;
  showPopularOnly: boolean;
}