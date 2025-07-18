import ReviewCard from './ReviewCard';

type Review = {
  id: string;
  content: string;
  score: number;
  created_at: string;
  user_id: string;
  travels: { name_kr: string }[];
  review_img: { img_url: string }[];
};

type ReviewListProps = {
  reviews: Review[];
  userNames: Record<string, string>;
  editingReviewId: string | null;
  myUserId: string | undefined;
  editState?: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onEditSubmit: (id: string) => void;
  onEditCancel: () => void;
};

export default function ReviewList({
  reviews,
  userNames,
  editingReviewId,
  myUserId,
  editState,
  onEdit,
  onDelete,
  onEditSubmit,
  onEditCancel,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return <div className="text-center text-gray-500 py-8">검색된 후기가 없습니다.</div>;
  }
  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          userName={userNames[review.user_id] || '알 수 없음'}
          isEditing={editingReviewId === review.id}
          isMine={myUserId === review.user_id}
          editState={editingReviewId === review.id ? editState : undefined}
          onEdit={() => onEdit(review.id)}
          onDelete={() => onDelete(review.id)}
          onEditSubmit={() => onEditSubmit(review.id)}
          onEditCancel={onEditCancel}
        />
      ))}
    </div>
  );
}
