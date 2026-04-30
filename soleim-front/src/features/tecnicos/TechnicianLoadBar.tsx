import { cn } from "@/lib/cn"

interface TechnicianLoadBarProps {
  carga: number | null
  compact?: boolean
}

function loadPercent(carga: number | null) {
  if (carga == null) return 0
  return Math.min(100, Math.round((carga / 6) * 100))
}

export function TechnicianLoadBar({ carga, compact }: TechnicianLoadBarProps) {
  const percent = loadPercent(carga)
  const color =
    carga == null
      ? "bg-[var(--color-neutral-300)]"
      : carga <= 2
        ? "bg-[var(--color-energy-500)]"
        : carga <= 4
          ? "bg-[var(--color-warning-500)]"
          : "bg-[var(--color-danger-500)]"

  return (
    <div className={cn("min-w-32", compact && "min-w-24")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--color-text-muted)]">Carga</span>
        <span className="tabular text-xs font-semibold text-[var(--color-text-primary)]">
          {carga == null ? "N/D" : `${carga} órdenes`}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-neutral-200)]">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
