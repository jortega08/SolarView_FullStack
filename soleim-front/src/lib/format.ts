import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"

export function formatPower(value: number | null | undefined): string {
  if (value == null) return "—"
  if (value >= 1000) return `${(value / 1000).toFixed(2)} MW`
  return `${value.toFixed(1)} kW`
}

export function formatEnergy(value: number | null | undefined): string {
  if (value == null) return "—"
  if (value >= 1000) return `${(value / 1000).toFixed(2)} GWh`
  return `${value.toFixed(1)} MWh`
}

export function formatPercent(value: number | null | undefined, decimals = 0): string {
  if (value == null) return "—"
  return `${value.toFixed(decimals)}%`
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value)
}

export function formatTemp(value: number | null | undefined): string {
  if (value == null) return "—"
  return `${value.toFixed(1)}°C`
}

export function formatIrradiance(value: number | null | undefined): string {
  if (value == null) return "—"
  return `${Math.round(value)} W/m²`
}

export function formatVoltage(value: number | null | undefined): string {
  if (value == null) return "—"
  return `${Math.round(value)} V`
}

export function formatCurrent(value: number | null | undefined): string {
  if (value == null) return "—"
  return `${Math.round(value)} A`
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
  } catch {
    return "—"
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    return format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: es })
  } catch {
    return "—"
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: es })
  } catch {
    return "—"
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return `${h} h ${m > 0 ? `${m} min` : ""}`
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value)
}
