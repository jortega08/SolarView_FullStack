import { apiClient } from "./apiClient"
import type { ApiTecnico, PaginatedResponse } from "@/types/api"

interface TecnicosParams {
  empresa?: number
  disponible?: boolean
}

interface TecnicosDisponiblesParams {
  ciudad: number
  especialidad?: number
  empresa?: number
}

type TecnicosDisponiblesResponse = { count: number; results: ApiTecnico[] }

export const tecnicosService = {
  especialidades: () =>
    apiClient.get("/tecnicos/especialidades/").then((r) => r.data),

  perfiles: (params?: TecnicosParams) =>
    apiClient
      .get<PaginatedResponse<ApiTecnico> | ApiTecnico[]>("/tecnicos/perfiles/", { params })
      .then((r) => r.data),

  disponibles: (params: TecnicosDisponiblesParams) =>
    apiClient
      .get<TecnicosDisponiblesResponse>("/tecnicos/perfiles/disponibles/", { params })
      .then((r) => r.data),
}
