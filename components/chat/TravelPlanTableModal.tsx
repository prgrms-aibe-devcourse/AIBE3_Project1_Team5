import React from 'react';
import { Calendar, MapPin, Users, DollarSign, Clock, AlertTriangle, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TravelPlan, ImprovedDaySchedule, ImprovedScheduleItem } from '@/lib/openai';

interface TravelPlanTableModalProps {
  plan: TravelPlan;
}

export default function TravelPlanTableModal({ plan }: TravelPlanTableModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '✅': return 'text-green-600 bg-green-50';
      case '❌': return 'text-red-600 bg-red-50';
      case '🔜': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* 여행 개요 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            📌 여행 개요
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 bg-gray-50 px-4 py-2 font-medium">항목</td>
                  <td className="border-r border-gray-300 bg-gray-50 px-4 py-2 font-medium">내용</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-4 py-2 font-medium">여행 일정</td>
                  <td className="border-r border-gray-300 px-4 py-2">{plan.overview?.dates}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-4 py-2 font-medium">인원</td>
                  <td className="border-r border-gray-300 px-4 py-2">{plan.overview?.people}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-4 py-2 font-medium">교통</td>
                  <td className="border-r border-gray-300 px-4 py-2">{plan.overview?.transportation}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-4 py-2 font-medium">숙소</td>
                  <td className="border-r border-gray-300 px-4 py-2">{plan.overview?.accommodation}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 px-4 py-2 font-medium">여행 테마</td>
                  <td className="border-r border-gray-300 px-4 py-2">{plan.overview?.theme}</td>
                </tr>
                <tr>
                  <td className="border-r border-gray-300 px-4 py-2 font-medium">총 예상 예산</td>
                  <td className="border-r border-gray-300 px-4 py-2 font-semibold text-blue-600">{plan.overview?.budgetRange}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 일별 상세 일정 */}
      {plan.schedule.map((day: ImprovedDaySchedule, dayIndex: number) => (
        <Card key={dayIndex}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              📅 {day.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">시간</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">일정</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {day.items.map((item: ImprovedScheduleItem, itemIndex: number) => (
                    <tr key={itemIndex} className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-4 py-2 font-mono text-blue-600 font-medium">
                        {item.time}
                      </td>
                      <td className="border-r border-gray-300 px-4 py-2">
                        <div className="flex items-start gap-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <div>
                            <div className="font-medium">{item.activity}</div>
                            <div className="text-sm text-gray-600">{item.location}</div>
                            {item.duration && (
                              <div className="text-xs text-gray-500">소요시간: {item.duration}</div>
                            )}
                            {item.transportation && (
                              <div className="text-xs text-blue-600">이동: {item.transportation}</div>
                            )}
                            {item.cost > 0 && (
                              <div className="text-sm font-medium text-green-600">
                                {formatCurrency(item.cost)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="border-r border-gray-300 px-4 py-2 text-sm text-gray-600">
                        {item.note || '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50">
                    <td colSpan={2} className="border-r border-gray-300 px-4 py-2 font-semibold">
                      일일 총 비용
                    </td>
                    <td className="border-r border-gray-300 px-4 py-2 font-semibold text-blue-600">
                      {formatCurrency(day.totalCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 식사 요약 */}
      {plan.mealSummary && plan.mealSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🍽️ 식사 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">구분</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">식당명</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">상태</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">예상 비용</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.mealSummary.map((meal, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="border-r border-gray-300 px-4 py-2">{meal.day} {meal.meal}</td>
                      <td className="border-r border-gray-300 px-4 py-2 font-medium">{meal.restaurant}</td>
                      <td className="border-r border-gray-300 px-4 py-2">
                        <Badge variant={meal.status.includes('✅') ? 'default' : 'secondary'}>
                          {meal.status}
                        </Badge>
                      </td>
                      <td className="border-r border-gray-300 px-4 py-2 text-green-600 font-medium">
                        {formatCurrency(meal.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 비용 분석 */}
      {plan.costBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              💰 비용 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-medium">항목</th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-medium">금액</th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-medium">비율</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-4 py-2">교통비</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">{formatCurrency(plan.costBreakdown.transportation)}</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">
                      {((plan.costBreakdown.transportation / plan.costBreakdown.total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-4 py-2">숙박비</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">{formatCurrency(plan.costBreakdown.accommodation)}</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">
                      {((plan.costBreakdown.accommodation / plan.costBreakdown.total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-4 py-2">식비</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">{formatCurrency(plan.costBreakdown.meals)}</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">
                      {((plan.costBreakdown.meals / plan.costBreakdown.total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-4 py-2">액티비티</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">{formatCurrency(plan.costBreakdown.activities)}</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">
                      {((plan.costBreakdown.activities / plan.costBreakdown.total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="border-r border-gray-300 px-4 py-2">기타</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">{formatCurrency(plan.costBreakdown.others)}</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">
                      {((plan.costBreakdown.others / plan.costBreakdown.total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold">
                    <td className="border-r border-gray-300 px-4 py-2">총 비용</td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right text-blue-600">
                      {formatCurrency(plan.costBreakdown.total)}
                    </td>
                    <td className="border-r border-gray-300 px-4 py-2 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 여행 팁 */}
      {plan.tips && plan.tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 여행 팁
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <span className="text-amber-600 mt-1">•</span>
                  <span className="text-amber-800">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 준비사항 */}
      {plan.requirements && plan.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              📋 준비사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-red-800">{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 응급 연락처 */}
      {plan.emergencyInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-red-600" />
              🚨 응급 연락처
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h5 className="font-semibold text-red-800 mb-1">병원</h5>
                <p className="text-sm text-red-700">{plan.emergencyInfo.hospital}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h5 className="font-semibold text-blue-800 mb-1">경찰서</h5>
                <p className="text-sm text-blue-700">{plan.emergencyInfo.police}</p>
              </div>
              {plan.emergencyInfo.embassy && (
                <div className="p-3 bg-green-50 border border-green-200 rounded md:col-span-2">
                  <h5 className="font-semibold text-green-800 mb-1">영사관</h5>
                  <p className="text-sm text-green-700">{plan.emergencyInfo.embassy}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}