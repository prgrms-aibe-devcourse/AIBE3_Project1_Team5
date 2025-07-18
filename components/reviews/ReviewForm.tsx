import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Star } from 'lucide-react';
import React from 'react';

type Travel = { id: string; name_kr: string };

type ReviewFormProps = {
  travelsList: Travel[];
  selectedTravelId: string;
  setSelectedTravelId: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  score: number;
  setScore: (v: number) => void;
  images: File[];
  setImages: (v: File[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function ReviewForm({
  travelsList,
  selectedTravelId,
  setSelectedTravelId,
  content,
  setContent,
  score,
  setScore,
  images,
  setImages,
  fileInputRef,
  onSubmit,
}: ReviewFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">목적지</label>
          <Select value={selectedTravelId} onValueChange={setSelectedTravelId}>
            <SelectTrigger>
              <SelectValue placeholder="여행지를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default" disabled>
                여행지를 선택하세요
              </SelectItem>
              {travelsList.map((travel) => (
                <SelectItem key={travel.id} value={travel.id}>
                  {travel.name_kr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">평점</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="relative">
                <div
                  className="cursor-pointer"
                  onClick={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const clickX = (e as any).clientX - rect.left;
                    const isLeftHalf = clickX < rect.width / 2;
                    const newScore = isLeftHalf ? star - 0.5 : star;
                    setScore(newScore);
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
        <Button variant="outline" type="button">
          취소
        </Button>
        <Button type="submit">후기 등록</Button>
      </div>
    </form>
  );
}
