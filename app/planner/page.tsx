"use client"

import { useState } from "react"
import { Calendar, MapPin, Clock, Wand2, Plus, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PlannerPage() {
  const [planType, setPlanType] = useState<"manual" | "ai">("manual")

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">여행 일정 계획</h1>
          <p className="text-gray-600">직접 계획하거나 AI의 도움을 받아 완벽한 여행을 만들어보세요</p>
        </div>

        <Tabs value={planType} onValueChange={(value) => setPlanType(value as "manual" | "ai")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4" />
              <span>직접 계획</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Wand2 className="h-4 w-4" />
              <span>AI 계획</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <ManualPlanner />
          </TabsContent>

          <TabsContent value="ai">
            <AIPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ManualPlanner() {
  const [itinerary, setItinerary] = useState([
    { id: 1, day: 1, time: "09:00", activity: "호텔 체크아웃", location: "명동", notes: "" },
    { id: 2, day: 1, time: "10:00", activity: "경복궁 관람", location: "종로구", notes: "가이드 투어 예약됨" },
  ])

  const addActivity = () => {
    const newActivity = {
      id: Date.now(),
      day: 1,
      time: "12:00",
      activity: "",
      location: "",
      notes: "",
    }
    setItinerary([...itinerary, newActivity])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trip Details */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>여행 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="destination">목적지</Label>
              <Input id="destination" placeholder="예: 서울, 제주도" />
            </div>
            <div>
              <Label htmlFor="dates">여행 기간</Label>
              <Input id="dates" type="date" />
            </div>
            <div>
              <Label htmlFor="travelers">여행자 수</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="인원 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1명</SelectItem>
                  <SelectItem value="2">2명</SelectItem>
                  <SelectItem value="3-4">3-4명</SelectItem>
                  <SelectItem value="5+">5명 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget">예산</Label>
              <Input id="budget" placeholder="예: 500,000원" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itinerary */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>여행 일정</CardTitle>
              <CardDescription>하루별 세부 일정을 계획해보세요</CardDescription>
            </div>
            <Button onClick={addActivity} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              활동 추가
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {itinerary.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">시간</Label>
                      <Input
                        type="time"
                        value={item.time}
                        onChange={(e) => {
                          setItinerary(itinerary.map((i) => (i.id === item.id ? { ...i, time: e.target.value } : i)))
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">활동</Label>
                      <Input
                        value={item.activity}
                        placeholder="활동 내용"
                        onChange={(e) => {
                          setItinerary(
                            itinerary.map((i) => (i.id === item.id ? { ...i, activity: e.target.value } : i)),
                          )
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">장소</Label>
                      <Input
                        value={item.location}
                        placeholder="위치"
                        onChange={(e) => {
                          setItinerary(
                            itinerary.map((i) => (i.id === item.id ? { ...i, location: e.target.value } : i)),
                          )
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">메모</Label>
                      <Input
                        value={item.notes}
                        placeholder="메모"
                        onChange={(e) => {
                          setItinerary(itinerary.map((i) => (i.id === item.id ? { ...i, notes: e.target.value } : i)))
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline">임시저장</Button>
              <Button>일정 저장</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AIPlanner() {
  const [preferences, setPreferences] = useState({
    destination: "",
    duration: "",
    budget: "",
    interests: "",
    travelStyle: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)

  const generatePlan = async () => {
    setIsGenerating(true)
    // AI 계획 생성 시뮬레이션
    setTimeout(() => {
      setGeneratedPlan({
        destination: preferences.destination,
        days: [
          {
            day: 1,
            title: "도착 및 시내 탐방",
            activities: [
              { time: "10:00", activity: "공항 도착", location: "인천국제공항" },
              { time: "12:00", activity: "호텔 체크인", location: "명동" },
              { time: "14:00", activity: "점심식사", location: "명동교자" },
              { time: "16:00", activity: "경복궁 관람", location: "종로구" },
            ],
          },
          {
            day: 2,
            title: "문화 체험의 날",
            activities: [
              { time: "09:00", activity: "아침식사", location: "호텔" },
              { time: "10:00", activity: "북촌한옥마을", location: "종로구" },
              { time: "13:00", activity: "인사동 탐방", location: "인사동" },
              { time: "18:00", activity: "한강 공원", location: "여의도" },
            ],
          },
        ],
      })
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {!generatedPlan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wand2 className="h-5 w-5 mr-2 text-purple-600" />
              AI 여행 계획 생성
            </CardTitle>
            <CardDescription>선호사항을 알려주시면 AI가 맞춤형 여행 계획을 생성해드립니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ai-destination">목적지</Label>
                <Input
                  id="ai-destination"
                  placeholder="예: 제주도, 부산, 교토"
                  value={preferences.destination}
                  onChange={(e) => setPreferences({ ...preferences, destination: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ai-duration">여행 기간</Label>
                <Select onValueChange={(value) => setPreferences({ ...preferences, duration: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="기간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2일</SelectItem>
                    <SelectItem value="3-4">3-4일</SelectItem>
                    <SelectItem value="5-7">5-7일</SelectItem>
                    <SelectItem value="7+">일주일 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ai-budget">예산 범위</Label>
                <Select onValueChange={(value) => setPreferences({ ...preferences, budget: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="예산 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">50만원 이하</SelectItem>
                    <SelectItem value="medium">50-100만원</SelectItem>
                    <SelectItem value="high">100만원 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ai-style">여행 스타일</Label>
                <Select onValueChange={(value) => setPreferences({ ...preferences, travelStyle: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="스타일 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relaxed">여유로운</SelectItem>
                    <SelectItem value="adventure">모험적인</SelectItem>
                    <SelectItem value="cultural">문화 중심</SelectItem>
                    <SelectItem value="food">맛집 탐방</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="ai-interests">관심사 및 특별 요청</Label>
              <Textarea
                id="ai-interests"
                placeholder="예: 사진 촬영 명소, 현지 음식 체험, 역사적 장소 방문 등"
                value={preferences.interests}
                onChange={(e) => setPreferences({ ...preferences, interests: e.target.value })}
              />
            </div>
            <Button onClick={generatePlan} disabled={isGenerating || !preferences.destination} className="w-full">
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  AI가 계획을 생성하고 있습니다...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI 여행 계획 생성하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI 생성 여행 계획</span>
                <Button variant="outline" onClick={() => setGeneratedPlan(null)}>
                  다시 생성
                </Button>
              </CardTitle>
              <CardDescription>{generatedPlan.destination} 여행 계획이 생성되었습니다</CardDescription>
            </CardHeader>
          </Card>

          {generatedPlan.days.map((day: any) => (
            <Card key={day.day}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Day {day.day}: {day.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {day.activities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 min-w-[60px]">
                        <Clock className="h-4 w-4" />
                        <span>{activity.time}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.activity}</h4>
                        <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{activity.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end space-x-2">
            <Button variant="outline">수정하기</Button>
            <Button>계획 저장</Button>
          </div>
        </div>
      )}
    </div>
  )
}
