import { cn } from "@/lib/cn"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-[var(--color-neutral-400)]" />
        </div>
      )}
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{title}</p>
      {description && <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
