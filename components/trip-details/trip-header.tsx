import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlaneTakeoff, CalendarDays, MapPin } from "lucide-react"
import type { TripData } from "@/lib/trip-utils"

interface TripHeaderProps {
  tripData: TripData
}

export function TripHeader({ tripData }: TripHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-20">
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <PlaneTakeoff className="h-8 w-8 text-blue-600" />
            {tripData.title}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-1">{tripData.destination} 여행 계획 상세</CardDescription>
        </CardHeader>
        <CardContent className="text-gray-700 text-base space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gray-500" />
            <span>
              {tripData.start_date} ~ {tripData.end_date}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <span>{tripData.destination}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
