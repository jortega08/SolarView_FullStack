import { cn } from "@/lib/cn"
import type { EstadoOrden } from "@/types/enums"

const labels: Record<EstadoOrden, string> = {
  abierta: "Abierta",
  asignada: "Asignada",
  en_progreso: "En progreso",
  completada: "Completada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
}

const styles: Record<EstadoOrden, string> = {
  abierta:
    "bg-[var(--color-solar-50)] text-[var(--color-solar-700)] border-[var(--color-solar-200)]",
  asignada:
    "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-200)]",
  en_progreso:
    "bg-[var(--color-warning-50)] text-[var(--color-warning-600)] border-[var(--color-warning-200)]",
  completada:
    "bg-[var(--color-energy-50)] text-[var(--color-energy-700)] border-[var(--color-energy-200)]",
  cerrada:
    "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] border-[var(--color-neutral-200)]",
  cancelada:
    "bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)]",
}

interface OrdenEstadoBadgeProps {
  estado: EstadoOrden | string
  className?: string
}

export function OrdenEstadoBadge({ estado, className }: OrdenEstadoBadgeProps) {
  const key = (estado ?? "abierta") as EstadoOrden
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[key] ?? styles.abierta,
        className
      )}
    >
      {labels[key] ?? estado}
    </span>
  )
}
