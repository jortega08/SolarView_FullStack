import { apiClient } from "./apiClient"
import type { ApiCiudad, ApiEmpresaBasica, ApiUser } from "@/types/api"

export const catalogosService = {
  ciudades: () => apiClient.get<ApiCiudad[]>("/core/ciudades/").then((r) => r.data),

  empresas: () => apiClient.get<ApiEmpresaBasica[]>("/core/empresas/").then((r) => r.data),

  usuarios: () => apiClient.get<ApiUser[]>("/core/usuarios/").then((r) => r.data),

  crearUsuario: (payload: {
    nombre: string
    email: string
    contrasena: string
    rol?: string
  }) => apiClient.post<ApiUser>("/core/usuarios/", payload).then((r) => r.data),
}
