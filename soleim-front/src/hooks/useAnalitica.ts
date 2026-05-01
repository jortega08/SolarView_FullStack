import { useQuery } from "@tanstack/react-query"
import { analiticaService } from "@/services/analitica.service"
import type {
  ActividadEnergetica,
  Autonomia,
  BateriaSalud,
  ComparativaInstalacion,
  TendenciaPunto,
} from "@/types/domain"
import type {
  ApiAnaliticaActividad,
  ApiAnaliticaBateria,
  ApiAnaliticaAutonomia,
  ApiAnaliticaComparativa,
  ApiTendencia,
} from "@/types/api"

function normalizeBateria(api: ApiAnaliticaBateria | null | undefined, instalacionId: number): BateriaSalud | null {
  if (!api) return null
  return {
    instalacionId: api.instalacion_id ?? instalacionId,
    soc: api.soc ?? api.porcentaje_carga ?? 0,
    voltaje: api.voltaje ?? null,
    corriente: api.corriente ?? null,
    temperatura: api.temperatura ?? null,
    tiempoRestanteMinutos: api.tiempo_restante_minutos ?? api.tiempo_restante ?? null,
    capacidadTotal: api.capacidad_total ?? api.capacidad ?? api.capacidad_bateria ?? null,
    capacidadDisponible: api.capacidad_disponible ?? null,
    estado: api.estado ?? null,
    fuentePrincipal: api.fuente_principal ?? null,
    desdeRed: api.desde_red ?? null,
  }
}

function normalizeAutonomia(api: ApiAnaliticaAutonomia | undefined, instalacionId: number): Autonomia {
  return {
    instalacionId: api?.instalacion_id ?? instalacionId,
    autonomiaHoras: api?.autonomia_horas ?? null,
    autonomiaMinutos: api?.autonomia_minutos ?? null,
  }
}

function normalizeTendencia(api: ApiTendencia): TendenciaPunto {
  return {
    fecha: api.fecha,
    generacion: api.generacion ?? api.solar ?? null,
    consumo: api.consumo ?? (api.solar != null || api.electrica != null ? (api.solar ?? 0) + (api.electrica ?? 0) : null),
    bateriaSoc: api.bateria_soc ?? api.bateria_avg ?? null,
    irradiancia: api.irradiancia ?? null,
    exportacion: api.exportacion ?? null,
    importacion: api.importacion ?? api.electrica ?? null,
  }
}

function normalizeActividad(api: ApiAnaliticaActividad): ActividadEnergetica {
  const solar = api.solar ?? null
  const redElectrica = api.electrica ?? null
  return {
    label: api.mes ?? api.fecha ?? "Periodo",
    fecha: api.fecha ?? null,
    solar,
    redElectrica,
    consumoTotal: solar != null || redElectrica != null ? (solar ?? 0) + (redElectrica ?? 0) : null,
  }
}

function normalizeComparativa(api: ApiAnaliticaComparativa): ComparativaInstalacion {
  return {
    instalacionId: api.instalacion_id,
    instalacionNombre: api.instalacion_nombre,
    solarRatio: api.solar_ratio ?? null,
    costoTotal: api.costo_total ?? null,
    alertasActivas: api.alertas_activas ?? null,
  }
}

function daysBetween(fechaInicio?: string, fechaFin?: string): number {
  if (!fechaInicio || !fechaFin) return 7
  const start = new Date(fechaInicio)
  const end = new Date(fechaFin)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 7
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
}

export function useAnaliticaBateria(instalacionId: number | null) {
  return useQuery({
    queryKey: ["analitica-bateria", instalacionId],
    queryFn: () =>
      analiticaService
        .bateria({ instalacion_id: instalacionId! })
        .then((res) => normalizeBateria(res.data, instalacionId!)),
    enabled: instalacionId != null,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useAnaliticaAutonomia(instalacionId: number | null) {
  return useQuery({
    queryKey: ["analitica-autonomia", instalacionId],
    queryFn: () =>
      analiticaService
        .autonomia({ instalacion_id: instalacionId! })
        .then((res) => normalizeAutonomia(res.data, instalacionId!)),
    enabled: instalacionId != null,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useAnaliticaTendencia(params: {
  instalacionId?: number
  fechaInicio?: string
  fechaFin?: string
}) {
  return useQuery({
    queryKey: ["analitica-tendencia", params],
    queryFn: () =>
      analiticaService
        .tendencia({
          instalacion_id: params.instalacionId!,
          dias: daysBetween(params.fechaInicio, params.fechaFin),
        })
        .then((res) => (res.data ?? []).map(normalizeTendencia)),
    enabled: params.instalacionId != null,
    staleTime: 60_000,
  })
}

export function useAnaliticaActividades(params: {
  instalacionId?: number
  periodo?: "week" | "month" | "year"
}) {
  return useQuery({
    queryKey: ["analitica-actividades", params],
    queryFn: () =>
      analiticaService
        .actividades({
          instalacion_id: params.instalacionId,
          periodo: params.periodo ?? "year",
        })
        .then((res) => (res.data ?? []).map(normalizeActividad)),
    enabled: params.instalacionId != null,
    staleTime: 60_000,
  })
}

export function useAnaliticaComparativa(empresaId: number | null | undefined) {
  return useQuery({
    queryKey: ["analitica-comparativa", empresaId],
    queryFn: () =>
      analiticaService
        .comparativa({ empresa_id: empresaId! })
        .then((res) => (res.data ?? []).map(normalizeComparativa)),
    enabled: empresaId != null,
    staleTime: 120_000,
  })
}
