'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, ThumbsUp, MessageCircle, Search, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Review = {
  id: string;
  content: string;
  score: number;
  created_at: string;
  review_img: { img_url: string }[];
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('review').select(`
        id,
        content,
        score,
        created_at,
        review_img(
          img_url
        )
      `);
      if (error) {
        alert('리뷰 데이터를 불러오지 못했습니다.');
      } else {
        setReviews(data || []);
        console.log(data);
      }
      setIsLoading(false);
    };
    fetchReviews();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('전체');
  const [sortBy, setSortBy] = useState('latest');
  const [showWriteReview, setShowWriteReview] = useState(false);

  const [travel, setTravel] = useState('');
  const [content, setContent] = useState('');
  const [score, setScore] = useState(5.0);
  const [images, setImages] = useState<File[]>([]);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // const filteredReviews = reviews.filter((review) => {
  //   const matchesSearch = review.content.toLowerCase().includes(searchQuery.toLowerCase());
  //   const matchesDestination =
  //     selectedDestination === '전체' || review.travels?.name_kr === selectedDestination;
  //   return matchesSearch && matchesDestination;
  // });

  // 이미지 input 입력
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 허용 확장자
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    // 5MB 제한 (5 * 1024 * 1024)
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('png, jpg, webp 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > maxSize) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('파일 크기는 5MB를 넘을 수 없습니다.');
      return;
    }

    // 파일 업로드 로직 실행행
    setImages([file]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // console.log('submit');

    try {
      // 1. 후기 등록
      const { data: review, error: reviewError } = await supabase
        .from('review')
        .insert({
          content,
          score,
          user_id: user?.id,
          travel_id: '56c0d4b5-49b6-45e0-beda-a1db53b752bd', //임의의 UUID
        })
        .select()
        .single();

      if (reviewError) {
        alert(reviewError.message);
        return;
      }

      // 2. 이미지가 있으면 storage에 업로드 후 review_img 테이블에 저장
      if (images.length > 0) {
        const file = images[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `review_${review.id}_${Date.now()}.${fileExt}`;

        // Storage 업로드
        const { data: storageData, error: storageError } = await supabase.storage
          .from('reviewimg')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          alert('이미지 업로드 실패: ' + storageError.message);
          return;
        }

        // Public URL 가져오기
        const { data: publicUrlData } = supabase.storage.from('reviewimg').getPublicUrl(filePath);

        const imgUrl = publicUrlData?.publicUrl;

        // img 테이블에 저장
        const { error: imgError } = await supabase.from('review_img').insert({
          img_url: imgUrl,
          file_path: filePath,
          order: 1,
          review_id: review.id,
        });

        if (imgError) {
          alert('이미지 DB 저장 실패: ' + imgError.message);
          return;
        }
      }

      alert('후기 등록 성공');
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  // 후기 관련 처리 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">처리 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">여행 후기</h1>
            <p className="text-gray-600">실제 여행자들의 생생한 후기를 확인해보세요</p>
          </div>
          <Button
            onClick={() => setShowWriteReview(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            후기 작성하기
          </Button>
        </div>

        {/* 검색 Filters (일단 유지하지만 구현 기능에 따라 삭제 예정) */}
        {/* <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="후기 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="목적지 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="제주도">제주도</SelectItem>
                  <SelectItem value="부산">부산</SelectItem>
                  <SelectItem value="경주">경주</SelectItem>
                  <SelectItem value="서울">서울</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="rating">평점순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card> */}

        {/* 후기 작성 모달 */}
        {showWriteReview && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>후기 작성하기</CardTitle>
              <CardDescription>여행 경험을 다른 여행자들과 공유해보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">목적지</label>
                    <Input
                      name="travel"
                      value={travel}
                      onChange={(e) => setTravel(e.target.value)}
                      placeholder="여행한 목적지를 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">평점</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="relative">
                          <div
                            className="cursor-pointer"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const isLeftHalf = clickX < rect.width / 2;
                              const newScore = isLeftHalf ? star - 0.5 : star;
                              setScore(newScore);
                              console.log('선택된 별점:', newScore);
                            }}
                          >
                            <Star className="h-6 w-6 text-gray-300" />
                            {score >= star && (
                              <div className="absolute inset-0 pointer-events-none">
                                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                              </div>
                            )}
                            {score >= star - 0.5 && score < star && (
                              <div
                                className="absolute inset-0 overflow-hidden pointer-events-none"
                                style={{ width: '50%' }}
                              >
                                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">현재 선택된 평점: {score}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">이미지</label>
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    name="images"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">후기 내용</label>
                  <Textarea
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="여행 경험을 자세히 작성해주세요..."
                    rows={6}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowWriteReview(false)}>
                    취소
                  </Button>
                  <Button type="submit">후기 등록</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 후기 리스트*/}
        <div className="space-y-6">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <div className="flex flex-row items-stretch">
                {/* 이미지 영역 */}
                <div className="w-40 flex-shrink-0 flex items-center justify-center bg-gray-100">
                  <img
                    src={
                      review.review_img[0]?.img_url == undefined
                        ? 'https://exbimetzhyeddpkjnlyt.supabase.co/storage/v1/object/public/reviewimg//tmp.jpeg'
                        : review.review_img[0].img_url
                    }
                    alt="여행 사진"
                    className="w-36 h-36 object-cover rounded-lg"
                  />
                </div>
                {/* 텍스트 영역 */}
                <div className="flex-1 flex flex-col justify-between p-4">
                  <CardHeader className="p-0 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">익명</h3>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="relative inline-block">
                            <Star className="h-4 w-4 text-gray-300" />
                            {review.score >= star && (
                              <Star className="h-4 w-4 text-yellow-400 fill-current absolute left-0 top-0" />
                            )}
                            {review.score >= star - 0.5 && review.score < star && (
                              <span
                                className="absolute left-0 top-0 overflow-hidden"
                                style={{ width: '50%' }}
                              >
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
