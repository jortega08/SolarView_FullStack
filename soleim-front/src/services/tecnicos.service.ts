import { apiClient } from "./apiClient"
import type { ApiEspecialidad, ApiTecnico, PaginatedResponse } from "@/types/api"
import type { Certificacion } from "@/types/domain"

export interface TecnicosParams {
  empresa?: number
  disponible?: boolean
}

export interface TecnicosDisponiblesParams {
  ciudad: number
  especialidad?: number
  empresa?: number
}

export interface TecnicoPayload {
  usuario: number
  empresa: number
  cedula: string
  telefono?: string
  especialidades?: number[]
  zonas?: number[]
  disponible: boolean
  area_profesional?: string
  resumen_profesional?: string
  estudios?: string[]
  licencia_vence?: string | null
  notas?: string
  titulo_academico?: string
  nivel_educativo?: string
  certificaciones?: Certificacion[]
  capacidad_operacion?: string
}

export interface PerfilProfesionalPayload {
  telefono?: string
  especialidades?: number[]
  zonas?: number[]
  disponible?: boolean
  area_profesional?: string
  resumen_profesional?: string
  estudios?: string[]
  licencia_vence?: string | null
  notas?: string
  hoja_vida?: File | null
  titulo_academico?: string
  nivel_educativo?: string
  certificaciones?: Certificacion[]
  capacidad_operacion?: string
}

type TecnicosListResponse = { count: number; results: ApiTecnico[] }

function toProfileFormData(payload: PerfilProfesionalPayload): FormData {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    if (key === "hoja_vida" && value instanceof File) {
      form.append(key, value)
      return
    }
    if (Array.isArray(value)) {
      form.append(key, JSON.stringify(value))
      return
    }
    if (key !== "hoja_vida") form.append(key, String(value))
  })
  return form
}

export const tecnicosService = {
  especialidades: () =>
    apiClient
      .get<PaginatedResponse<ApiEspecialidad> | ApiEspecialidad[]>("/tecnicos/especialidades/")
      .then((r) => r.data),

  perfiles: (params?: TecnicosParams) =>
    apiClient
      .get<PaginatedResponse<ApiTecnico> | ApiTecnico[]>("/tecnicos/perfiles/", { params })
      .then((r) => r.data),

  disponibles: (params: TecnicosDisponiblesParams) =>
    apiClient
      .get<TecnicosListResponse>("/tecnicos/perfiles/disponibles/", { params })
      .then((r) => r.data),

  sugeridos: (instalacionId: number) =>
    apiClient
      .get<TecnicosListResponse>("/tecnicos/perfiles/sugeridos/", {
        params: { instalacion_id: instalacionId },
      })
      .then((r) => r.data),

  crear: (payload: TecnicoPayload) =>
    apiClient.post<ApiTecnico>("/tecnicos/perfiles/", payload).then((r) => r.data),

  actualizar: (id: number, payload: Partial<TecnicoPayload>) =>
    apiClient.patch<ApiTecnico>(`/tecnicos/perfiles/${id}/`, payload).then((r) => r.data),

  eliminar: (id: number) => apiClient.delete(`/tecnicos/perfiles/${id}/`),

  miPerfil: () => apiClient.get<ApiTecnico>("/tecnicos/perfiles/me/").then((r) => r.data),

  actualizarMiPerfil: (payload: PerfilProfesionalPayload) => {
    const hasFile = payload.hoja_vida instanceof File
    return apiClient
      .patch<ApiTecnico>(
        "/tecnicos/perfiles/me/",
        hasFile ? toProfileFormData(payload) : payload,
        hasFile ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
      )
      .then((r) => r.data)
  },
}
