import { cn } from "@/lib/cn"
import { ChartSkeleton } from "@/components/feedback/LoadingSkeleton"
import { ErrorState } from "@/components/feedback/ErrorState"

interface ChartCardProps {
  title: string
  subtitle?: string
  toolbar?: React.ReactNode
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function ChartCard({
  title,
  subtitle,
  toolbar,
  loading,
  error,
  onRetry,
  children,
  className,
  bodyClassName,
}: ChartCardProps) {
  if (loading) return <ChartSkeleton className={className} />

  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>
      <div className={cn("p-4", bodyClassName)}>
        {error ? <ErrorState onRetry={onRetry} /> : children}
      </div>
    </div>
  )
}
