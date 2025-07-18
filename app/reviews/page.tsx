'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Star,
  ThumbsUp,
  MessageCircle,
  Search,
  MapPin,
  Calendar,
  Trash2,
  Edit,
} from 'lucide-react';
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
  user_id: string;
  travels: { name_kr: string }[];
  review_img: { img_url: string }[];
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('review').select(`
        id,
        content,
        score,
        created_at,
        user_id,
        travels:travel_id(
          name_kr
        ),
        review_img(
          img_url
        )
      `);

      if (error) {
        alert('리뷰 데이터를 불러오지 못했습니다.');
      } else {
        setReviews(data || []);
        // user_id 추출 후 name 매핑
        const uniqueUserIds = Array.from(new Set((data || []).map((r) => r.user_id)));
        if (uniqueUserIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, name')
            .in('user_id', uniqueUserIds);
          if (profileError) {
            console.error('프로필 데이터를 불러오지 못했습니다:', profileError.message);
          } else if (profileData) {
            const namesMap = profileData.reduce((acc, profile) => {
              acc[profile.user_id] = profile.name;
              return acc;
            }, {} as Record<string, string>);
            setUserNames(namesMap);
          }
        }
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

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editScore, setEditScore] = useState(5.0);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [imageAction, setImageAction] = useState<'keep' | 'replace' | 'remove'>('keep');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 후기 수정 함수
  const handleEditReview = async (reviewId: string) => {
    if (!editContent.trim()) {
      alert('후기 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. 후기 내용과 평점 업데이트
      const { error: reviewError } = await supabase
        .from('review')
        .update({
          content: editContent,
          score: editScore,
        })
        .eq('id', reviewId);

      if (reviewError) {
        alert('후기 수정에 실패했습니다: ' + reviewError.message);
        return;
      }

      // 2. 이미지 처리
      if (imageAction === 'replace') {
        if (editImages.length === 0) {
          alert('새로 첨부할 이미지를 선택해주세요.');
          setIsLoading(false);
          return;
        }
        // 기존 이미지 삭제
        const { data: existingImages, error: fetchError } = await supabase
          .from('review_img')
          .select('file_path')
          .eq('review_id', reviewId);

        if (fetchError) {
          alert('기존 이미지 정보를 가져오는데 실패했습니다.');
          return;
        }

        // Storage에서 기존 이미지 삭제
        if (existingImages && existingImages.length > 0) {
          const filePaths = existingImages.map((img) => img.file_path);
          const { error: storageError } = await supabase.storage
            .from('reviewimg')
            .remove(filePaths);

          if (storageError) {
            console.error('기존 이미지 Storage 삭제 실패:', storageError);
          }
        }

        // review_img 테이블에서 기존 이미지 레코드 삭제
        const { error: imgDeleteError } = await supabase
          .from('review_img')
          .delete()
          .eq('review_id', reviewId);

        if (imgDeleteError) {
          alert('기존 이미지 데이터 삭제에 실패했습니다.');
          return;
        }

        // 새 이미지 업로드
        const file = editImages[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `review_${reviewId}_${Date.now()}.${fileExt}`;

        // Storage 업로드
        const { data: storageData, error: storageError } = await supabase.storage
          .from('reviewimg')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          alert('새 이미지 업로드 실패: ' + storageError.message);
          return;
        }

        // Public URL 가져오기
        const { data: publicUrlData } = supabase.storage.from('reviewimg').getPublicUrl(filePath);
        const imgUrl = publicUrlData?.publicUrl;

        // review_img 테이블에 새 이미지 저장
        const { error: imgError } = await supabase.from('review_img').insert({
          img_url: imgUrl,
          file_path: filePath,
          order: 1,
          review_id: reviewId,
        });

        if (imgError) {
          alert('새 이미지 DB 저장 실패: ' + imgError.message);
          return;
        }
      } else if (imageAction === 'remove') {
        // 기존 이미지 삭제
        const { data: existingImages, error: fetchError } = await supabase
          .from('review_img')
          .select('file_path')
          .eq('review_id', reviewId);

        if (fetchError) {
          alert('기존 이미지 정보를 가져오는데 실패했습니다.');
          return;
        }

        // Storage에서 기존 이미지 삭제
        if (existingImages && existingImages.length > 0) {
          const filePaths = existingImages.map((img) => img.file_path);
          const { error: storageError } = await supabase.storage
            .from('reviewimg')
            .remove(filePaths);

          if (storageError) {
            console.error('기존 이미지 Storage 삭제 실패:', storageError);
          }
        }

        // review_img 테이블에서 기존 이미지 레코드 삭제
        const { error: imgDeleteError } = await supabase
          .from('review_img')
          .delete()
          .eq('review_id', reviewId);

        if (imgDeleteError) {
          alert('기존 이미지 데이터 삭제에 실패했습니다.');
          return;
        }
      }
      // imageAction === 'keep'인 경우는 아무것도 하지 않음

      alert('후기 수정이 완료되었습니다.');

      // 후기 목록 새로고침
      const newData = await fetchReviews();
      if (newData) {
        setReviews(newData);
      }

      // 수정 모드 종료
      setEditingReviewId(null);
      setEditContent('');
      setEditScore(5.0);
      setEditImages([]);
      setImageAction('keep');
    } catch (error) {
      console.error('후기 수정 중 오류:', error);
      alert('후기 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 후기 데이터 가져오기 함수
  const fetchReviews = async () => {
    const { data, error } = await supabase.from('review').select(`
      id,
      content,
      score,
      created_at,
      user_id,
      travels: travel_id(
        name_kr
      ),
      review_img(
        img_url
      )
    `);

    if (error) {
      alert('리뷰 데이터를 불러오지 못했습니다.');
      return null;
    }
    console.log(data);

    return (data as Review[]) || [];
  };

  // 후기 삭제 함수
  const handleDeleteReview = async (reviewId: string) => {
    const isConfirmed = window.confirm('정말로 이 후기를 삭제하시겠습니까?');
    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      // 먼저 첨부된 이미지들을 검색색
      const { data: images, error: imagesError } = await supabase
        .from('review_img')
        .select('file_path')
        .eq('review_id', reviewId);

      if (imagesError) {
        alert('이미지 정보를 가져오는데 실패했습니다.');
        return;
      }

      // Storage에서 이미지 파일들 삭제
      if (images && images.length > 0) {
        const filePaths = images.map((img) => img.file_path);
        const { error: storageError } = await supabase.storage.from('reviewimg').remove(filePaths);

        if (storageError) {
          console.error('Storage 이미지 삭제 실패:', storageError);
        }
      }

      // review_img 테이블에서 이미지 레코드들 삭제
      const { error: imgDeleteError } = await supabase
        .from('review_img')
        .delete()
        .eq('review_id', reviewId);

      if (imgDeleteError) {
        alert('이미지 데이터 삭제에 실패했습니다.');
        return;
      }

      // 마지막으로 review 테이블에서 후기 삭제
      const { error: reviewDeleteError } = await supabase
        .from('review')
        .delete()
        .eq('id', reviewId);

      if (reviewDeleteError) {
        alert('후기 삭제에 실패했습니다.');
        return;
      }

      alert('후기가 성공적으로 삭제되었습니다.');
      // 후기 목록 새로고침
      const newData = await fetchReviews();
      if (newData) {
        setReviews(newData);
      } else {
        alert('후기 목록을 새로고침하는데 실패했습니다.');
      }
    } catch (error) {
      alert('후기 삭제 중 오류가 발생했습니다.');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

    // 필수 필드 검증
    if (!travel.trim()) {
      alert('목적지를 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('후기 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. 후기 등록
      const { data: review, error: reviewError } = await supabase
        .from('review')
        .insert({
          content,
          score,
          user_id: user?.id,
          travel_id: travel,
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

      // 후기 목록 새로고침
      try {
        const newData = await fetchReviews();
        if (newData) {
          setReviews(newData);
        }
      } catch (error) {
        console.error('후기 목록 새로고침 실패:', error);
        // 새로고침 실패해도 폼은 초기화
      }

      // 폼 초기화
      setContent('');
      setScore(5.0);
      setImages([]);
      setTravel('');
      setShowWriteReview(false);
    } catch (error) {
      console.error('후기 등록 중 오류:', error);
      alert('후기 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 후기 작성 버튼 클릭 핸들러
  const handleWriteReviewClick = () => {
    if (!user) {
      alert('로그인 후 이용해주세요.');
      router.push('/login');
      return;
    }
    setShowWriteReview((prev) => !prev);
  };

  // 후기 관련 처리 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">후기 정보를 처리 중...</p>
          </div>
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
          <Button onClick={handleWriteReviewClick} className="bg-blue-600 hover:bg-blue-700">
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
                  {/* 미리보기 먼저 */}
                  {images.length > 0 && (
                    <div className="flex space-x-2 mb-2">
                      {images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="첨부 이미지 미리보기"
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => {
                              setImages([]);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    name="images"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
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
                      setImages([file]);
                    }}
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

        {/* 후기가 없을 때 */}
        {reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-md border border-gray-100">
            <div className="mb-4">
              <Star className="w-12 h-12 text-gray-300" />
            </div>
            <div className="text-lg font-semibold text-gray-700 mb-2">
              아직 등록된 후기가 없습니다
            </div>
            <div className="text-gray-500 mb-6">가장 먼저 여행 후기를 남겨보세요!</div>
            <Button
              onClick={handleWriteReviewClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow"
            >
              첫 번째 후기 작성하기
            </Button>
          </div>
        )}
        {/* 후기가 있을 때 */}
        <div className="space-y-6">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <div className="flex flex-row items-stretch">
                {/* 이미지 영역 */}
                <div className="w-40 flex-shrink-0 flex items-center justify-center bg-gray-100">
                  <img
                    src={
                      review.review_img && review.review_img.length > 0
                        ? review.review_img[0].img_url
                        : 'https://exbimetzhyeddpkjnlyt.supabase.co/storage/v1/object/public/reviewimg/tmp/tmp.jpeg'
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
                          <AvatarImage
                            src="https://exbimetzhyeddpkjnlyt.supabase.co/storage/v1/object/public/reviewimg/tmp/human-vector.jpg"
                            className="w-10 h-10 rounded-full object-cover transition hover:shadow-md hover:border-blue-300"
                            alt="유저 아바타"
                          />
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">
                              {userNames[review.user_id] || '알 수 없음'}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center mt-2">
                          <Badge className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 font-medium rounded-full shadow-sm transition-colors duration-200 cursor-default hover:bg-blue-100">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            {review.travels.name_kr}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingReviewId !== review.id && (
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
                        )}
                        {editingReviewId === review.id && (
                          <div className="flex flex-col space-y-1 items-end">
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
                                      setEditScore(newScore);
                                    }}
                                  >
                                    <Star className="h-4 w-4 text-gray-300" />
                                    {editScore >= star && (
                                      <div className="absolute inset-0 pointer-events-none">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                      </div>
                                    )}
                                    {editScore >= star - 0.5 && editScore < star && (
                                      <div
                                        className="absolute inset-0 overflow-hidden pointer-events-none"
                                        style={{ width: '50%' }}
                                      >
                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-sm text-gray-500">현재 선택된 평점: {editScore}</p>
                          </div>
                        )}
                        {user && review.user_id === user.id && editingReviewId !== review.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditingReviewId(review.id);
                                setEditContent(review.content);
                                setEditScore(review.score);
                                setEditImages([]);
                                setImageAction('keep');
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    {editingReviewId === review.id ? (
                      <div className="space-y-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium">이미지 처리</label>

                          {/* 기존 이미지 미리보기 */}
                          {review.review_img.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 mb-1">현재 이미지:</p>
                              <div className="flex space-x-2">
                                {review.review_img.map((img, index) => (
                                  <img
                                    key={index}
                                    src={img.img_url}
                                    alt="기존 이미지"
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-1">
                              <input
                                type="radio"
                                name="imageAction"
                                value="keep"
                                checked={imageAction === 'keep'}
                                onChange={(e) =>
                                  setImageAction(e.target.value as 'keep' | 'replace' | 'remove')
                                }
                              />
                              <span>기존 이미지 유지</span>
                            </label>
                            <label className="flex items-center space-x-1">
                              <input
                                type="radio"
                                name="imageAction"
                                value="replace"
                                checked={imageAction === 'replace'}
                                onChange={(e) =>
                                  setImageAction(e.target.value as 'keep' | 'replace' | 'remove')
                                }
                              />
                              <span>새 이미지로 교체</span>
                            </label>
                            {review.review_img.length > 0 && (
                              <label className="flex items-center space-x-1">
                                <input
                                  type="radio"
                                  name="imageAction"
                                  value="remove"
                                  checked={imageAction === 'remove'}
                                  onChange={(e) =>
                                    setImageAction(e.target.value as 'keep' | 'replace' | 'remove')
                                  }
                                />
                                <span>이미지 삭제</span>
                              </label>
                            )}
                          </div>

                          {imageAction === 'replace' && (
                            <div className="space-y-2">
                              {/* 미리보기 먼저 */}
                              {editImages.length > 0 && (
                                <div className="flex space-x-2 mb-2">
                                  {editImages.map((file, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt="새 이미지 미리보기"
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <button
                                        onClick={() => {
                                          setEditImages([]);
                                          if (editFileInputRef.current) {
                                            editFileInputRef.current.value = '';
                                          }
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Input
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
                                  const maxSize = 5 * 1024 * 1024;
                                  if (!allowedTypes.includes(file.type)) {
                                    if (editFileInputRef.current)
                                      editFileInputRef.current.value = '';
                                    alert('png, jpg, webp 파일만 업로드할 수 있습니다.');
                                    return;
                                  }
                                  if (file.size > maxSize) {
                                    if (editFileInputRef.current)
                                      editFileInputRef.current.value = '';
                                    alert('파일 크기는 5MB를 넘을 수 없습니다.');
                                    return;
                                  }
                                  setEditImages([file]);
                                }}
                                ref={editFileInputRef}
                              />
                            </div>
                          )}

                          {imageAction === 'remove' && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              ⚠️ 이미지를 삭제하면 복구할 수 없습니다.
                            </p>
                          )}
                        </div>
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="수정할 내용을 입력하세요"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEditingReviewId(null)}>
                            수정 취소
                          </Button>
                          <Button onClick={() => handleEditReview(review.id)}>수정 완료</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>
                    )}
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
