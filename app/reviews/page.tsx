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
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewSearchBar from '@/components/reviews/ReviewSearchBar';

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

  const [travelsList, setTravelsList] = useState<{ id: string; name_kr: string }[]>([]);
  const [selectedTravelId, setSelectedTravelId] = useState('default');

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

  const [searchField, setSearchField] = useState<'destination' | 'author' | 'content'>('content');

  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);

  useEffect(() => {
    setFilteredReviews(reviews);
  }, [reviews]);

  useEffect(() => {
    const fetchTravels = async () => {
      const { data, error } = await supabase.from('travels').select('id, name_kr');
      if (!error && data) setTravelsList(data);
    };
    fetchTravels();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredReviews(reviews);
      return;
    }
    const query = searchQuery.trim().toLowerCase();
    let result: Review[] = [];
    if (searchField === 'destination') {
      result = reviews.filter(
        (review) =>
          review.travels &&
          (Array.isArray(review.travels) ? review.travels[0]?.name_kr : review.travels.name_kr)
            ?.toLowerCase()
            .includes(query)
      );
    } else if (searchField === 'author') {
      result = reviews.filter((review) => userNames[review.user_id]?.toLowerCase().includes(query));
    } else if (searchField === 'content') {
      result = reviews.filter((review) => review.content.toLowerCase().includes(query));
    }
    setFilteredReviews(result);
  };

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
    if (!selectedTravelId || selectedTravelId === 'default') {
      alert('여행지를 선택해주세요.');
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
          travel_id: selectedTravelId,
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

  const handleEdit = (id: string) => {
    const review = reviews.find((r) => r.id === id);
    if (review) {
      setEditingReviewId(id);
      setEditContent(review.content);
      setEditScore(review.score);
      setEditImages([]);
      setImageAction('keep');
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
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

        {/* 후기 검색 및 필터링 */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <ReviewSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchField={searchField}
              setSearchField={setSearchField}
              onSearch={handleSearch}
            />
          </CardContent>
        </Card>

        {/* 후기 작성 모달 */}
        {showWriteReview && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>후기 작성하기</CardTitle>
              <CardDescription>여행 경험을 다른 여행자들과 공유해보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReviewForm
                travelsList={travelsList}
                selectedTravelId={selectedTravelId}
                setSelectedTravelId={setSelectedTravelId}
                content={content}
                setContent={setContent}
                score={score}
                setScore={setScore}
                images={images}
                setImages={setImages}
                fileInputRef={fileInputRef}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>
        )}

        {/* 후기 리스트 */}
        <ReviewList
          reviews={filteredReviews}
          userNames={userNames}
          editingReviewId={editingReviewId}
          myUserId={user?.id}
          editState={{
            editContent,
            setEditContent,
            editScore,
            setEditScore,
            editImages,
            setEditImages,
            imageAction,
            setImageAction,
            editFileInputRef,
          }}
          onEdit={handleEdit}
          onDelete={handleDeleteReview}
          onEditSubmit={handleEditReview}
          onEditCancel={() => setEditingReviewId(null)}
        />
      </div>
    </div>
  );
}
