import { apiClient } from "./apiClient"
import type {
  ApiAnaliticaActividad,
  ApiAnaliticaBateria,
  ApiAnaliticaAutonomia,
  ApiAnaliticaComparativa,
  ApiEnvelope,
  ApiTendencia,
} from "@/types/api"

export interface AnaliticaActividadesParams {
  instalacion_id?: number
  domicilio_id?: number
  periodo?: "week" | "month" | "year"
}

export interface AnaliticaTendenciaParams {
  instalacion_id: number
  dias?: number
}

export const analiticaService = {
  actividades: (params: AnaliticaActividadesParams) =>
    apiClient
      .get<ApiEnvelope<ApiAnaliticaActividad[]> & { periodo?: string }>("/analitica/actividades/", { params })
      .then((r) => r.data),

  bateria: (params: { instalacion_id?: number; domicilio_id?: number }) =>
    apiClient.get<ApiEnvelope<ApiAnaliticaBateria | null>>("/analitica/bateria/", { params }).then((r) => r.data),

  autonomia: (params: { instalacion_id: number }) =>
    apiClient.get<ApiEnvelope<ApiAnaliticaAutonomia>>("/analitica/autonomia/", { params }).then((r) => r.data),

  tendencia: (params: AnaliticaTendenciaParams) =>
    apiClient.get<ApiEnvelope<ApiTendencia[]>>("/analitica/tendencia/", { params }).then((r) => r.data),

  comparativa: (params: { empresa_id: number }) =>
    apiClient
      .get<ApiEnvelope<ApiAnaliticaComparativa[]>>("/analitica/comparativa/", { params })
      .then((r) => r.data),
}
