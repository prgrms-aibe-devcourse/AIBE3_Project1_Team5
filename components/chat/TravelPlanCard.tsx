import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, Clock, ChevronDown, ChevronUp, Download, Edit, Share2, Table } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { TravelPlan, ImprovedDaySchedule, TravelOverview, MealSummary, CostBreakdown } from '@/lib/openai';
import TravelPlanTableModal from './TravelPlanTableModal';
import { printTravelPlan, generateTravelPlanImage, downloadBlob } from '@/lib/pdfGenerator';
import { travelPlanService } from '@/lib/travelPlanService';

interface TravelPlanCardProps {
  plan: TravelPlan;
  onDetailView?: () => void;
  onModify?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export default function TravelPlanCard({ plan, onDetailView, onModify, onShare, onDownload }: TravelPlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [enrichedPlan, setEnrichedPlan] = useState<any>(plan);

  // 원본 파라미터 조회 및 plan 객체에 병합
  useEffect(() => {
    const enrichPlanWithOriginalParams = async () => {
      try {
        // plan에 이미 originalParams가 있으면 스킵
        if ((plan as any).originalParams) {
          setEnrichedPlan(plan);
          return;
        }

        // created_from_session_id가 있으면 해당 세션의 파라미터 조회
        const planWithSessionId = plan as any;
        if (planWithSessionId.created_from_session_id) {
          console.log('🔍 원본 파라미터 조회 시작:', planWithSessionId.created_from_session_id);
          const sessionParams = await travelPlanService.getSessionParameters(planWithSessionId.created_from_session_id);
          
          if (sessionParams) {
            console.log('📋 조회된 세션 파라미터:', sessionParams);
            const originalParams = {
              title: sessionParams.title,
              destination: sessionParams.destination,
              duration: sessionParams.duration,
              peopleCount: sessionParams.people_count,
              budget: sessionParams.budget,
              travelStyle: sessionParams.travel_style,
              transportation: sessionParams.transportation,
              accommodation: sessionParams.accommodation
            };
            
            const enriched = {
              ...plan,
              originalParams
            };
            
            console.log('✅ 원본 파라미터 병합 완료:', enriched);
            setEnrichedPlan(enriched);
          } else {
            console.log('⚠️ 세션 파라미터 조회 실패');
            setEnrichedPlan(plan);
          }
        } else {
          console.log('⚠️ created_from_session_id 없음');
          setEnrichedPlan(plan);
        }
      } catch (error) {
        console.error('❌ 원본 파라미터 조회 오류:', error);
        setEnrichedPlan(plan);
      }
    };

    enrichPlanWithOriginalParams();
  }, [plan]);

  // 다운로드 처리 함수
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    setIsDownloading(true);
    try {
      // 사용자에게 다운로드 형식 선택 제공
      const choice = window.confirm('PDF로 다운로드하시겠습니까?\n확인: PDF 프린트\n취소: 이미지 다운로드');
      
      if (choice) {
        // PDF 프린트
        printTravelPlan(plan);
      } else {
        // 이미지 다운로드
        const imageBlob = await generateTravelPlanImage(plan, 'png');
        const filename = `${plan.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_여행계획.png`;
        downloadBlob(imageBlob, filename);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

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
        
        {/* 여행 개요 정보 */}
        {plan.overview && (
          <div className="bg-white rounded-lg p-3 border border-gray-200 mt-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">일정:</span>
                <span className="ml-2 text-gray-600">{plan.overview.dates}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">인원:</span>
                <span className="ml-2 text-gray-600">{plan.overview.people}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">교통:</span>
                <span className="ml-2 text-gray-600">{plan.overview.transportation}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">숙소:</span>
                <span className="ml-2 text-gray-600">{plan.overview.accommodation}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">테마:</span>
                <span className="ml-2 text-gray-600">{plan.overview.theme}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">예산:</span>
                <span className="ml-2 text-blue-600 font-semibold">{plan.overview.budgetRange}</span>
              </div>
            </div>
          </div>
        )}
        
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
            {plan.schedule.slice(0, expanded ? plan.schedule.length : 2).map((day: ImprovedDaySchedule, index: number) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">
                    {day.title}
                  </h5>
                  {day.totalCost && (
                    <span className="text-sm text-gray-600">
                      {formatCurrency(day.totalCost)}
                    </span>
                  )}
                </div>
                
                {expanded && (
                  <div className="space-y-1 mt-2">
                    {day.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center text-xs text-gray-500 py-1 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-600">{item.time}</span>
                          <span>{item.status}</span>
                          <span>{item.activity}</span>
                        </div>
                        <span className="text-right">
                          {item.cost > 0 && (
                            <span className="text-green-600 font-medium">{formatCurrency(item.cost)}</span>
                          )}
                        </span>
                      </div>
                    ))}
                    {day.items.length > 3 && (
                      <div className="text-xs text-gray-400 text-center py-1">
                        외 {day.items.length - 3}개 일정
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {plan.schedule.length > 2 && (
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

        {/* 식사 요약 */}
        {plan.mealSummary && plan.mealSummary.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              🍽️ 식사 요약
            </h4>
            <div className="space-y-1">
              {plan.mealSummary.slice(0, 3).map((meal, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-orange-700">
                    {meal.day} {meal.meal}: {meal.restaurant}
                  </span>
                  <span className={`font-medium ${
                    meal.status.includes('확정') ? 'text-green-600' : 
                    meal.status.includes('미정') ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {meal.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Dialog open={showTableModal} onOpenChange={setShowTableModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Table className="h-4 w-4" />
                전체 일정표
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{plan.title}</DialogTitle>
                <DialogDescription>
                  여행 계획의 상세 일정표를 확인하실 수 있습니다.
                </DialogDescription>
              </DialogHeader>
              <TravelPlanTableModal plan={enrichedPlan} />
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={() => {
              if (onModify) {
                onModify();
              } else {
                console.warn('onModify 핸들러가 정의되지 않았습니다.');
                alert('수정 기능을 사용할 수 없습니다. 페이지를 새로고침해주세요.');
              }
            }} 
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            수정하기
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? '처리중...' : '다운로드'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              if (onShare) {
                onShare();
              } else {
                console.log('📤 기본 공유 기능 사용:', plan.title);
                
                // 기본 공유 기능 (웹 Share API 또는 URL 복사)
                if (navigator.share) {
                  navigator.share({
                    title: plan.title,
                    text: `${plan.title} - ${plan.duration}일 여행 계획`,
                    url: window.location.href
                  }).catch((error) => {
                    console.log('공유 실패:', error);
                    // 폴백: URL 복사
                    navigator.clipboard.writeText(window.location.href);
                    alert('링크가 클립보드에 복사되었습니다!');
                  });
                } else {
                  // 웹 Share API 미지원시 URL 복사
                  navigator.clipboard.writeText(window.location.href);
                  alert('링크가 클립보드에 복사되었습니다!');
                }
              }
            }} 
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            공유하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}