import { apiClient } from "./apiClient"
import type { ApiTelemetriaItem, ApiConsumo, ApiBateria, PaginatedResponse } from "@/types/api"

export const telemetriaService = {
  verDatos: (params: { instalacion_id?: number; domicilio_id?: number; limit?: number }) =>
    apiClient.get<ApiTelemetriaItem[]>("/telemetria/ver_datos/", { params }).then((r) => r.data),

  consumos: (params: {
    instalacion?: number
    domicilio?: number
    fecha__gte?: string
    fecha__lte?: string
    limit?: number
  }) =>
    apiClient
      .get<PaginatedResponse<ApiConsumo>>("/telemetria/consumos/", { params })
      .then((r) => r.data),

  baterias: (params: { instalacion?: number; domicilio?: number; fecha__gte?: string; limit?: number }) =>
    apiClient
      .get<PaginatedResponse<ApiBateria>>("/telemetria/baterias/", { params })
      .then((r) => r.data),
}
