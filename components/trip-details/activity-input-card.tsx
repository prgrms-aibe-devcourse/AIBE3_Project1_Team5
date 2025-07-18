"use client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Activity } from "@/lib/trip-utils"

interface ActivityInputCardProps {
  activity: Activity
  onActivityChange: (id: string, field: string, value: any) => void
  onDeleteActivity: (id: string) => void
}

export function ActivityInputCard({ activity, onActivityChange, onDeleteActivity }: ActivityInputCardProps) {
  return (
    <Card className="p-4 bg-white shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={activity.time_ampm || ""}
            onChange={(e) => onActivityChange(activity.id, "time_ampm", e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="AM">오전</option>
            <option value="PM">오후</option>
          </select>
          <select
            value={activity.time_hour || ""}
            onChange={(e) => onActivityChange(activity.id, "time_hour", Number.parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">시</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="text-gray-600 text-sm">시</span>
          <select
            value={activity.time_minute || ""}
            onChange={(e) => onActivityChange(activity.id, "time_minute", Number.parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">분</option>
            {[0, 10, 20, 30, 40, 50].map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
          <span className="text-gray-600 text-sm">분</span>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="활동 장소를 자세히 입력해주세요! (예: [지역] 유성불백)"
            value={activity.location || ""}
            onChange={(e) => onActivityChange(activity.id, "location", e.target.value)}
            className="w-full text-base px-3 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDeleteActivity(activity.id)}
          className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
