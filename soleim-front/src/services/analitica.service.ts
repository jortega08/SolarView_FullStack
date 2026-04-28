import { apiClient } from "./apiClient"
import type { ApiEnvelope, ApiTendencia, ApiAnaliticaBateria, ApiAnaliticaAutonomia } from "@/types/api"

export const analiticaService = {
  actividades: (params: { instalacion_id?: number; domicilio_id?: number; periodo?: string }) =>
    apiClient.get("/analitica/actividades/", { params }).then((r) => r.data),

  bateria: (params: { instalacion_id?: number; domicilio_id?: number }) =>
    apiClient.get<ApiEnvelope<ApiAnaliticaBateria | null>>("/analitica/bateria/", { params }).then((r) => r.data),

  autonomia: (params: { instalacion_id: number }) =>
    apiClient.get<ApiEnvelope<ApiAnaliticaAutonomia>>("/analitica/autonomia/", { params }).then((r) => r.data),

  tendencia: (params: { instalacion_id: number; dias?: number }) =>
    apiClient.get<ApiEnvelope<ApiTendencia[]>>("/analitica/tendencia/", { params }).then((r) => r.data),

  comparativa: (params: { empresa_id?: number }) =>
    apiClient.get("/analitica/comparativa/", { params }).then((r) => r.data),
}
