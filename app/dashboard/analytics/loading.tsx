import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  )
}
