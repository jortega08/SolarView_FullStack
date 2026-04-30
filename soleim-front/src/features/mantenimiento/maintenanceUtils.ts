import type { EstadoMantenimiento, TipoMantenimiento } from "@/types/enums"
import type { MantenimientoProgramado } from "@/types/domain"

export const ESTADO_MANTENIMIENTO_LABEL: Record<EstadoMantenimiento, string> = {
  programado: "Programado",
  en_proceso: "En proceso",
  en_progreso: "En progreso",
  completado: "Completado",
  vencido: "Vencido",
  cancelado: "Cancelado",
}

export const TIPO_MANTENIMIENTO_LABEL: Record<TipoMantenimiento, string> = {
  preventivo: "Preventivo",
  correctivo: "Correctivo",
  inspeccion: "Inspección",
  instalacion: "Instalación",
  revision: "Revisión",
}

export const ESTADO_MANTENIMIENTO_STYLES: Record<EstadoMantenimiento, string> = {
  programado: "border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
  en_proceso: "border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-600)]",
  en_progreso: "border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-600)]",
  completado: "border-[var(--color-energy-200)] bg-[var(--color-energy-50)] text-[var(--color-energy-700)]",
  vencido: "border-[var(--color-danger-100)] bg-[var(--color-danger-50)] text-[var(--color-danger-700)]",
  cancelado: "border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]",
}

export const ESTADO_MANTENIMIENTO_COLORS: Record<EstadoMantenimiento, string> = {
  programado: "var(--color-primary-500)",
  en_proceso: "var(--color-warning-500)",
  en_progreso: "var(--color-warning-500)",
  completado: "var(--color-energy-500)",
  vencido: "var(--color-danger-500)",
  cancelado: "var(--color-neutral-400)",
}

function todayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export function getDisplayEstado(mantenimiento: MantenimientoProgramado): EstadoMantenimiento {
  const fecha = mantenimiento.fechaProgramada?.slice(0, 10)
  if (mantenimiento.estado === "programado" && fecha && fecha < todayKey()) {
    return "vencido"
  }
  return mantenimiento.estado
}

export function canCancelMantenimiento(mantenimiento: MantenimientoProgramado) {
  return ["programado", "en_proceso"].includes(mantenimiento.estado)
}

export function isUpcomingPreventive(mantenimiento: MantenimientoProgramado) {
  if (mantenimiento.tipo !== "preventivo") return false
  if (getDisplayEstado(mantenimiento) !== "programado") return false
  const fecha = new Date(mantenimiento.fechaProgramada)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today)
  limit.setDate(limit.getDate() + 30)
  return fecha >= today && fecha <= limit
}
