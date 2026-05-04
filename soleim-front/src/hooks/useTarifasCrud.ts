import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tarifasService, type TarifaPayload } from "@/services/tarifas.service"
import type { ApiTarifa } from "@/types/api"
import type { Tarifa } from "@/types/domain"

function normalizeTarifa(api: ApiTarifa): Tarifa {
  const scope: Tarifa["scope"] = api.instalacion != null
    ? "instalacion"
    : api.ciudad != null
      ? "ciudad"
      : "global"
  return {
    id: api.idtarifa,
    nombre: api.nombre,
    ciudadId: api.ciudad ?? null,
    ciudadNombre: api.ciudad_nombre ?? null,
    instalacionId: api.instalacion ?? null,
    instalacionNombre: api.instalacion_nombre ?? null,
    valorKwh: Number(api.valor_kwh),
    moneda: api.moneda,
    vigenteDesde: api.vigente_desde,
    vigenteHasta: api.vigente_hasta ?? null,
    scope,
  }
}

export function useTarifas() {
  return useQuery({
    queryKey: ["tarifas"],
    queryFn: () => tarifasService.listar().then((data) => data.map(normalizeTarifa)),
    staleTime: 60_000,
  })
}

export function useTarifaMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tarifas"] })

  return {
    crear: useMutation({
      mutationFn: (payload: TarifaPayload) => tarifasService.crear(payload),
      onSuccess: invalidate,
    }),
    actualizar: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<TarifaPayload> }) =>
        tarifasService.actualizar(id, payload),
      onSuccess: invalidate,
    }),
    eliminar: useMutation({
      mutationFn: (id: number) => tarifasService.eliminar(id),
      onSuccess: invalidate,
    }),
  }
}
