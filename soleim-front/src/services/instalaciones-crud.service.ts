import { apiClient } from "./apiClient"
import type { ApiInstalacionCrud, ApiSensor } from "@/types/api"

export interface InstalacionPayload {
  empresa: number
  nombre: string
  direccion?: string
  ciudad?: number | null
  tipo_sistema: string
  capacidad_panel_kw: number
  capacidad_bateria_kwh: number
  fecha_instalacion?: string | null
  estado: string
  imagen?: File | null
}

export interface SensorPayload {
  instalacion?: number | null
  nombre: string
  codigo: string
  tipo: string
  unidad?: string
  estado: string
  ultima_lectura?: number | null
  fecha_ultima_lectura?: string | null
  notas?: string
}

function toInstallationFormData(payload: InstalacionPayload): FormData {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    if (key === "imagen" && value instanceof File) {
      form.append(key, value)
      return
    }
    if (key !== "imagen") form.append(key, String(value))
  })
  return form
}

export const instalacionesCrudService = {
  listar: () =>
    apiClient.get<ApiInstalacionCrud[]>("/core/instalaciones/").then((r) => r.data),

  crear: (payload: InstalacionPayload) =>
    apiClient
      .post<ApiInstalacionCrud>("/core/instalaciones/", toInstallationFormData(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  actualizar: (id: number, payload: InstalacionPayload) =>
    apiClient
      .patch<ApiInstalacionCrud>(`/core/instalaciones/${id}/`, toInstallationFormData(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  eliminar: (id: number) => apiClient.delete(`/core/instalaciones/${id}/`),

  sensores: (params?: { instalacion?: number }) =>
    apiClient.get<ApiSensor[]>("/core/sensores/", { params }).then((r) => r.data),

  crearSensor: (payload: SensorPayload) =>
    apiClient.post<ApiSensor>("/core/sensores/", payload).then((r) => r.data),

  actualizarSensor: (id: number, payload: Partial<SensorPayload>) =>
    apiClient.patch<ApiSensor>(`/core/sensores/${id}/`, payload).then((r) => r.data),

  eliminarSensor: (id: number) => apiClient.delete(`/core/sensores/${id}/`),
}
