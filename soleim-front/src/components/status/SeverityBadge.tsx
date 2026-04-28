import { cn } from "@/lib/cn"
import type { SeveridadAlerta } from "@/types/enums"

type SeverityKey = SeveridadAlerta | "urgente"

const labels: Record<SeverityKey, string> = {
  urgente: "Urgente",
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
}

const styles: Record<SeverityKey, string> = {
  urgente: "bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)]",
  critica: "bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)]",
  alta: "bg-[var(--color-warning-50)] text-[var(--color-warning-600)] border-[var(--color-warning-200)]",
  media: "bg-[var(--color-solar-50)] text-[var(--color-solar-700)] border-[var(--color-solar-200)]",
  baja: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] border-[var(--color-neutral-200)]",
}

interface SeverityBadgeProps {
  severidad: SeveridadAlerta | string
  className?: string
}

export function SeverityBadge({ severidad, className }: SeverityBadgeProps) {
  const key = (severidad ?? "baja") as SeverityKey
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
        styles[key] ?? styles.baja,
        className
      )}
    >
      {labels[key] ?? severidad}
    </span>
  )
}
