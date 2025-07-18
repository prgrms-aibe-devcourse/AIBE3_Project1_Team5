import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface ReviewSearchBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchField: 'destination' | 'author' | 'content';
  setSearchField: (v: 'destination' | 'author' | 'content') => void;
  onSearch: (e: React.FormEvent) => void;
}

export default function ReviewSearchBar({
  searchQuery,
  setSearchQuery,
  searchField,
  setSearchField,
  onSearch,
}: ReviewSearchBarProps) {
  return (
    <form onSubmit={onSearch} className="flex flex-col sm:flex-row items-center gap-2">
      <Input
        type="text"
        placeholder="후기 검색"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 min-w-0"
      />
      <Select
        value={searchField}
        onValueChange={(v) => setSearchField(v as 'destination' | 'author' | 'content')}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="검색 기준" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="destination">여행지</SelectItem>
          <SelectItem value="author">작성자</SelectItem>
          <SelectItem value="content">후기 내용</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" className="flex items-center gap-1">
        <Search className="w-4 h-4" />
        검색
      </Button>
    </form>
  );
}
