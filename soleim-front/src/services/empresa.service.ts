import { apiClient } from "./apiClient"
import type {
  ApiDetalleInstalacionResponse,
  ApiPanelEmpresa,
  ApiInstalacionResumen,
  ApiInstalacionDetalle,
} from "@/types/api"

type InstalacionesResponse = { success?: boolean; results?: ApiInstalacionResumen[] } | ApiInstalacionResumen[]

export const empresaService = {
  panel: (empresaId?: number) =>
    apiClient
      .get<ApiPanelEmpresa>("/empresa/panel/", { params: empresaId ? { empresa_id: empresaId } : {} })
      .then((r) => r.data),

  instalaciones: (empresaId?: number) =>
    apiClient
      .get<InstalacionesResponse>("/empresa/instalaciones/", { params: empresaId ? { empresa_id: empresaId } : {} })
      .then((r) => r.data),

  instalacion: (id: number) =>
    apiClient
      .get<ApiInstalacionDetalle | ApiDetalleInstalacionResponse>(`/empresa/instalacion/${id}/`)
      .then((r) => r.data),

  reporteConsumo: (params: { instalacion_id?: number; empresa_id?: number; fecha_inicio?: string; fecha_fin?: string }) =>
    apiClient.get("/empresa/reporte/consumo/", { params, responseType: "blob" }).then((r) => r.data),

  reporteAlertas: (params: { instalacion_id?: number; empresa_id?: number; estado?: string; fecha_inicio?: string }) =>
    apiClient.get("/empresa/reporte/alertas/", { params, responseType: "blob" }).then((r) => r.data),
}
