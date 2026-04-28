import { useQuery } from "@tanstack/react-query"
import { mantenimientoService } from "@/services/mantenimiento.service"
import type { MantenimientoProgramado } from "@/types/domain"
import type { ApiMantenimientoProgramado, PaginatedResponse } from "@/types/api"

function normalize(api: ApiMantenimientoProgramado): MantenimientoProgramado {
  return {
    id: api.id ?? api.idmantenimiento ?? 0,
    instalacionId: api.instalacion,
    instalacionNombre: api.instalacion_nombre ?? "",
    tipo: (api.tipo ?? api.plan_nombre ?? "preventivo") as MantenimientoProgramado["tipo"],
    fechaProgramada: api.fecha_programada,
    tecnicoId: api.tecnico ?? null,
    tecnicoNombre: api.tecnico_nombre ?? null,
    contratoId: api.contrato ?? api.plan ?? null,
    estado: (api.estado ?? "programado") as MantenimientoProgramado["estado"],
    prioridad: (api.prioridad ?? null) as MantenimientoProgramado["prioridad"],
  }
}

function extractList(data: PaginatedResponse<ApiMantenimientoProgramado> | ApiMantenimientoProgramado[]): ApiMantenimientoProgramado[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export function useMantenimientos(params?: { instalacion?: number; estado?: string; limit?: number }) {
  return useQuery({
    queryKey: ["mantenimientos", params],
    queryFn: () => mantenimientoService.programados(params).then((d) => extractList(d).map(normalize)),
    staleTime: 60_000,
  })
}
