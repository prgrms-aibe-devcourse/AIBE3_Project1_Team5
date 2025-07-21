"use client"

import type React from "react"
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"

interface GoogleMapSectionProps {
  isLoaded: boolean
  loadError: Error | undefined
  mapCenter: { lat: number; lng: number }
  mapZoom: number
  mapKey: number
  selectedDayMarkers: Array<{ id: string; lat: number; lng: number; label: string }>
  mapRef: React.MutableRefObject<any | null>
  setMapZoom: (zoom: number) => void
  handleMapClick: (event: any) => void
  handleDeleteMarker: (markerId: string) => void
}

export function GoogleMapSection({
  isLoaded,
  loadError,
  mapCenter,
  mapZoom,
  mapKey,
  selectedDayMarkers,
  mapRef,
  setMapZoom,
  handleMapClick,
  handleDeleteMarker,
}: GoogleMapSectionProps) {
  return (
    <div className="w-full lg:w-1/2 flex flex-col bg-gray-200 h-screen sticky top-0">
      <div className="flex-1 flex items-center justify-center relative p-6">
        <Card className="w-full h-full shadow-xl border-none overflow-hidden">
          <CardContent className="p-0 w-full h-full">
            {isLoaded ? (
              <GoogleMap
                key={mapKey}
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={mapZoom}
                onLoad={(map) => {
                  mapRef.current = map
                }}
                onZoomChanged={() => {
                  if (mapRef.current) {
                    setMapZoom(mapRef.current.getZoom() || 10)
                  }
                }}
                onClick={handleMapClick}
              >
                {selectedDayMarkers.map((marker) => (
                  <Marker
                    key={marker.id}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    label={{
                      text: marker.label,
                      color: "#333333",
                      fontSize: "14px",
                      fontWeight: "bold",
                      className: "mt-[-30px]", // 마커 라벨 위치 조정
                    }}
                    onClick={() => handleDeleteMarker(marker.id)}
                  />
                ))}
                {selectedDayMarkers.length > 1 && (
                  <Polyline
                    path={selectedDayMarkers.map((marker) => ({ lat: marker.lat, lng: marker.lng }))}
                    options={{
                      strokeColor: "#4F46E5",
                      strokeOpacity: 0.8,
                      strokeWeight: 4,
                      geodesic: true,
                    }}
                  />
                )}
              </GoogleMap>
            ) : loadError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-red-500 text-center p-4">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold mb-2">지도를 불러올 수 없습니다.</p>
                <p className="text-sm">Google Maps API 키를 확인하거나 네트워크 연결을 확인해주세요.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-lg">지도를 불러오는 중...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
