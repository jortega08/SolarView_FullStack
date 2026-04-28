import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { alertasService } from "@/services/alertas.service"
import { toast } from "sonner"
import type { Alerta } from "@/types/domain"
import type { ApiAlerta, PaginatedResponse } from "@/types/api"

function normalize(api: ApiAlerta): Alerta {
  return {
    id: api.id ?? api.idalerta ?? 0,
    instalacionId: api.instalacion ?? 0,
    instalacionNombre: api.instalacion_nombre ?? "",
    tipoAlertaId: api.tipo_alerta ?? api.tipoalerta ?? 0,
    tipoAlertaNombre: api.tipo_alerta_nombre ?? api.tipo_nombre ?? api.tipo ?? "",
    severidad: (api.severidad ?? "baja") as Alerta["severidad"],
    estado: (api.estado ?? "activa") as Alerta["estado"],
    descripcion: api.descripcion ?? api.mensaje ?? "",
    causaProbable: api.causa_probable ?? null,
    fechaCreacion: api.fecha_creacion ?? api.fecha ?? "",
    fechaResolucion: api.fecha_resolucion ?? null,
  }
}

function extractList(data: PaginatedResponse<ApiAlerta> | ApiAlerta[]): ApiAlerta[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export function useAlertas(params?: {
  estado?: string
  severidad?: string
  instalacion?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ["alertas", params],
    queryFn: () => alertasService.listar(params).then((d) => extractList(d).map(normalize)),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useResolverAlerta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => alertasService.resolver(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alertas"] })
      qc.invalidateQueries({ queryKey: ["panel-empresa"] })
      toast.success("Alerta resuelta correctamente")
    },
    onError: () => toast.error("Error al resolver la alerta"),
  })
}
