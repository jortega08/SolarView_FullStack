import { cn } from "@/lib/cn"
import type { MantenimientoProgramado } from "@/types/domain"
import type { EstadoMantenimiento } from "@/types/enums"
import {
  ESTADO_MANTENIMIENTO_LABEL,
  ESTADO_MANTENIMIENTO_STYLES,
  getDisplayEstado,
} from "./maintenanceUtils"

interface MaintenanceStatusBadgeProps {
  mantenimiento?: MantenimientoProgramado
  estado?: EstadoMantenimiento
  className?: string
}

export function MaintenanceStatusBadge({
  mantenimiento,
  estado,
  className,
}: MaintenanceStatusBadgeProps) {
  const key = mantenimiento ? getDisplayEstado(mantenimiento) : estado ?? "programado"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        ESTADO_MANTENIMIENTO_STYLES[key],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {ESTADO_MANTENIMIENTO_LABEL[key]}
    </span>
  )
}
