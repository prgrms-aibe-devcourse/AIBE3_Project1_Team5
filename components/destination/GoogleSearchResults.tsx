import React from 'react';
import { ChevronUp } from 'lucide-react';
import { useGoogleSearch, GoogleSearchType } from '@/hooks/destination/useGoogleSearch';

interface GoogleSearchResultsProps {
  destination: any;
  searchType: GoogleSearchType;
}

const MoreButton = ({
  onClick,
  loading = false,
  text = '더보기',
  className = 'mt-8',
}: {
  onClick: () => void;
  loading?: boolean;
  text?: string;
  className?: string;
}) => (
  <div className={`text-center ${className}`}>
    <button
      className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-blue-600 bg-white border-2 border-blue-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={loading}
    >
      <span className="mr-2">{loading ? '로딩 중...' : text}</span>
      {!loading && (
        <svg
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  </div>
);

const GoogleSearchResults: React.FC<GoogleSearchResultsProps> = ({ destination, searchType }) => {
  const { googleSearchState, loadGoogleResults, loadMoreResults, showResults, hideResults } =
    useGoogleSearch(destination);

  const currentState = googleSearchState[searchType];

  const handleShowResults = async () => {
    showResults(searchType);
    await loadGoogleResults(searchType, 1, false);
  };

  const handleHideResults = () => {
    hideResults(searchType);
  };

  const handleLoadMore = async () => {
    await loadMoreResults(searchType);
  };

  return (
    <>
      {/* 더보기 버튼 */}
      {!currentState.showResults && <MoreButton onClick={handleShowResults} />}

      {/* 가공된 구글 검색 결과 */}
      {currentState.showResults && (
        <div className="mt-6">
          <div className="flex items-center justify-center mb-4">
            <button
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition"
              onClick={handleHideResults}
            >
              <ChevronUp className="h-4 w-4" />
              <span>접기</span>
            </button>
          </div>
          {currentState.loading ? (
            <div className="text-center py-4">검색 중...</div>
          ) : currentState.results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentState.results.map((result: any) => (
                  <div
                    key={result.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white rounded-lg"
                    onClick={() => window.open(result.link, '_blank', 'noopener,noreferrer')}
                  >
                    <div className="relative h-48">
                      <img
                        src={result.image || result.thumbnail || '/placeholder.jpg'}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{result.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{result.snippet}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 더 많은 결과 로드 버튼 */}
              {currentState.hasMore && (
                <MoreButton
                  onClick={handleLoadMore}
                  loading={currentState.loadingMore}
                  text="더 많은 결과 보기"
                  className="mt-6"
                />
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">검색 결과가 없습니다.</div>
          )}
        </div>
      )}
    </>
  );
};

export default GoogleSearchResults;
