import { cn } from "@/lib/cn"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { MetricCardSkeleton } from "@/components/feedback/LoadingSkeleton"
import { ErrorState } from "@/components/feedback/ErrorState"

interface MetricCardProps {
  title: string
  value: string
  delta?: string
  deltaPositive?: boolean
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  className?: string
}

export function MetricCard({
  title,
  value,
  delta,
  deltaPositive,
  icon: Icon,
  iconColor = "text-[var(--color-primary-600)]",
  iconBg = "bg-[var(--color-primary-50)]",
  loading,
  error,
  onRetry,
  className,
}: MetricCardProps) {
  if (loading) return <MetricCardSkeleton />
  if (error) return (
    <div className={cn("bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]", className)}>
      <ErrorState onRetry={onRetry} />
    </div>
  )

  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)]",
        "border border-[var(--color-border)] hover:shadow-[var(--shadow-card-hover)] transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide leading-tight">
          {title}
        </p>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
            <Icon className={cn("w-4.5 h-4.5", iconColor)} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular leading-none mb-2">{value}</p>
      {delta && (
        <div className="flex items-center gap-1">
          {deltaPositive === true ? (
            <TrendingUp className="w-3 h-3 text-[var(--color-energy-600)]" />
          ) : deltaPositive === false ? (
            <TrendingDown className="w-3 h-3 text-[var(--color-danger-600)]" />
          ) : (
            <Minus className="w-3 h-3 text-[var(--color-neutral-400)]" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              deltaPositive === true
                ? "text-[var(--color-energy-600)]"
                : deltaPositive === false
                ? "text-[var(--color-danger-600)]"
                : "text-[var(--color-neutral-500)]"
            )}
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  )
}
