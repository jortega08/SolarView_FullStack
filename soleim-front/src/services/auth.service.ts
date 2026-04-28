import { apiClient } from "./apiClient"
import type { ApiEnvelope, ApiLoginResponse, ApiUser } from "@/types/api"

export const authService = {
  login: (email: string, contrasena: string) =>
    apiClient.post<ApiLoginResponse>("/auth/login/", { email, contrasena }).then((r) => r.data),

  register: (nombre: string, email: string, contrasena: string) =>
    apiClient.post<ApiLoginResponse>("/auth/register/", { nombre, email, contrasena }).then((r) => r.data),

  me: () => apiClient.get<ApiEnvelope<ApiUser> | ApiUser>("/auth/me/").then((r) => r.data),

  logout: (refresh?: string | null) =>
    apiClient.post("/auth/logout/", refresh ? { refresh } : {}).catch(() => null),
}
