import { apiClient } from "./apiClient"
import type {
  ApiDetalleInstalacionResponse,
  ApiDomicilio,
  ApiEmpresaBasica,
  ApiPanelEmpresa,
  ApiInstalacionResumen,
  ApiInstalacionDetalle,
} from "@/types/api"

type InstalacionesResponse = { success?: boolean; results?: ApiInstalacionResumen[] } | ApiInstalacionResumen[]

export interface CsvReportDownload {
  blob: Blob
  filename: string
}

export interface CsvReportParams {
  instalacion_id: number
  dias?: number
}

function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
  if (!disposition) return fallback
  const match = disposition.match(/filename="?([^"]+)"?/)
  return match?.[1] ?? fallback
}

async function normalizeBlobResponse(blob: Blob, filename: string): Promise<CsvReportDownload> {
  if (blob.type.includes("application/json")) {
    const text = await blob.text()
    try {
      const payload = JSON.parse(text) as { error?: string; detail?: string }
      throw new Error(payload.error ?? payload.detail ?? "No se pudo generar el reporte")
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error("No se pudo generar el reporte")
      throw error
    }
  }
  return { blob, filename }
}

export const empresaService = {
  panel: (empresaId?: number) =>
    apiClient
      .get<ApiPanelEmpresa>("/empresa/panel/", { params: empresaId ? { empresa_id: empresaId } : {} })
      .then((r) => r.data),

  instalaciones: (empresaId?: number) =>
    apiClient
      .get<InstalacionesResponse>("/empresa/instalaciones/", { params: empresaId ? { empresa_id: empresaId } : {} })
      .then((r) => r.data),

  empresas: () =>
    apiClient.get<ApiEmpresaBasica[]>("/core/empresas/").then((r) => r.data),

  domicilios: () =>
    apiClient.get<ApiDomicilio[]>("/core/domicilios/").then((r) => r.data),

  instalacion: (id: number) =>
    apiClient
      .get<ApiInstalacionDetalle | ApiDetalleInstalacionResponse>(`/empresa/instalacion/${id}/`)
      .then((r) => r.data),

  reporteConsumo: (params: CsvReportParams) =>
    apiClient
      .get<Blob>("/empresa/reporte/consumo/", { params, responseType: "blob" })
      .then((r) =>
        normalizeBlobResponse(
          r.data,
          filenameFromDisposition(r.headers["content-disposition"], "reporte_consumo.csv")
        )
      ),

  reporteAlertas: (params: CsvReportParams) =>
    apiClient
      .get<Blob>("/empresa/reporte/alertas/", { params, responseType: "blob" })
      .then((r) =>
        normalizeBlobResponse(
          r.data,
          filenameFromDisposition(r.headers["content-disposition"], "reporte_alertas.csv")
        )
      ),
}
