import { useQuery } from "@tanstack/react-query"
import { empresaService } from "@/services/empresa.service"
import type { InstalacionResumen } from "@/types/domain"
import type { ApiInstalacionResumen } from "@/types/api"

type InstalacionesPayload = ApiInstalacionResumen[] | { results?: ApiInstalacionResumen[] }

function normalize(api: ApiInstalacionResumen): InstalacionResumen {
  return {
    id: api.id,
    nombre: api.nombre,
    estado: (api.estado ?? "inactiva") as InstalacionResumen["estado"],
    bateriaSoc: api.bateria_soc ?? api.bateria_pct ?? null,
    potenciaActual: api.potencia_actual ?? null,
    generacionHoy: api.generacion_hoy ?? null,
    tipoSistema: (api.tipo_sistema ?? null) as InstalacionResumen["tipoSistema"],
    ciudad: api.ciudad ?? null,
    imagen: api.imagen ?? null,
    riesgo: api.riesgo ?? null,
  }
}

function extractList(data: InstalacionesPayload): ApiInstalacionResumen[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export function useInstalaciones(empresaId?: number) {
  return useQuery({
    queryKey: ["instalaciones", empresaId],
    queryFn: () => empresaService.instalaciones(empresaId).then((list) => extractList(list).map(normalize)),
    staleTime: 60_000,
  })
}
