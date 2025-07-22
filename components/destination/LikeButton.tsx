import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LikeButtonProps = {
  isLiked: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
};

export default function LikeButton({ isLiked, onClick, label, className }: LikeButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`bg-white/90 hover:bg-white text-gray-900 flex items-center px-4 py-2 rounded-lg shadow border border-gray-300 hover:border-gray-400 ${
        className || ''
      }`}
      style={{ gap: '0.5rem' }}
    >
      <Heart color={isLiked ? 'red' : 'gray'} fill={isLiked ? 'red' : 'none'} />
      {label && <span className="text-gray-900 font-medium">{label}</span>}
    </Button>
  );
}
