import { Star, Edit, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ChangeEvent } from 'react';

type Review = {
  id: string;
  content: string;
  score: number;
  created_at: string;
  user_id: string;
  travels: { name_kr: string }[];
  review_img: { img_url: string }[];
};

type ReviewCardProps = {
  review: Review;
  userName: string;
  isEditing: boolean;
  isMine: boolean;
  editState?: {
    editContent: string;
    setEditContent: (v: string) => void;
    editScore: number;
    setEditScore: (v: number) => void;
    editImages: File[];
    setEditImages: (v: File[]) => void;
    imageAction: 'keep' | 'replace' | 'remove';
    setImageAction: (v: 'keep' | 'replace' | 'remove') => void;
    editFileInputRef: React.RefObject<HTMLInputElement>;
  };
  onEdit: () => void;
  onDelete: () => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
};

export default function ReviewCard({
  review,
  userName,
  isEditing,
  isMine,
  editState,
  onEdit,
  onDelete,
  onEditSubmit,
  onEditCancel,
}: ReviewCardProps) {
  return (
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
                  <h3 className="font-semibold">{userName}</h3>
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
              {!isEditing && (
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
              {isEditing && editState && (
                <div className="flex flex-col space-y-1 items-end">
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
                            editState.setEditScore(newScore);
                          }}
                        >
                          <Star className="h-4 w-4 text-gray-300" />
                          {editState.editScore >= star && (
                            <div className="absolute inset-0 pointer-events-none">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            </div>
                          )}
                          {editState.editScore >= star - 0.5 && editState.editScore < star && (
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
                  <p className="text-sm text-gray-500">현재 선택된 평점: {editState.editScore}</p>
                </div>
              )}
              {isMine && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={onEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          {isEditing && editState ? (
            <div className="space-y-2">
              {/* 이미지 처리 옵션 */}
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
                    name={`imageAction-${review.id}`}
                    value="keep"
                    checked={editState.imageAction === 'keep'}
                    onChange={() => editState.setImageAction('keep')}
                  />
                  <span>기존 이미지 유지</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name={`imageAction-${review.id}`}
                    value="replace"
                    checked={editState.imageAction === 'replace'}
                    onChange={() => editState.setImageAction('replace')}
                  />
                  <span>새 이미지로 교체</span>
                </label>
                {review.review_img.length > 0 && (
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`imageAction-${review.id}`}
                      value="remove"
                      checked={editState.imageAction === 'remove'}
                      onChange={() => editState.setImageAction('remove')}
                    />
                    <span>이미지 삭제</span>
                  </label>
                )}
              </div>
              {/* 새 이미지 업로드 */}
              {editState.imageAction === 'replace' && (
                <div className="space-y-2">
                  {editState.editImages.length > 0 && (
                    <div className="flex space-x-2 mb-2">
                      {editState.editImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="새 이미지 미리보기"
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => {
                              editState.setEditImages([]);
                              if (editState.editFileInputRef.current) {
                                editState.editFileInputRef.current.value = '';
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
                        if (editState.editFileInputRef.current)
                          editState.editFileInputRef.current.value = '';
                        alert('png, jpg, webp 파일만 업로드할 수 있습니다.');
                        return;
                      }
                      if (file.size > maxSize) {
                        if (editState.editFileInputRef.current)
                          editState.editFileInputRef.current.value = '';
                        alert('파일 크기는 5MB를 넘을 수 없습니다.');
                        return;
                      }
                      editState.setEditImages([file]);
                    }}
                    ref={editState.editFileInputRef}
                  />
                </div>
              )}
              {/* 이미지 삭제 경고 */}
              {editState.imageAction === 'remove' && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ 이미지를 삭제하면 복구할 수 없습니다.
                </p>
              )}
              {/* 후기 내용/버튼 */}
              <Input
                value={editState.editContent}
                onChange={(e) => editState.setEditContent(e.target.value)}
                placeholder="수정할 내용을 입력하세요"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onEditCancel}>
                  수정 취소
                </Button>
                <Button onClick={onEditSubmit}>수정 완료</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>
              <div className="flex justify-end mt-2">
                <span className="text-xs text-gray-400">
                  {(() => {
                    const d = new Date(review.created_at);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const hh = String(d.getHours()).padStart(2, '0');
                    const min = String(d.getMinutes()).padStart(2, '0');
                    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
                  })()}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </div>
    </div>
  );
}
