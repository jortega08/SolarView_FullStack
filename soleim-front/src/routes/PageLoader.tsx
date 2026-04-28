import { Skeleton } from "@/components/feedback/LoadingSkeleton"

export function PageLoader() {
  return (
    <div className="p-5 space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
