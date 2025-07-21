'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { travelPlanService, TravelPlanDB } from '@/lib/travelPlanService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TravelEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  travelId: string;
  onUpdate: () => void;
}

export default function TravelEditModal({ isOpen, onClose, travelId, onUpdate }: TravelEditModalProps) {
  const [travel, setTravel] = useState<TravelPlanDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    duration: 0,
    people_count: 0,
    budget: 0,
    transportation: '',
    accommodation: '',
    travel_style: '',
    status: 'draft' as 'draft' | 'confirmed' | 'completed'
  });

  useEffect(() => {
    if (isOpen && travelId) {
      loadTravel();
    }
  }, [isOpen, travelId]);

  const loadTravel = async () => {
    setIsLoading(true);
    try {
      const travelData = await travelPlanService.getTravelPlan(travelId);
      if (travelData) {
        setTravel(travelData);
        setFormData({
          title: travelData.title,
          destination: travelData.destination,
          duration: travelData.duration,
          people_count: travelData.people_count,
          budget: travelData.budget || 0,
          transportation: travelData.transportation || '',
          accommodation: travelData.accommodation || '',
          travel_style: travelData.travel_style || '',
          status: travelData.status
        });
      }
    } catch (error) {
      console.error('Failed to load travel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const updated = await travelPlanService.updateTravelPlan(travelId, formData);
      if (updated) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update travel:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">여행 계획 수정</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">여행 정보를 불러오는 중...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 제목 */}
              <div>
                <Label htmlFor="title">여행 제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              {/* 목적지 */}
              <div>
                <Label htmlFor="destination">목적지</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 기간 */}
                <div>
                  <Label htmlFor="duration">여행 기간 (일)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    required
                    className="mt-1"
                  />
                </div>

                {/* 인원 */}
                <div>
                  <Label htmlFor="people_count">인원 수</Label>
                  <Input
                    id="people_count"
                    type="number"
                    min="1"
                    value={formData.people_count}
                    onChange={(e) => setFormData({ ...formData, people_count: parseInt(e.target.value) || 0 })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* 예산 */}
              <div>
                <Label htmlFor="budget">예산 (만원)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 교통수단 */}
                <div>
                  <Label htmlFor="transportation">교통수단</Label>
                  <Input
                    id="transportation"
                    value={formData.transportation}
                    onChange={(e) => setFormData({ ...formData, transportation: e.target.value })}
                    placeholder="예: 비행기, 기차"
                    className="mt-1"
                  />
                </div>

                {/* 숙박 */}
                <div>
                  <Label htmlFor="accommodation">숙박</Label>
                  <Input
                    id="accommodation"
                    value={formData.accommodation}
                    onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
                    placeholder="예: 호텔, 에어비앤비"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* 여행 스타일 */}
              <div>
                <Label htmlFor="travel_style">여행 스타일</Label>
                <Input
                  id="travel_style"
                  value={formData.travel_style}
                  onChange={(e) => setFormData({ ...formData, travel_style: e.target.value })}
                  placeholder="예: 휴양, 관광, 미식"
                  className="mt-1"
                />
              </div>

              {/* 상태 */}
              <div>
                <Label htmlFor="status">상태</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">작성중</SelectItem>
                    <SelectItem value="confirmed">확정됨</SelectItem>
                    <SelectItem value="completed">완료됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </form>

        {/* 푸터 */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isLoading}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}