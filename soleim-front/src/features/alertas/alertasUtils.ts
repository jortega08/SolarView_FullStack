import { subHours, subDays, format, startOfDay, eachDayOfInterval } from "date-fns"
import type { Alerta, PanelEmpresa } from "@/types/domain"
import type { AlertaEnriquecida, AlertaFilterState, SlaEstado } from "./types"

export const SLA_TARGETS: Record<string, number> = {
  critica: 30,
  alta: 120,
  media: 240,
  baja: 1440,
}

const SEVERIDAD_WEIGHT: Record<string, number> = { critica: 4, alta: 3, media: 2, baja: 1 }
const SLA_ESTADO_WEIGHT: Record<string, number> = { incumplida: 3, en_riesgo: 2, dentro: 1 }

export function enrichAlerta(alerta: Alerta, now: Date): AlertaEnriquecida {
  const target = SLA_TARGETS[alerta.severidad] ?? 240
  const createdAt = new Date(alerta.fechaCreacion)

  let elapsed: number
  if (alerta.estado !== "activa" && alerta.fechaResolucion) {
    elapsed = (new Date(alerta.fechaResolucion).getTime() - createdAt.getTime()) / 60_000
  } else {
    elapsed = (now.getTime() - createdAt.getTime()) / 60_000
  }

  const restante = target - elapsed

  let slaEstado: SlaEstado
  if (elapsed <= target * 0.7) {
    slaEstado = "dentro"
  } else if (elapsed <= target) {
    slaEstado = "en_riesgo"
  } else {
    slaEstado = "incumplida"
  }

  return {
    ...alerta,
    slaTargetMinutos: target,
    slaElapsedMinutos: Math.round(elapsed),
    slaRestanteMinutos: Math.round(restante),
    slaEstado,
  }
}

export function enrichAlertas(alertas: Alerta[]): AlertaEnriquecida[] {
  const now = new Date()
  return alertas.map((a) => enrichAlerta(a, now))
}

export function filterAlertas(
  alertas: AlertaEnriquecida[],
  filters: AlertaFilterState,
): AlertaEnriquecida[] {
  const now = new Date()
  let cutoff: Date | null = null
  let cutoffEnd: Date | null = null

  if (filters.rango !== "custom") {
    const rangoMap: Record<string, Date> = {
      "1h": subHours(now, 1),
      "4h": subHours(now, 4),
      "24h": subHours(now, 24),
      "7d": subDays(now, 7),
      "30d": subDays(now, 30),
    }
    cutoff = rangoMap[filters.rango] ?? null
  } else {
    if (filters.fechaInicio) cutoff = new Date(filters.fechaInicio)
    if (filters.fechaFin) cutoffEnd = new Date(filters.fechaFin)
  }

  return alertas.filter((a) => {
    const fecha = new Date(a.fechaCreacion)
    if (cutoff && fecha < cutoff) return false
    if (cutoffEnd && fecha > cutoffEnd) return false
    if (filters.severidad && a.severidad !== filters.severidad) return false
    if (filters.estado && a.estado !== filters.estado) return false
    if (filters.instalacion && String(a.instalacionId) !== filters.instalacion) return false
    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase()
      const haystack = [a.descripcion, a.instalacionNombre, a.tipoAlertaNombre, a.causaProbable ?? ""]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function sortByPriority(alertas: AlertaEnriquecida[]): AlertaEnriquecida[] {
  return [...alertas].sort((a, b) => {
    const slaW = (SLA_ESTADO_WEIGHT[b.slaEstado] ?? 0) - (SLA_ESTADO_WEIGHT[a.slaEstado] ?? 0)
    if (slaW !== 0) return slaW
    const sevW = (SEVERIDAD_WEIGHT[b.severidad] ?? 0) - (SEVERIDAD_WEIGHT[a.severidad] ?? 0)
    if (sevW !== 0) return sevW
    return a.slaRestanteMinutos - b.slaRestanteMinutos
  })
}

export function computeKpis(alertas: AlertaEnriquecida[], panel?: PanelEmpresa) {
  const activas = alertas.filter((a) => a.estado === "activa")
  const slaIncumplidas = activas.filter((a) => a.slaEstado === "incumplida").length
  const resueltas = alertas.filter((a) => a.estado === "resuelta" && a.slaElapsedMinutos > 0)

  const tiempoMedioRespuestaMin =
    resueltas.length > 0
      ? Math.round(resueltas.reduce((s, a) => s + a.slaElapsedMinutos, 0) / resueltas.length)
      : null

  return {
    alertasActivas: activas.length,
    alertasCriticas: panel?.alertasCriticas ?? activas.filter((a) => a.severidad === "critica").length,
    slaEnRiesgo: panel?.slaEnRiesgo ?? activas.filter((a) => a.slaEstado === "en_riesgo").length,
    slaIncumplidas,
    tiempoMedioRespuestaMin,
    instalacionesConIncidentes: new Set(activas.map((a) => a.instalacionId)).size,
  }
}

export function computeSlaBreakdown(activas: AlertaEnriquecida[]) {
  const total = activas.length
  const dentroCount = activas.filter((a) => a.slaEstado === "dentro").length
  const enRiesgoCount = activas.filter((a) => a.slaEstado === "en_riesgo").length
  const incumplidaCount = activas.filter((a) => a.slaEstado === "incumplida").length
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return {
    total,
    dentroCount,
    enRiesgoCount,
    incumplidaCount,
    dentroPercent: pct(dentroCount),
    enRiesgoPercent: pct(enRiesgoCount),
    incumplidaPercent: pct(incumplidaCount),
  }
}

export function computeHeatmapData(activas: AlertaEnriquecida[]) {
  const map = new Map<string, { critica: number; alta: number; media: number; baja: number }>()

  for (const a of activas) {
    const zona = a.instalacionNombre || "Sin nombre"
    if (!map.has(zona)) map.set(zona, { critica: 0, alta: 0, media: 0, baja: 0 })
    const row = map.get(zona)!
    if (a.severidad === "critica") row.critica++
    else if (a.severidad === "alta") row.alta++
    else if (a.severidad === "media") row.media++
    else if (a.severidad === "baja") row.baja++
  }

  return Array.from(map.entries())
    .map(([zona, c]) => ({ zona, ...c, total: c.critica + c.alta + c.media + c.baja }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

export function computeTrendData(alertas: AlertaEnriquecida[], days: 7 | 14 | 30) {
  const now = new Date()
  const start = startOfDay(subDays(now, days - 1))
  const dates = eachDayOfInterval({ start, end: now })

  return dates.map((date) => {
    const dayStart = startOfDay(date)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const byDay = alertas.filter((a) => {
      const created = new Date(a.fechaCreacion)
      return created >= dayStart && created <= dayEnd
    })

    const total = byDay.length
    const incumplidas = byDay.filter((a) => a.slaEstado === "incumplida").length

    return {
      fecha: format(date, "d MMM"),
      activas: byDay.filter((a) => a.estado === "activa").length,
      enRiesgo: byDay.filter((a) => a.slaEstado === "en_riesgo").length,
      incumplidas,
      cumplimientoSla: total > 0 ? Math.round(((total - incumplidas) / total) * 100) : 100,
    }
  })
}

export function formatSlaRestante(minutos: number): string {
  if (minutos > 0) {
    if (minutos < 60) return `Vence en ${Math.round(minutos)} min`
    const h = Math.floor(minutos / 60)
    const m = Math.round(minutos % 60)
    return m > 0 ? `Vence en ${h}h ${m}min` : `Vence en ${h}h`
  }
  const abs = Math.abs(minutos)
  if (abs < 60) return `Vencida hace ${Math.round(abs)} min`
  const h = Math.floor(abs / 60)
  const m = Math.round(abs % 60)
  return m > 0 ? `Vencida hace ${h}h ${m}min` : `Vencida hace ${h}h`
}

export function heatmapIntensity(value: number, max: number): string {
  if (value === 0 || max === 0) return "transparent"
  const ratio = value / max
  if (ratio <= 0.2) return "var(--color-danger-50)"
  if (ratio <= 0.4) return "var(--color-danger-100)"
  if (ratio <= 0.6) return "var(--color-danger-200)"
  if (ratio <= 0.8) return "var(--color-danger-400)"
  return "var(--color-danger-600)"
}
