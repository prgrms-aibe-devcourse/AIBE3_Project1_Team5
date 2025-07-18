"use client"

import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Frown } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageLoadingStateProps {
  message?: string
}

export function PageLoadingState({ message = "여행 정보를 불러오는 중..." }: PageLoadingStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      <span className="ml-4 text-xl text-gray-600">{message}</span>
    </div>
  )
}

interface PageErrorStateProps {
  message?: string
  description?: string
  showBackButton?: boolean
}

export function PageErrorState({
  message = "여행 정보를 찾을 수 없습니다.",
  description = "잘못된 접근이거나 삭제된 여행 일정일 수 있습니다.",
  showBackButton = true,
}: PageErrorStateProps) {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 text-center shadow-lg">
        <Frown className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <CardTitle className="text-2xl font-bold text-red-600 mb-4">{message}</CardTitle>
        <CardDescription className="text-gray-600 mb-6">{description}</CardDescription>
        {showBackButton && <Button onClick={() => router.push("/my-trips")}>내 여행 목록으로 돌아가기</Button>}
      </Card>
    </div>
  )
}
