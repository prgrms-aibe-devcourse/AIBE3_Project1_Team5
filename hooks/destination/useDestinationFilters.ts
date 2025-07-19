import { useState, useMemo, useCallback } from 'react';
import { calculateTotalCost, getBudgetCategory, POPULAR_THRESHOLD } from '@/utils/destination/destinationUtils'; // 유틸리티 함수 임포트
import { Destination, FilterState } from '@/utils/destination/types'; 

export const useDestinationFilters = (destinations: Destination[]) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedRegion: '전체',
    selectedBudget: '전체',
    showPopularOnly: false,
  });

  const handleFilterChange = useCallback((key: keyof FilterState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedRegion: '전체',
      selectedBudget: '전체',
      showPopularOnly: false,
    });
  }, []);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      const matchesSearch =
        !filters.searchQuery ||
        destination.name_kr?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        destination.name_en?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        destination.country?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        destination.description?.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesRegion =
        filters.selectedRegion === '전체' || destination.region === filters.selectedRegion;

      const totalCost = calculateTotalCost(destination);
      const budgetCategory = getBudgetCategory(totalCost);
      const matchesBudget =
        filters.selectedBudget === '전체' || budgetCategory === filters.selectedBudget;

      const matchesPopular =
        !filters.showPopularOnly || (destination.view_count || 0) > POPULAR_THRESHOLD;

      return matchesSearch && matchesRegion && matchesBudget && matchesPopular;
    });
  }, [destinations, filters]);

  return { filters, handleFilterChange, resetFilters, filteredDestinations };
};