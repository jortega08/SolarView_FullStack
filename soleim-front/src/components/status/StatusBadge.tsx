import { cn } from "@/lib/cn"
import type { EstadoInstalacion } from "@/types/enums"

const labels: Record<EstadoInstalacion, string> = {
  activa: "En línea",
  inactiva: "Inactiva",
  mantenimiento: "Mantenimiento",
  error: "Error",
}

const styles: Record<EstadoInstalacion, string> = {
  activa: "bg-[var(--color-energy-50)] text-[var(--color-energy-700)] border-[var(--color-energy-200)]",
  inactiva: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] border-[var(--color-neutral-200)]",
  mantenimiento: "bg-[var(--color-solar-50)] text-[var(--color-solar-700)] border-[var(--color-solar-200)]",
  error: "bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)]",
}

interface StatusBadgeProps {
  estado: EstadoInstalacion | string
  className?: string
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  const key = (estado ?? "inactiva") as EstadoInstalacion
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[key] ?? styles.inactiva,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          key === "activa" ? "bg-[var(--color-energy-500)] animate-pulse" : "bg-current opacity-60"
        )}
      />
      {labels[key] ?? estado}
    </span>
  )
}
