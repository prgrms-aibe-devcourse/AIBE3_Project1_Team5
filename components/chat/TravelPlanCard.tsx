import React, { useState } from 'react';
import { Calendar, MapPin, Users, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TravelPlan, DaySchedule } from '@/lib/openai';

interface TravelPlanCardProps {
  plan: TravelPlan;
  onDetailView?: () => void;
}

export default function TravelPlanCard({ plan, onDetailView }: TravelPlanCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {plan.title}
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {plan.duration}일
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {plan.startDate && plan.endDate ? (
              <span>{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</span>
            ) : (
              <span>{plan.duration}일간</span>
            )}
          </div>
          
          {plan.totalBudget && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatCurrency(plan.totalBudget)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 일정 미리보기 */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            일정 미리보기
          </h4>
          
          <div className="space-y-2">
            {plan.schedule.slice(0, expanded ? plan.schedule.length : 3).map((day: DaySchedule, index: number) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">
                    {day.day}일차: {day.title}
                  </h5>
                  {day.totalCost && (
                    <span className="text-sm text-gray-600">
                      {formatCurrency(day.totalCost)}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{day.description}</p>
                
                {expanded && (
                  <div className="space-y-1 mt-2">
                    {day.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center text-xs text-gray-500">
                        <span>{item.time} - {item.activity}</span>
                        <span>{item.location}</span>
                      </div>
                    ))}
                    {day.items.length > 3 && (
                      <div className="text-xs text-gray-400 text-center">
                        외 {day.items.length - 3}개 일정
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {plan.schedule.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  간단히 보기
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  전체 일정 보기 ({plan.schedule.length}일)
                </>
              )}
            </Button>
          )}
        </div>

        {/* 여행 팁 */}
        {plan.tips && plan.tips.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-semibold text-amber-800 mb-2">💡 여행 팁</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {plan.tips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 필요사항 */}
        {plan.requirements && plan.requirements.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-semibold text-red-800 mb-2">📋 준비사항</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {plan.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-600">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onDetailView}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            자세한 일정 보기
          </Button>
          <Button variant="outline" className="flex-1">
            일정 수정하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}