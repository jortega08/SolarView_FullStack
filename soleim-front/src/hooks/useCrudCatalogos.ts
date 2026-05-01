import { useQuery } from "@tanstack/react-query"
import { catalogosService } from "@/services/catalogos.service"
import type { ApiCiudad, ApiEmpresaBasica, ApiUser } from "@/types/api"
import type { CiudadBasica, EmpresaBasica } from "@/types/domain"

function normalizeCiudad(api: ApiCiudad): CiudadBasica {
  return {
    id: api.idciudad,
    nombre: api.nombre,
    estadoNombre: api.estado_nombre ?? null,
  }
}

function normalizeEmpresa(api: ApiEmpresaBasica): EmpresaBasica {
  return {
    id: api.idempresa,
    nombre: api.nombre,
    nit: api.nit ?? null,
    sector: api.sector ?? null,
    ciudadNombre: api.ciudad_nombre ?? null,
  }
}

export function useCiudades() {
  return useQuery({
    queryKey: ["catalogos", "ciudades"],
    queryFn: () => catalogosService.ciudades().then((data) => data.map(normalizeCiudad)),
    staleTime: 300_000,
  })
}

export function useEmpresasCrud() {
  return useQuery({
    queryKey: ["catalogos", "empresas"],
    queryFn: () => catalogosService.empresas().then((data) => data.map(normalizeEmpresa)),
    staleTime: 300_000,
  })
}

export function useUsuarios() {
  return useQuery<ApiUser[]>({
    queryKey: ["catalogos", "usuarios"],
    queryFn: catalogosService.usuarios,
    staleTime: 120_000,
  })
}
