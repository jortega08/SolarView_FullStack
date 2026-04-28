import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ordenesService } from "@/services/ordenes.service"
import { toast } from "sonner"
import type { Orden } from "@/types/domain"
import type { ApiOrden, PaginatedResponse } from "@/types/api"

function normalize(api: ApiOrden): Orden {
  const id = api.id ?? api.idorden ?? 0
  return {
    id,
    codigo: api.codigo ?? `ORD-${id}`,
    instalacionId: api.instalacion,
    instalacionNombre: api.instalacion_nombre ?? "",
    titulo: api.titulo,
    descripcion: api.descripcion ?? null,
    estado: (api.estado ?? "abierta") as Orden["estado"],
    prioridad: (api.prioridad ?? "media") as Orden["prioridad"],
    tecnicoId: api.tecnico ?? api.asignado_a ?? null,
    tecnicoNombre: api.tecnico_nombre ?? api.asignado_a_nombre ?? null,
    fechaCreacion: api.fecha_creacion ?? api.creada_at ?? "",
    fechaVencimiento: api.fecha_vencimiento ?? null,
    slaEstado: api.sla_estado ?? (api.sla_vencido ? "vencido" : null),
  }
}

function extractList(data: PaginatedResponse<ApiOrden> | ApiOrden[]): ApiOrden[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export function useOrdenes(params?: { estado?: string; instalacion?: number; limit?: number }) {
  return useQuery({
    queryKey: ["ordenes", params],
    queryFn: () => ordenesService.listar(params).then((d) => extractList(d).map(normalize)),
    staleTime: 30_000,
  })
}

export function useCrearOrden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ApiOrden>) => ordenesService.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes"] })
      qc.invalidateQueries({ queryKey: ["panel-empresa"] })
      toast.success("Orden creada correctamente")
    },
    onError: () => toast.error("Error al crear la orden"),
  })
}
