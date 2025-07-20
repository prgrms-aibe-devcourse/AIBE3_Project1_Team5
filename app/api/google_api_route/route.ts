import { NextResponse } from 'next/server';
import axios from 'axios';

const google_api_key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const google_ces_id = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

// 구글 검색 결과 가공 함수
const processGoogleResults = (googleResponse: any) => {
  if (!googleResponse || !googleResponse.items) {
    return [];
  }

  return googleResponse.items.map((item: any) => ({
    id: item.cacheId || item.link,
    title: item.title || '',
    link: item.link || '',
    snippet: item.snippet || '',
    displayLink: item.displayLink || '',
    thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || null,
    image: item.pagemap?.cse_image?.[0]?.src || null,
  }));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const start = searchParams.get('start') || '1'; // 페이지네이션 시작 위치

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${google_api_key}&cx=${google_ces_id}&q=${query}&start=${start}`;

  try {
    const response = await axios.get(url);

    // 결과 가공
    const processedResults = processGoogleResults(response.data);

    return NextResponse.json({
      success: true,
      results: processedResults,
      totalResults: response.data.searchInformation?.totalResults || 0,
      searchTime: response.data.searchInformation?.searchTime || 0,
      // 페이지네이션 정보
      nextStart: response.data.queries?.nextPage?.[0]?.startIndex || null,
      currentStart: parseInt(start),
      // 디버그용: 가공 전 원본 Google API 응답
      originalResponse: response.data,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
