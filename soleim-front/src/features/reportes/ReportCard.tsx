import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

interface ReportCardProps {
  title: string
  description: string
  formats: string[]
  icon: LucideIcon
  tone: "primary" | "energy" | "danger" | "solar" | "sla"
  lastGenerated?: string
  action?: ReactNode
}

const toneClasses = {
  primary: "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
  energy: "bg-[var(--color-energy-50)] text-[var(--color-energy-700)]",
  danger: "bg-[var(--color-danger-50)] text-[var(--color-danger-700)]",
  solar: "bg-[var(--color-solar-50)] text-[var(--color-solar-700)]",
  sla: "bg-[var(--color-sla-50)] text-[var(--color-sla-700)]",
}

export function ReportCard({
  title,
  description,
  formats,
  icon: Icon,
  tone,
  lastGenerated,
  action,
}: ReportCardProps) {
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)]", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {formats.map((format) => (
          <span
            key={format}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]"
          >
            {format}
          </span>
        ))}
      </div>

      <div className="mt-4 border-t border-[var(--color-border)] pt-3">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Última generación: <span className="font-medium text-[var(--color-text-secondary)]">{lastGenerated ?? "No disponible"}</span>
        </p>
      </div>

      {action && <div className="mt-4">{action}</div>}
    </article>
  )
}
