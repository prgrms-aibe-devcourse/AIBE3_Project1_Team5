'use client';

import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/destinations?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
      <div className="relative flex items-center bg-white rounded-full shadow-lg p-2">
        <MapPin className="h-5 w-5 text-gray-400 ml-4" />
        <Input
          type="text"
          placeholder="어디로 여행을 떠나고 싶으신가요?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-none focus:ring-0 text-lg px-4"
        />
        <Button type="submit" className="rounded-full px-8 py-3 bg-blue-600 hover:bg-blue-700">
          <Search className="h-5 w-5 mr-2" />
          검색
        </Button>
      </div>
    </form>
  );
}
