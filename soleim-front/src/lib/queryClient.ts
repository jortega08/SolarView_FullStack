import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 60 s antes de considerar datos "obsoletos" — evita re-fetches innecesarios
      // al cambiar de ruta y volver a la misma página.
      staleTime: 60_000,
      // Los datos se conservan en memoria 15 min tras el último componente que los usó.
      // Facilita navegación rápida de ida y vuelta sin spinner.
      gcTime: 15 * 60_000,
      // No re-lanzar petición al hacer foco en la ventana (el polling propio
      // de telemetría ya se encarga de mantener los datos frescos).
      refetchOnWindowFocus: false,
      // Re-intentar sólo una vez; si el backend está caído, no acumular requests.
      retry: 1,
      // Backoff exponencial: espera 1 s, luego 2 s en el reintento.
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
    },
  },
})
