export interface Destination {
  id: string;
  name_kr: string;
  name_en?: string;
  country: string;
  region: string;
  description?: string;
  image_url?: string;
  cost_flight?: number;
  tips?: string;
  best_time?: string;
  avg_score?: number; // 리뷰 평균 점수 (0-5)
  review_count?: number;  // 리뷰 개수
}

export interface FilterState {
  searchQuery: string;
  selectedRegion: string;
  selectedBudget: string;
  showPopularOnly: boolean;
}
//홈화면용
export interface PopularDestination extends Omit<Destination, 'rating_num' | 'view_count'> { // rating_num, view_count는 필요없으면 omit
  avg_score: number;
  review_count: number;
}
export interface DetailedDestination extends Destination {
  avg_score?: number; // 목록에서는 이 값이 있을 수도 있고 없을 수도 있음
  review_count?: number; // 목록에서는 이 값이 있을 수도 있고 없을 수도 있음
}