import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificacionesService } from "@/services/notificaciones.service"
import type { Notificacion } from "@/types/domain"
import type { ApiNotificacion, PaginatedResponse } from "@/types/api"

function normalize(api: ApiNotificacion): Notificacion {
  return {
    id: api.id ?? api.idnotificacion ?? 0,
    titulo: api.titulo ?? api.asunto ?? "Notificación",
    mensaje: api.mensaje ?? api.cuerpo ?? "",
    tipo: api.tipo ?? api.canal ?? null,
    leida: api.leida ?? (api.estado === "leida" || api.leida_at != null),
    fechaCreacion: api.fecha_creacion ?? api.creada_at ?? "",
  }
}

function extractList(data: PaginatedResponse<ApiNotificacion> | ApiNotificacion[]): ApiNotificacion[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export function useNotificaciones(params?: { limit?: number }) {
  return useQuery({
    queryKey: ["notificaciones", params],
    queryFn: () => notificacionesService.listar(params).then((d) => extractList(d).map(normalize)),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useNoLeidasCount() {
  return useQuery({
    queryKey: ["notificaciones-count"],
    queryFn: () => notificacionesService.noLeidasCount().then((d) => d.count),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useMarcarLeida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificacionesService.marcarLeida(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificaciones"] })
      qc.invalidateQueries({ queryKey: ["notificaciones-count"] })
    },
  })
}
