import { apiClient } from "./apiClient"
import type {
  ApiInvitacionPrestador,
  ApiPrestadorServicio,
  ApiUsuarioEquipoPrestador,
} from "@/types/api"

export interface CrearInvitacionPayload {
  rol: "operador" | "viewer" | "admin_empresa"
  email_destino?: string
  vigente_hasta: string
}

export type UpdateMiPrestadorPayload = Pick<ApiPrestadorServicio, "nombre"> &
  Partial<Pick<ApiPrestadorServicio, "nit" | "ciudad">>

export const prestadorService = {
  fetchMiPrestador: () =>
    apiClient.get<ApiPrestadorServicio>("/core/mi-prestador/").then((r) => r.data),

  updateMiPrestador: (payload: UpdateMiPrestadorPayload) =>
    apiClient.patch<ApiPrestadorServicio>("/core/mi-prestador/", payload).then((r) => r.data),

  fetchEquipoPrestador: () =>
    apiClient.get<ApiUsuarioEquipoPrestador[]>("/core/equipo-prestador/").then((r) => r.data),

  quitarAccesoEmpleado: (idusuario: number) =>
    apiClient.post(`/core/equipo-prestador/${idusuario}/quitar-acceso/`).then((r) => r.data),

  fetchInvitaciones: () =>
    apiClient.get<ApiInvitacionPrestador[]>("/core/invitaciones/").then((r) => r.data),

  crearInvitacion: (payload: CrearInvitacionPayload) =>
    apiClient.post<ApiInvitacionPrestador>("/core/invitaciones/", payload).then((r) => r.data),

  revocarInvitacion: (id: number) =>
    apiClient.delete(`/core/invitaciones/${id}/`).then(() => true),
}
