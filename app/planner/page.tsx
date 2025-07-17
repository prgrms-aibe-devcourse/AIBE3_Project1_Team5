'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PlannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">나만의 여행 일정 만들기</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            완벽한 여행을 위한 체계적인 일정 계획을 세워보세요
          </p>
        </div>

        {/* Feature Images and Descriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left Image */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <img
                src="https://exbimetzhyeddpkjnlyt.supabase.co/storage/v1/object/public/trips//christin-hume-mfB1B1s4sMc-unsplash.jpg"
                alt="여행 계획"
                className="w-full h-64 object-cover rounded-2xl shadow-lg"
              />
              <div className="absolute inset-0 bg-blue-600/20 rounded-2xl"></div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">체계적인 일정 관리</h3>
              <p className="text-gray-600 text-sm">
                날짜별로 세부 일정을 계획하고 시간대별 활동을 체계적으로 관리할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <img
                src="https://exbimetzhyeddpkjnlyt.supabase.co/storage/v1/object/public/trips//daniel-sessler-KXQ04V4cArg-unsplash.jpg"
                alt="여행지 선택"
                className="w-full h-80 object-cover rounded-2xl shadow-lg" // 기존 h-64 → h-80로 확대
              />
              <div className="absolute inset-0 bg-green-600/20 rounded-2xl"></div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm max-w-xs">
              {' '}
              {/* padding 줄이고, max-width로 더 컴팩트하게 */}
              <MapPin className="h-7 w-7 text-green-600 mx-auto mb-2" /> {/* 아이콘도 살짝 축소 */}
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                다양한 여행지 선택
              </h3>{' '}
              {/* 폰트 크기 축소 */}
              <p className="text-gray-600 text-xs">
                {' '}
                {/* 폰트 크기 축소 */}전 세계 여행지를 검색하고 선택하여 나만의 특별한 여행 루트를
                만들어보세요.
              </p>
            </div>
          </div>

          {/* Left Image */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <img
                src="https://exbimetzhyeddpkjnlyt.supabase.co/storage/v1/object/public/trips//sergio-capuzzimati-QSRbcxl7BfE-unsplash.jpg"
                alt="그룹 여행"
                className="w-full h-64 object-cover rounded-2xl shadow-lg"
              />
              <div className="absolute inset-0 bg-purple-600/20 rounded-2xl"></div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">함께하는 여행</h3>
              <p className="text-gray-600 text-sm">
                가족, 친구들과 함께하는 여행 계획을 세우고 모든 일정을 한눈에 확인하세요.
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              여행 계획의 모든 것을 한 곳에서
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">날짜별 일정 관리</h4>
                  <p className="text-gray-600 text-sm">
                    출발부터 도착까지 모든 일정을 체계적으로 관리
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-2 mt-1">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">여행지 검색</h4>
                  <p className="text-gray-600 text-sm">전 세계 여행지를 쉽게 검색하고 선택</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full p-2 mt-1">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">동행자 관리</h4>
                  <p className="text-gray-600 text-sm">함께 여행하는 사람들과 일정 공유</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 rounded-full p-2 mt-1">
                  <ArrowRight className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">간편한 사용</h4>
                  <p className="text-gray-600 text-sm">직관적인 인터페이스로 누구나 쉽게 사용</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="text-center">
          <Link href="/planner/create">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
              새 일정 생성하기
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
