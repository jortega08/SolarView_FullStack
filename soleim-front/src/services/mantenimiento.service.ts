import { apiClient } from "./apiClient"
import type { ApiMantenimientoProgramado, PaginatedResponse } from "@/types/api"

interface MantenimientosParams {
  instalacion?: number
  estado?: string
  desde?: string
  hasta?: string
  fecha_desde?: string
  fecha_hasta?: string
  limit?: number
  offset?: number
}

function buildMantenimientosParams(params?: MantenimientosParams) {
  if (!params) return undefined
  const { fecha_desde, fecha_hasta, desde, hasta, ...rest } = params
  return {
    ...rest,
    ...(desde || fecha_desde ? { desde: desde ?? fecha_desde } : {}),
    ...(hasta || fecha_hasta ? { hasta: hasta ?? fecha_hasta } : {}),
  }
}

export const mantenimientoService = {
  contratos: () =>
    apiClient.get("/mantenimiento/contratos/").then((r) => r.data),

  planes: () =>
    apiClient.get("/mantenimiento/planes/").then((r) => r.data),

  programados: (params?: MantenimientosParams) =>
    apiClient
      .get<PaginatedResponse<ApiMantenimientoProgramado> | ApiMantenimientoProgramado[]>(
        "/mantenimiento/programados/",
        { params: buildMantenimientosParams(params) }
      )
      .then((r) => r.data),

  cancelar: (id: number) =>
    apiClient.post(`/mantenimiento/programados/${id}/cancelar/`).then((r) => r.data),
}
