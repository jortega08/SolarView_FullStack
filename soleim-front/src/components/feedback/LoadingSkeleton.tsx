import { cn } from "@/lib/cn"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--color-neutral-200)]",
        className
      )}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)]", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-48 w-full rounded-md" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}
