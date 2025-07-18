import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock } from "lucide-react"
import { TimelineDayCard } from "./timeline-day-card"
import { SaveStatusIndicator } from "./save-status-indicator"
import type { Activity } from "@/lib/trip-utils"

interface TimelineSectionProps {
  days: Date[]
  activities: Activity[]
  selectedDayForRoute: string | null
  mapMarkers: { [date: string]: Array<{ id: string; lat: number; lng: number; label: string }> }
  onDrawRoute: (date: string) => void
  onClearRoute: () => void
  onClearAllMarkers: () => void
  onAddActivity: (date: string) => void
  onActivityChange: (id: string, field: string, value: any) => void
  onDeleteActivity: (id: string) => void
  isSaving: boolean
  hasUnsavedChanges: boolean
}

export function TimelineSection({
  days,
  activities,
  selectedDayForRoute,
  mapMarkers,
  onDrawRoute,
  onClearRoute,
  onClearAllMarkers,
  onAddActivity,
  onActivityChange,
  onDeleteActivity,
  isSaving,
  hasUnsavedChanges,
}: TimelineSectionProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Card className="shadow-md border-none">
        <CardHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="h-6 w-6 text-purple-600" />
            일정 타임라인
          </CardTitle>
          <SaveStatusIndicator isSaving={isSaving} hasUnsavedChanges={hasUnsavedChanges} />
        </CardHeader>
        <CardContent className="pt-6">
          {days.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>여행 기간이 설정되지 않았습니다.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {days.map((d, dayIdx) => {
                const dateStr = d.toISOString().slice(0, 10)
                return (
                  <TimelineDayCard
                    key={dateStr}
                    dateStr={dateStr}
                    dayIdx={dayIdx}
                    activities={activities}
                    isRouteSelected={selectedDayForRoute === dateStr}
                    dayMarkers={mapMarkers[dateStr] || []}
                    onDrawRoute={onDrawRoute}
                    onClearRoute={onClearRoute}
                    onClearAllMarkers={onClearAllMarkers}
                    onAddActivity={onAddActivity}
                    onActivityChange={onActivityChange}
                    onDeleteActivity={onDeleteActivity}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
