import { useQuery } from "@tanstack/react-query"
import { telemetriaService } from "@/services/telemetria.service"

export function useTelemetriaConsumos(instalacionId?: number, opts?: { fechaGte?: string; fechaLte?: string; limit?: number }) {
  return useQuery({
    queryKey: ["telemetria-consumos", instalacionId, opts],
    queryFn: () =>
      telemetriaService.consumos({
        instalacion: instalacionId,
        fecha__gte: opts?.fechaGte,
        fecha__lte: opts?.fechaLte,
        limit: opts?.limit ?? 200,
      }),
    enabled: Boolean(instalacionId),
    refetchInterval: 30_000,
  })
}

export function useTelemetriaBaterias(instalacionId?: number, opts?: { fechaGte?: string; limit?: number }) {
  return useQuery({
    queryKey: ["telemetria-baterias", instalacionId, opts],
    queryFn: () =>
      telemetriaService.baterias({
        instalacion: instalacionId,
        fecha__gte: opts?.fechaGte,
        limit: opts?.limit ?? 100,
      }),
    enabled: Boolean(instalacionId),
    refetchInterval: 30_000,
  })
}
