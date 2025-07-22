import { useState } from 'react';

export type GoogleSearchType = 'hotels' | 'spots' | 'foods';

interface GoogleSearchState {
  showResults: boolean;
  response: any;
  results: any[];
  loading: boolean;
  loadingMore: boolean;
  nextStart: number | null;
  hasMore: boolean;
}

const initialState: Record<GoogleSearchType, GoogleSearchState> = {
  hotels: {
    showResults: false,
    response: null,
    results: [],
    loading: false,
    loadingMore: false,
    nextStart: null,
    hasMore: false,
  },
  spots: {
    showResults: false,
    response: null,
    results: [],
    loading: false,
    loadingMore: false,
    nextStart: null,
    hasMore: false,
  },
  foods: {
    showResults: false,
    response: null,
    results: [],
    loading: false,
    loadingMore: false,
    nextStart: null,
    hasMore: false,
  },
};

export function useGoogleSearch(destination: any) {
  const [googleSearchState, setGoogleSearchState] = useState(initialState);

  // 구글 검색 결과 로드 함수
  const loadGoogleResults = async (
    searchType: GoogleSearchType,
    start: number = 1,
    append: boolean = false
  ) => {
    if (!destination) return;
    let query = destination.name_kr;
    if (searchType === 'hotels') query += ' 숙소';
    if (searchType === 'spots') query += ' 관광지';
    if (searchType === 'foods') query += ' 맛집';

    setGoogleSearchState((prev) => ({
      ...prev,
      [searchType]: {
        ...prev[searchType],
        loading: true,
      },
    }));

    try {
      const res = await fetch(
        `/api/google_api_route?query=${encodeURIComponent(query)}&start=${start}`
      );
      const data = await res.json();

      setGoogleSearchState((prev) => ({
        ...prev,
        [searchType]: {
          ...prev[searchType],
          response: data,
          nextStart: data.nextStart,
          hasMore: !!data.nextStart,
          results: append
            ? [...prev[searchType].results, ...(data.results || [])]
            : data.results || [],
          loading: false,
        },
      }));
    } catch (error) {
      setGoogleSearchState((prev) => ({
        ...prev,
        [searchType]: {
          ...prev[searchType],
          loading: false,
        },
      }));
    }
  };

  // 더 많은 결과 로드
  const loadMoreResults = async (searchType: GoogleSearchType) => {
    const currentState = googleSearchState[searchType];
    if (!currentState.nextStart || currentState.loadingMore) return;

    setGoogleSearchState((prev) => ({
      ...prev,
      [searchType]: {
        ...prev[searchType],
        loadingMore: true,
      },
    }));

    await loadGoogleResults(searchType, currentState.nextStart, true);

    setGoogleSearchState((prev) => ({
      ...prev,
      [searchType]: {
        ...prev[searchType],
        loadingMore: false,
      },
    }));
  };

  // 검색 결과 show/hide
  const showResults = (searchType: GoogleSearchType) => {
    setGoogleSearchState((prev) => ({
      ...prev,
      [searchType]: {
        ...prev[searchType],
        showResults: true,
      },
    }));
  };
  const hideResults = (searchType: GoogleSearchType) => {
    setGoogleSearchState((prev) => ({
      ...prev,
      [searchType]: {
        ...initialState[searchType],
      },
    }));
  };

  return {
    googleSearchState,
    loadGoogleResults,
    loadMoreResults,
    showResults,
    hideResults,
  };
}
