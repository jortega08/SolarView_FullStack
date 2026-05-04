import { apiClient } from "./apiClient"
import type { ApiTarifa } from "@/types/api"

export interface TarifaPayload {
  nombre: string
  ciudad?: number | null
  instalacion?: number | null
  valor_kwh: string  // string para preservar precisión Decimal en backend
  moneda?: string
  vigente_desde: string  // ISO datetime
  vigente_hasta?: string | null
}

export const tarifasService = {
  listar: () => apiClient.get<ApiTarifa[]>("/core/tarifas/").then((r) => r.data),

  crear: (payload: TarifaPayload) =>
    apiClient.post<ApiTarifa>("/core/tarifas/", payload).then((r) => r.data),

  actualizar: (id: number, payload: Partial<TarifaPayload>) =>
    apiClient.patch<ApiTarifa>(`/core/tarifas/${id}/`, payload).then((r) => r.data),

  eliminar: (id: number) => apiClient.delete(`/core/tarifas/${id}/`),
}
