import { apiClient } from "./apiClient"
import type { ApiNotificacion, PaginatedResponse } from "@/types/api"

export const notificacionesService = {
  listar: (params?: { limit?: number; offset?: number }) =>
    apiClient
      .get<PaginatedResponse<ApiNotificacion> | ApiNotificacion[]>("/notificaciones/", { params })
      .then((r) => r.data),

  noLeidasCount: () =>
    apiClient.get<{ count: number }>("/notificaciones/no-leidas-count/").then((r) => r.data),

  marcarLeida: (id: number) =>
    apiClient.post(`/notificaciones/${id}/marcar-leida/`).then((r) => r.data),

  marcarTodasLeidas: () =>
    apiClient.post("/notificaciones/marcar-todas-leidas/").then((r) => r.data),
}
