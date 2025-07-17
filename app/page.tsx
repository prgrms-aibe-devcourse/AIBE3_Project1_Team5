'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [destinations, setDestinations] = useState([]);

  //데이터 가져옴
  const fetchDestinations = async () => {
    const { data, error } = await supabase
      .from('travels')
      .select('*')
      .order('view_count', { ascending: false }); //view_count 기준으로 정렬

    if (error) {
      console.error('데이터 가져오기 오류:', error);
      return;
    }
    console.log('✅ Supabase 데이터:', data);
    setDestinations(data);
  };
  //컴포넌트가 처음 마운트 될때 여행지 불러오기
  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 검색 로직 구현
    console.log('검색:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">완벽한 여행을 계획하세요</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI가 도와주는 맞춤형 여행 계획으로 특별한 추억을 만들어보세요
          </p>

          {/* Search Bar */}
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
              <Button
                type="submit"
                className="rounded-full px-8 py-3 bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-5 w-5 mr-2" />
                검색
              </Button>
            </div>
          </form>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Button variant="outline" className="rounded-full px-6 py-3 bg-transparent">
              <Calendar className="h-4 w-4 mr-2" />
              일정 만들기
            </Button>
            <Button variant="outline" className="rounded-full px-6 py-3 bg-transparent">
              <Users className="h-4 w-4 mr-2" />
              그룹 여행
            </Button>
            <Button variant="outline" className="rounded-full px-6 py-3 bg-transparent">
              <Star className="h-4 w-4 mr-2" />
              인기 여행지
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">인기 여행지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((destination) => (
              <Card
                key={destination.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={destination.image_url || '/placeholder.svg'}
                    alt={destination.name_kr}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white rounded-full px-2 py-1 flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium ml-1">{destination.rating_num ?? 0}</span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{destination.name_kr}</CardTitle>
                  <CardDescription className="text-gray-500">{destination.country}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{destination.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            왜 우리 플랫폼을 선택해야 할까요?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">스마트 검색</h3>
              <p className="text-gray-600">AI 기반 검색으로 원하는 여행지를 쉽게 찾아보세요</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">맞춤 일정</h3>
              <p className="text-gray-600">개인 취향에 맞는 완벽한 여행 일정을 자동으로 생성</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">실시간 후기</h3>
              <p className="text-gray-600">실제 여행자들의 생생한 후기와 팁을 확인하세요</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
