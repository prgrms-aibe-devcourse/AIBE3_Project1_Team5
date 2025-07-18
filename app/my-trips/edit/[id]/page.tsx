"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useJsApiLoader } from "@react-google-maps/api"
import { v4 as uuidv4 } from "uuid"

import { supabase } from "@/lib/supabase"
import {
  getDateRange,
  fetchLatLng,
  fetchActivities,
  fetchTripData,
  type Activity,
  type TripData,
} from "@/lib/trip-utils"

import { PageLoadingState, PageErrorState } from "@/components/trip-details/page-loading-error-states"
import { TripHeader } from "@/components/trip-details/trip-header"
import { TimelineSection } from "@/components/trip-details/timeline-section"
import { GoogleMapSection } from "@/components/trip-details/google-map-section"

const GOOGLE_MAP_LIBRARIES = ["places"]
const DEFAULT_CENTER = { lat: 33.450701, lng: 126.570667 } // 제주도 중심

export default function EditTripPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [tripData, setTripData] = useState<TripData | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(10)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDayForRoute, setSelectedDayForRoute] = useState<string | null>(null)
  const [mapMarkers, setMapMarkers] = useState<{
    [date: string]: Array<{ id: string; lat: number; lng: number; label: string }>
  }>({})
  const [mapKey, setMapKey] = useState(0) // GoogleMap 강제 리렌더용
  const [pageLoading, setPageLoading] = useState(true) // 페이지 전체 로딩 상태

  const mapRef = useRef<any | null>(null)
  const activitiesRef = useRef(activities) // 활동 상태의 최신 값을 참조하기 위함

  // 구글맵 로딩
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: GOOGLE_MAP_LIBRARIES as unknown as any[],
    language: "ko", // 한글로 표시
  })

  // 여행 정보 및 활동 fetch
  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true)
      try {
        const trip = await fetchTripData(tripId)
        if (!trip) throw new Error("Trip not found")
        setTripData(trip)

        const acts = await fetchActivities(tripId)
        setActivities(acts)

        // 목적지 중심으로 지도 이동
        if (trip?.destination) {
          const coords = await fetchLatLng(trip.destination)
          if (coords) setMapCenter(coords)
        }
      } catch (error: any) {
        console.error("Failed to fetch trip data:", error.message)
        setTripData(null) // 에러 발생 시 tripData를 null로 설정하여 에러 상태 표시
      } finally {
        setPageLoading(false)
      }
    }
    if (tripId) {
      fetchData()
    }
  }, [tripId])

  // 날짜 목록
  const days = useMemo(() => {
    if (!tripData?.start_date || !tripData?.end_date) return []
    return getDateRange(tripData.start_date, tripData.end_date)
  }, [tripData?.start_date, tripData?.end_date])

  // 선택된 날짜의 마커들
  const selectedDayMarkers = useMemo(() => {
    if (!selectedDayForRoute) return []
    return mapMarkers[selectedDayForRoute] || []
  }, [selectedDayForRoute, mapMarkers])

  // 경로 그리기 함수
  const handleDrawRoute = (date: string) => {
    setSelectedDayForRoute(date)

    const dayActivities = activities.filter((a) => a.date === date && a.location)
    const newMarkers: Array<{ id: string; lat: number; lng: number; label: string }> = []
    const fetchAndSetMarkers = async () => {
      for (const act of dayActivities) {
        const coords = await fetchLatLng(act.location)
        if (coords) {
          newMarkers.push({
            id: act.id,
            lat: coords.lat,
            lng: coords.lng,
            label: act.location,
          })
        }
      }
      setMapMarkers((prev) => ({
        ...prev,
        [date]: newMarkers,
      }))

      if (newMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        newMarkers.forEach((marker) => bounds.extend(new window.google.maps.LatLng(marker.lat, marker.lng)))
        if (mapRef.current) {
          mapRef.current.fitBounds(bounds)
        }
      } else if (tripData?.destination) {
        const coords = await fetchLatLng(tripData.destination)
        if (coords) setMapCenter(coords)
      }
    }
    fetchAndSetMarkers()
  }

  // 경로 그리기 취소
  const handleClearRoute = () => {
    setSelectedDayForRoute(null)
    setMapKey((k) => k + 1) // 지도 강제 리렌더
  }

  // 지도 클릭 핸들러 (현재는 사용되지 않음, 활동 위치 기반 마커 사용)
  const handleMapClick = (event: any) => {
    // 이 기능은 현재 활동 위치 기반 마커 생성으로 대체됨
    // 필요하다면 여기에 지도 클릭으로 마커를 추가하는 로직을 구현할 수 있습니다.
  }

  // 마커 삭제 함수 (활동 삭제 시 함께 처리)
  const handleDeleteMarker = (markerId: string) => {
    if (!selectedDayForRoute) return

    setMapMarkers((prev) => ({
      ...prev,
      [selectedDayForRoute]: prev[selectedDayForRoute]?.filter((marker) => marker.id !== markerId) || [],
    }))
  }

  // 마커 전체 삭제 함수
  const handleClearAllMarkers = () => {
    if (!selectedDayForRoute) return
    if (window.confirm("현재 날짜의 모든 마커를 삭제하시겠습니까?")) {
      setMapMarkers((prev) => ({
        ...prev,
        [selectedDayForRoute]: [],
      }))
      setMapKey((k) => k + 1) // 지도 강제 리렌더
    }
  }

  // 활동 추가
  const handleAddActivity = async (date: string) => {
    const newActivity: Activity = {
      id: uuidv4(),
      travel_id: tripId,
      date,
      time_ampm: "AM",
      time_hour: null,
      time_minute: null,
      location: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setActivities((prev) => [...prev, newActivity])
    setIsSaving(true)
    const { error } = await supabase.from("travel_activities").upsert([newActivity], { onConflict: "id" })
    setIsSaving(false)
    if (error) {
      console.error("Failed to add activity:", error.message)
      // 에러 처리 로직 추가
    } else {
      setHasUnsavedChanges(false)
    }
  }

  // 활동 수정
  const handleActivityChange = async (id: string, field: string, value: any) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value, updated_at: new Date().toISOString() } : a)),
    )
    setHasUnsavedChanges(true)

    // 즉시 저장 (디바운싱 없이)
    const updatedActivity = activitiesRef.current.find((a) => a.id === id)
    if (updatedActivity) {
      const payload = {
        ...updatedActivity,
        [field]: value,
        updated_at: new Date().toISOString(),
      }
      setIsSaving(true)
      const { error } = await supabase.from("travel_activities").upsert([payload], { onConflict: "id" })
      setIsSaving(false)
      if (error) {
        console.error("Failed to update activity:", error.message)
        // 에러 처리 로직 추가
      } else {
        setHasUnsavedChanges(false)

        // 위치가 변경되면 지도 마커 업데이트
        if (field === "location" && selectedDayForRoute === updatedActivity.date) {
          handleDrawRoute(updatedActivity.date)
        }
      }
    }
  }

  // 활동 삭제
  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm("정말로 이 활동을 삭제하시겠습니까?")) {
      return
    }
    // UI에서 먼저 삭제
    setActivities((prev) => prev.filter((a) => a.id !== id))
    // supabase에서 삭제
    const { error } = await supabase.from("travel_activities").delete().eq("id", id)
    if (error) {
      alert("삭제에 실패했습니다. 다시 시도해 주세요.")
      // 실제 구현에서는 fetchActivities 함수를 다시 호출하여 상태 동기화
      window.location.reload()
    } else {
      // 마커도 삭제
      setMapMarkers((prev) => {
        const newMarkers = { ...prev }
        for (const date in newMarkers) {
          newMarkers[date] = newMarkers[date].filter((marker) => marker.id !== id)
        }
        return newMarkers
      })
    }
  }

  // activities 상태가 변경될 때마다 activitiesRef 업데이트
  useEffect(() => {
    activitiesRef.current = activities
  }, [activities])

  if (pageLoading) {
    return <PageLoadingState />
  }

  if (!tripData) {
    return <PageErrorState />
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* 왼쪽: 정보 + 타임라인 */}
      <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 bg-white shadow-lg h-screen overflow-y-auto">
        <TripHeader tripData={tripData} />
        <TimelineSection
          days={days}
          activities={activities}
          selectedDayForRoute={selectedDayForRoute}
          mapMarkers={mapMarkers}
          onDrawRoute={handleDrawRoute}
          onClearRoute={handleClearRoute}
          onClearAllMarkers={handleClearAllMarkers}
          onAddActivity={handleAddActivity}
          onActivityChange={handleActivityChange}
          onDeleteActivity={handleDeleteActivity}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </div>

      {/* 오른쪽: 구글지도 공간 */}
      <GoogleMapSection
        isLoaded={isLoaded}
        loadError={loadError}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        mapKey={mapKey}
        selectedDayMarkers={selectedDayMarkers}
        mapRef={mapRef}
        setMapZoom={setMapZoom}
        handleMapClick={handleMapClick}
        handleDeleteMarker={handleDeleteMarker}
      />
    </div>
  )
}
