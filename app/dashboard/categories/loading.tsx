import { Skeleton } from "@/components/ui/skeleton"

export default function CategoriesLoading() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}
