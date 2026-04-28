import { apiClient } from "./apiClient"
import type { ApiOrden, PaginatedResponse } from "@/types/api"

export interface OrdenesListParams {
  estado?: string
  asignado_a?: number
  tecnico?: number
  instalacion?: number
  limit?: number
  offset?: number
}

export interface AsignarOrdenPayload {
  tecnico_id: number
  sla_objetivo_horas?: number
}

type MisOrdenesResponse = { count: number; results: ApiOrden[] }

function buildOrdenesParams(params?: OrdenesListParams) {
  if (!params) return undefined
  const { tecnico, asignado_a, ...rest } = params
  return {
    ...rest,
    ...(asignado_a || tecnico ? { asignado_a: asignado_a ?? tecnico } : {}),
  }
}

export const ordenesService = {
  misOrdenes: () =>
    apiClient.get<MisOrdenesResponse>("/ordenes/mis-ordenes/").then((r) => r.data),

  listar: (params?: OrdenesListParams) =>
    apiClient
      .get<PaginatedResponse<ApiOrden> | ApiOrden[]>("/ordenes/ordenes/", { params: buildOrdenesParams(params) })
      .then((r) => r.data),

  crear: (data: Partial<ApiOrden>) =>
    apiClient.post<ApiOrden>("/ordenes/ordenes/", data).then((r) => r.data),

  asignar: (id: number, tecnicoId: number, slaObjetivoHoras?: number) => {
    const payload: AsignarOrdenPayload = {
      tecnico_id: tecnicoId,
      ...(slaObjetivoHoras ? { sla_objetivo_horas: slaObjetivoHoras } : {}),
    }
    return apiClient.post(`/ordenes/ordenes/${id}/asignar/`, payload).then((r) => r.data)
  },

  iniciar: (id: number) =>
    apiClient.post(`/ordenes/ordenes/${id}/iniciar/`).then((r) => r.data),

  completar: (id: number) =>
    apiClient.post(`/ordenes/ordenes/${id}/completar/`).then((r) => r.data),

  cerrar: (id: number) =>
    apiClient.post(`/ordenes/ordenes/${id}/cerrar/`).then((r) => r.data),

  cancelar: (id: number) =>
    apiClient.post(`/ordenes/ordenes/${id}/cancelar/`).then((r) => r.data),

  comentarios: (id: number) =>
    apiClient.get(`/ordenes/ordenes/${id}/comentarios/`).then((r) => r.data),

  evidencias: (id: number) =>
    apiClient.get(`/ordenes/ordenes/${id}/evidencias/`).then((r) => r.data),
}
