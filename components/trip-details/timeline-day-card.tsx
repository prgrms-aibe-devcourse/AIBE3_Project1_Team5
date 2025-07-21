"use client"
import { Button } from "@/components/ui/button"
import { Plus, Route, EyeOff, Eraser, Map } from "lucide-react"
import { ActivityInputCard } from "./activity-input-card"
import type { Activity } from "@/lib/trip-utils"

interface TimelineDayCardProps {
  dateStr: string
  dayIdx: number
  activities: Activity[]
  isRouteSelected: boolean
  dayMarkers: Array<{ id: string; lat: number; lng: number; label: string }>
  onDrawRoute: (date: string) => void
  onClearRoute: () => void
  onClearAllMarkers: () => void
  onAddActivity: (date: string) => void
  onActivityChange: (id: string, field: string, value: any) => void
  onDeleteActivity: (id: string) => void
}

export function TimelineDayCard({
  dateStr,
  dayIdx,
  activities,
  isRouteSelected,
  dayMarkers,
  onDrawRoute,
  onClearRoute,
  onClearAllMarkers,
  onAddActivity,
  onActivityChange,
  onDeleteActivity,
}: TimelineDayCardProps) {
  const sortedActivities = activities
    .filter((a) => a.date === dateStr)
    .sort((a: Activity, b: Activity) => {
      const timeA =
        (a.time_ampm === "PM" && a.time_hour !== 12 ? a.time_hour + 12 : a.time_hour || 0) * 60 + (a.time_minute || 0)
      const timeB =
        (b.time_ampm === "PM" && b.time_hour !== 12 ? b.time_hour + 12 : b.time_hour || 0) * 60 + (b.time_minute || 0)
      return timeA - timeB
    })

  return (
    <div className="border border-blue-200 rounded-xl p-5 bg-blue-50 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold text-blue-800">
            Day {dayIdx + 1} - {dateStr}
          </div>
          {isRouteSelected && (
            <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
              <Map className="h-4 w-4" />
              경로 표시 중 ({dayMarkers.length}개 마커)
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isRouteSelected ? (
            <>
              <Button size="sm" variant="destructive" onClick={onClearRoute}>
                <EyeOff className="h-4 w-4 mr-2" />
                경로 숨기기
              </Button>
              <Button size="sm" variant="outline" onClick={onClearAllMarkers}>
                <Eraser className="h-4 w-4 mr-2" />
                마커 전체 지우기
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onDrawRoute(dateStr)}>
              <Route className="h-4 w-4 mr-2" />
              경로 그려보기
            </Button>
          )}
          <Button size="sm" onClick={() => onAddActivity(dateStr)}>
            <Plus className="h-4 w-4 mr-2" />
            활동 추가
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {sortedActivities.length === 0 ? (
          <div className="text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-md">
            <p>이 날짜에 활동이 없습니다. 활동을 추가해보세요!</p>
          </div>
        ) : (
          sortedActivities.map((act) => (
            <ActivityInputCard
              key={act.id}
              activity={act}
              onActivityChange={onActivityChange}
              onDeleteActivity={onDeleteActivity}
            />
          ))
        )}
      </div>
    </div>
  )
}
