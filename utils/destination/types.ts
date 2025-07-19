export interface Destination {
  id: string;
  name_kr: string;
  name_en?: string;
  country: string;
  region: string;
  description?: string;
  image_url?: string;
  rating_num?: number;
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
}

export interface FilterState {
  searchQuery: string;
  selectedRegion: string;
  selectedBudget: string;
  showPopularOnly: boolean;
}