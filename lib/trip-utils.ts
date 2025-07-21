import { supabase } from "@/lib/supabase"

// 날짜 범위 생성 함수
export function getDateRange(start: string, end: string): Date[] {
  const result: Date[] = []
  const current = new Date(start)
  const last = new Date(end)
  while (current <= last) {
    result.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return result
}

// 주소에서 위도/경도 가져오는 함수
export async function fetchLatLng(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error("Google Maps API Key is not set.")
    return null
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address,
  )}&key=${apiKey}&language=ko&region=KR`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location
      return { lat, lng }
    }
    console.warn(`Could not find coordinates for address: ${address}`, data)
    return null
  } catch (e) {
    console.error("Error fetching coordinates:", e)
    return null
  }
}

// 활동 데이터 타입 정의
export interface Activity {
  id: string
  travel_id: string
  date: string
  time_ampm: "AM" | "PM" | null
  time_hour: number | null
  time_minute: number | null
  location: string
  created_at: string
  updated_at: string
}

// 여행 데이터 타입 정의
export interface TripData {
  id: string
  title: string
  start_date: string
  end_date: string
  destination: string
  // created_at, version 등 다른 필드도 필요하면 추가
}

// Supabase에서 활동 데이터 가져오기
export async function fetchActivities(tripId: string): Promise<Activity[]> {
  const { data: acts, error: activitiesError } = await supabase
    .from("travel_activities")
    .select("id, travel_id, date, time_ampm, time_hour, time_minute, location, created_at, updated_at")
    .eq("travel_id", tripId)
    .order("date", { ascending: true })
    .order("time_hour", { ascending: true })

  if (activitiesError) throw activitiesError
  return acts || []
}

// Supabase에서 여행 데이터 가져오기
export async function fetchTripData(tripId: string): Promise<TripData | null> {
  const { data: trip, error: tripError } = await supabase.from("travel_schedule").select("*").eq("id", tripId).single()

  if (tripError) throw tripError
  return trip
}
