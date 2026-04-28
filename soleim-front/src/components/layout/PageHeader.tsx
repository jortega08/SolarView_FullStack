import { cn } from "@/lib/cn"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--color-primary-600)] mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg font-semibold leading-tight text-[var(--color-text-primary)]">{title}</h2>
        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  )
}
