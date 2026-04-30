import { apiClient } from "./apiClient"
import type {
  ApiMantenimientoProgramado,
  ApiContrato,
  ApiPlanMantenimiento,
  PaginatedResponse,
} from "@/types/api"

export interface MantenimientosParams {
  instalacion?: number
  estado?: string
  plan?: number
  desde?: string
  hasta?: string
  limit?: number
  offset?: number
}

function buildParams(params?: MantenimientosParams) {
  if (!params) return undefined
  return { ...params }
}

export const mantenimientoService = {
  contratos: (params?: { activo?: boolean }) =>
    apiClient
      .get<PaginatedResponse<ApiContrato> | ApiContrato[]>("/mantenimiento/contratos/", {
        params,
      })
      .then((r) => r.data),

  planes: (params?: { tipo_sistema?: string; activo?: boolean }) =>
    apiClient
      .get<PaginatedResponse<ApiPlanMantenimiento> | ApiPlanMantenimiento[]>(
        "/mantenimiento/planes/",
        { params }
      )
      .then((r) => r.data),

  programados: (params?: MantenimientosParams) =>
    apiClient
      .get<PaginatedResponse<ApiMantenimientoProgramado> | ApiMantenimientoProgramado[]>(
        "/mantenimiento/programados/",
        { params: buildParams(params) }
      )
      .then((r) => r.data),

  cancelar: (id: number, motivo?: string) =>
    apiClient
      .post(`/mantenimiento/programados/${id}/cancelar/`, motivo ? { motivo } : {})
      .then((r) => r.data),
}
