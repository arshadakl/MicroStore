import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="border border-border rounded-lg p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
