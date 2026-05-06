import { apiClient } from "./apiClient"
import type { ApiEnvelope, ApiLoginResponse, ApiUser } from "@/types/api"

export interface RegisterPayload {
  nombre: string
  email: string
  contrasena: string
  prestador_nombre?: string
  prestador_nit?: string
  prestador_ciudad?: number | null
}

export interface RegisterConCodigoPayload {
  nombre: string
  email: string
  contrasena: string
  codigo: string
}

export const authService = {
  login: (email: string, contrasena: string) =>
    apiClient.post<ApiLoginResponse>("/auth/login/", { email, contrasena }).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiLoginResponse>("/auth/register/", payload).then((r) => r.data),

  registerConCodigo: (payload: RegisterConCodigoPayload) =>
    apiClient.post<ApiLoginResponse>("/auth/registrar-con-codigo/", payload).then((r) => r.data),

  me: () => apiClient.get<ApiEnvelope<ApiUser> | ApiUser>("/auth/me/").then((r) => r.data),

  logout: (refresh?: string | null) =>
    apiClient.post("/auth/logout/", refresh ? { refresh } : {}).catch(() => null),
}
