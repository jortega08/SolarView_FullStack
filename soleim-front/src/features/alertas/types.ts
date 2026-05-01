import type { Alerta } from "@/types/domain"

export type SlaEstado = "dentro" | "en_riesgo" | "incumplida"

export interface AlertaEnriquecida extends Alerta {
  slaTargetMinutos: number
  slaElapsedMinutos: number
  slaRestanteMinutos: number
  slaEstado: SlaEstado
}

export interface AlertaFilterState {
  rango: "1h" | "4h" | "24h" | "7d" | "30d" | "custom"
  severidad: string
  estado: string
  instalacion: string
  busqueda: string
  fechaInicio?: string
  fechaFin?: string
}
