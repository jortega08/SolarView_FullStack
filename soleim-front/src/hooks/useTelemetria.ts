import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { telemetriaService } from "@/services/telemetria.service"

/** Tiempo que los datos se consideran frescos. Ligeramente menor al intervalo de
 *  refresco automático para que la caché sirva datos sin parpadeo. */
const STALE_TIME = 25_000   // 25 s
const REFETCH_INTERVAL = 30_000  // 30 s
const GC_TIME = 10 * 60_000     // 10 min — retiene caché al navegar a otras páginas

export function useTelemetriaConsumos(
  instalacionId?: number,
  opts?: { fechaGte?: string; fechaLte?: string; limit?: number },
) {
  // QueryKey plana: React Query hashea los primitivos de forma eficiente
  // y evita falsos cambios por referencias de objeto distintas.
  const fechaGte = opts?.fechaGte
  const fechaLte = opts?.fechaLte
  const limit    = opts?.limit ?? 200

  return useQuery({
    queryKey: ["telemetria-consumos", instalacionId, fechaGte, fechaLte, limit],
    queryFn: () =>
      telemetriaService.consumos({
        instalacion: instalacionId,
        fecha__gte: fechaGte,
        fecha__lte: fechaLte,
        limit,
      }),
    enabled: Boolean(instalacionId),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchInterval: REFETCH_INTERVAL,
    // Muestra datos anteriores mientras llegan los nuevos (no colapsa a skeleton
    // al cambiar instalación / rango — sólo en la primera carga sin caché).
    placeholderData: keepPreviousData,
    // No sondear cuando la pestaña está en segundo plano: ahorra peticiones.
    refetchIntervalInBackground: false,
    // Con placeholderData un 401 no debe mostrar error si ya hay datos en caché.
    retry: 1,
  })
}

export function useTelemetriaBaterias(
  instalacionId?: number,
  opts?: { fechaGte?: string; limit?: number },
) {
  const fechaGte = opts?.fechaGte
  const limit    = opts?.limit ?? 100

  return useQuery({
    queryKey: ["telemetria-baterias", instalacionId, fechaGte, limit],
    queryFn: () =>
      telemetriaService.baterias({
        instalacion: instalacionId,
        fecha__gte: fechaGte,
        limit,
      }),
    enabled: Boolean(instalacionId),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: keepPreviousData,
    refetchIntervalInBackground: false,
    retry: 1,
  })
}
