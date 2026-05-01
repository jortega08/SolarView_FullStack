import { apiClient } from "./apiClient"
import type { ApiAlerta, PaginatedResponse } from "@/types/api"

export const alertasService = {
  ultimas: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiAlerta[]>("/alertas/ultimas/", { params }).then((r) => r.data),

  listar: (params?: {
    estado?: string
    severidad?: string
    instalacion?: number
    domicilio?: number
    tipoalerta?: number
    limit?: number
    offset?: number
  }) =>
    apiClient
      .get<PaginatedResponse<ApiAlerta> | ApiAlerta[]>("/alertas/alertas/", { params })
      .then((r) => r.data),

  resolver: (id: number) =>
    apiClient.post(`/alertas/alertas/${id}/resolver/`).then((r) => r.data),

  tiposAlerta: () =>
    apiClient.get("/alertas/tipos-alerta/").then((r) => r.data),
}
