import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface SaveStatusIndicatorProps {
  isSaving: boolean
  hasUnsavedChanges: boolean
}

export function SaveStatusIndicator({ isSaving, hasUnsavedChanges }: SaveStatusIndicatorProps) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-orange-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">저장 중...</span>
      </div>
    )
  }
  if (!hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">저장 완료</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-yellow-600">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-sm font-medium">저장되지 않은 변경사항</span>
    </div>
  )
}
