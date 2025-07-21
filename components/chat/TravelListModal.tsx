'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Edit, Trash2, Calendar, MapPin, Users, Wallet, Filter, Download, Eye, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/app/providers/AuthProvider';
import { travelPlanService, TravelPlanDB } from '@/lib/travelPlanService';
import { formatDate } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TravelEditModal from './TravelEditModal';
import TravelPlanTableModal from './TravelPlanTableModal';
import { printTravelPlan, generateTravelPlanImage, downloadBlob } from '@/lib/pdfGenerator';
import { TravelPlan } from '@/lib/openai';

interface TravelListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// DB 데이터에서 원본 파라미터를 조회하여 TravelPlanTableModal에 전달하는 컴포넌트
function EnrichedTravelPlanTableModal({ dbPlan }: { dbPlan: TravelPlanDB }) {
  const [enrichedPlan, setEnrichedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const enrichPlan = async () => {
      try {
        
        // 기본 plan 변환
        let plan = convertDBToTravelPlan(dbPlan);
        
        // created_from_session_id가 있으면 원본 파라미터 조회
        if (dbPlan.created_from_session_id) {
          const sessionParams = await travelPlanService.getSessionParameters(dbPlan.created_from_session_id);
          
          if (sessionParams) {
            plan = {
              ...plan,
              originalParams: {
                title: sessionParams.title,
                destination: sessionParams.destination,
                startDate: sessionParams.start_date,
                endDate: sessionParams.end_date,
                duration: sessionParams.duration,
                peopleCount: sessionParams.people_count,
                budget: sessionParams.budget,
                travelStyle: sessionParams.travel_style,
                transportation: sessionParams.transportation,
                accommodation: sessionParams.accommodation
              }
            };
          } else {
          }
        } else {
        }
        
        setEnrichedPlan(plan);
      } catch (error) {
        console.error('❌ 리스트에서 원본 파라미터 조회 오류:', error);
        setEnrichedPlan(convertDBToTravelPlan(dbPlan));
      } finally {
        setIsLoading(false);
      }
    };

    // DB 데이터를 TravelPlan으로 변환하는 로컬 함수
    const convertDBToTravelPlan = (dbPlan: TravelPlanDB): TravelPlan => {
      return {
        title: dbPlan.title,
        destination: dbPlan.destination,
        duration: dbPlan.duration,
        startDate: dbPlan.start_date,
        endDate: dbPlan.end_date,
        schedule: dbPlan.schedule || [],
        tips: dbPlan.ai_metadata?.tips,
        requirements: dbPlan.ai_metadata?.requirements,
        currency: dbPlan.ai_metadata?.currency || 'KRW',
        totalBudget: dbPlan.ai_metadata?.totalBudget,
        overview: dbPlan.ai_metadata?.overview,
        mealSummary: dbPlan.ai_metadata?.mealSummary,
        costBreakdown: dbPlan.ai_metadata?.costBreakdown,
        emergencyInfo: dbPlan.ai_metadata?.emergencyInfo,
      };
    };

    enrichPlan();
  }, [dbPlan]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">여행 상세 정보를 불러오는 중...</div>
      </div>
    );
  }

  return enrichedPlan ? <TravelPlanTableModal plan={enrichedPlan} /> : null;
}

export default function TravelListModal({ isOpen, onClose }: TravelListModalProps) {
  const { user } = useAuth();
  const [travels, setTravels] = useState<TravelPlanDB[]>([]);
  const [filteredTravels, setFilteredTravels] = useState<TravelPlanDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingTravelId, setEditingTravelId] = useState<string | null>(null);
  const [viewingTravel, setViewingTravel] = useState<TravelPlanDB | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'confirmed' | 'completed'>('all');

  // 여행 목록 로드
  useEffect(() => {
    if (isOpen && user) {
      loadTravels();
    }
  }, [isOpen, user?.id]); // user 대신 user.id 사용

  // 상태별 필터링
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredTravels(travels);
    } else {
      setFilteredTravels(travels.filter(travel => travel.status === statusFilter));
    }
  }, [travels, statusFilter]);

  const loadTravels = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userTravels = await travelPlanService.getUserTravelPlans(user.id);
      setTravels(userTravels);
    } catch (error) {
      console.error('❌ Failed to load travels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleDelete = async (planId: string) => {
    try {
      const success = await travelPlanService.deleteTravelPlan(planId);
      if (success) {
        setTravels(travels.filter(t => t.id !== planId));
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Failed to delete travel:', error);
    }
  };

  const handleStatusChange = async (planId: string, newStatus: 'draft' | 'confirmed' | 'completed') => {
    try {
      const updated = await travelPlanService.updateTravelPlan(planId, { status: newStatus });
      if (updated) {
        setTravels(travels.map(t => t.id === planId ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'confirmed': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '작성중';
      case 'confirmed': return '확정';
      case 'completed': return '완료';
      default: return status;
    }
  };


  // 다운로드 처리 (원본 파라미터 포함)
  const handleDownload = async (travel: TravelPlanDB) => {
    setIsDownloading(travel.id);
    try {
      // 기본 plan 변환 (emergencyInfo 포함)
      let travelPlan = {
        title: travel.title,
        destination: travel.destination,
        duration: travel.duration,
        startDate: travel.start_date,
        endDate: travel.end_date,
        schedule: travel.schedule || [],
        tips: travel.ai_metadata?.tips,
        requirements: travel.ai_metadata?.requirements,
        currency: travel.ai_metadata?.currency || 'KRW',
        totalBudget: travel.ai_metadata?.totalBudget,
        overview: travel.ai_metadata?.overview,
        mealSummary: travel.ai_metadata?.mealSummary,
        costBreakdown: travel.ai_metadata?.costBreakdown,
        emergencyInfo: travel.ai_metadata?.emergencyInfo,
      };
      
      // created_from_session_id가 있으면 원본 파라미터 조회하여 enriched plan 생성
      if (travel.created_from_session_id) {
        const sessionParams = await travelPlanService.getSessionParameters(travel.created_from_session_id);
        
        if (sessionParams) {
          travelPlan = {
            ...travelPlan,
            originalParams: {
              title: sessionParams.title,
              destination: sessionParams.destination,
              startDate: sessionParams.start_date,
              endDate: sessionParams.end_date,
              duration: sessionParams.duration,
              peopleCount: sessionParams.people_count,
              budget: sessionParams.budget,
              travelStyle: sessionParams.travel_style,
              transportation: sessionParams.transportation,
              accommodation: sessionParams.accommodation
            }
          } as any;
        }
      }
      
      // 사용자에게 다운로드 형식 선택 제공
      const choice = window.confirm('PDF로 다운로드하시겠습니까?\n확인: PDF 프린트\n취소: 이미지 다운로드');
      
      if (choice) {
        // PDF 프린트
        printTravelPlan(travelPlan);
      } else {
        // 이미지 다운로드
        const imageBlob = await generateTravelPlanImage(travelPlan, 'png');
        const filename = `${travel.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_여행계획.png`;
        downloadBlob(imageBlob, filename);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">내 여행 관리</h2>
              <p className="text-sm text-gray-500 mt-1">생성한 여행 계획을 관리하고 수정할 수 있습니다</p>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 필터 */}
          <div className="px-6 py-4 border-b flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">상태별 필터:</span>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="draft">작성중</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 여행 목록 */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">여행 목록을 불러오는 중...</div>
              </div>
            ) : filteredTravels.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {statusFilter === 'all' ? '아직 생성한 여행 계획이 없습니다.' : '해당 상태의 여행 계획이 없습니다.'}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTravels.map((travel) => (
                  <div key={travel.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{travel.title}</h3>
                          <Badge variant={getStatusBadgeVariant(travel.status)}>
                            {getStatusText(travel.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{travel.destination}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{travel.duration}일</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{travel.people_count}명</span>
                          </div>
                          {travel.budget && (
                            <div className="flex items-center gap-1">
                              <Wallet className="h-4 w-4" />
                              <span>{(travel.budget / 10000).toFixed(0)}만원</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          생성일: {formatDate(travel.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Select 
                          value={travel.status} 
                          onValueChange={(value: any) => handleStatusChange(travel.id, value)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">작성중</SelectItem>
                            <SelectItem value="confirmed">확정</SelectItem>
                            <SelectItem value="completed">완료</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          title="상세보기"
                          onClick={() => setViewingTravel(travel)}
                        >
                          <Table className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          title="다운로드"
                          onClick={() => handleDownload(travel)}
                          disabled={isDownloading === travel.id}
                        >
                          <Download className={`h-4 w-4 ${isDownloading === travel.id ? 'animate-pulse' : ''}`} />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          title="수정"
                          onClick={() => setEditingTravelId(travel.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="삭제"
                          onClick={() => setDeleteConfirmId(travel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 하단 정보 */}
          <div className="p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              <strong>💡 사용 방법:</strong> 
              <span className="ml-2">각 여행 계획의 아이콘 버튼을 클릭하여 기능을 사용하세요.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>여행 계획을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 여행 계획과 관련된 모든 데이터가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 수정 모달 */}
      {editingTravelId && (
        <TravelEditModal
          isOpen={!!editingTravelId}
          onClose={() => setEditingTravelId(null)}
          travelId={editingTravelId}
          onUpdate={() => {
            loadTravels();
            setEditingTravelId(null);
          }}
        />
      )}

      {/* 상세보기 다이얼로그 */}
      <Dialog open={!!viewingTravel} onOpenChange={() => setViewingTravel(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {viewingTravel?.title} - 상세 일정표
            </DialogTitle>
            <DialogDescription>
              여행 계획의 상세 일정과 정보를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          {viewingTravel && (
            <EnrichedTravelPlanTableModal dbPlan={viewingTravel} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}