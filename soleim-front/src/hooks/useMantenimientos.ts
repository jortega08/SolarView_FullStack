import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { mantenimientoService } from "@/services/mantenimiento.service"
import { toast } from "sonner"
import type {
  MantenimientoProgramado,
  Contrato,
  PlanMantenimiento,
  PlanChecklistItem,
} from "@/types/domain"
import type {
  ApiMantenimientoProgramado,
  ApiContrato,
  ApiPlanMantenimiento,
  PaginatedResponse,
} from "@/types/api"

/* ---------- Normalizadores ---------- */

function inferTipoMantenimiento(value?: string | null): MantenimientoProgramado["tipo"] {
  const normalized = (value ?? "").toLowerCase()
  if (normalized.includes("correctivo")) return "correctivo"
  if (normalized.includes("inspe")) return "inspeccion"
  if (normalized.includes("instal")) return "instalacion"
  if (normalized.includes("revisi")) return "revision"
  return "preventivo"
}

function normalizeMantenimiento(api: ApiMantenimientoProgramado): MantenimientoProgramado {
  return {
    id: api.id ?? api.idmantenimiento ?? 0,
    instalacionId: api.instalacion,
    instalacionNombre: api.instalacion_nombre ?? "",
    planId: api.plan ?? null,
    planNombre: api.plan_nombre ?? null,
    tipo: inferTipoMantenimiento(api.tipo ?? api.plan_nombre),
    fechaProgramada: api.fecha_programada,
    estado: (api.estado ?? "programado") as MantenimientoProgramado["estado"],
    notas: api.notas ?? null,
    ordenTrabajoId: api.orden_trabajo ?? null,
    ordenCodigo: api.orden_codigo ?? null,
    creadoAt: api.creado_at ?? null,
    tecnicoId: api.tecnico ?? null,
    tecnicoNombre: api.tecnico_nombre ?? null,
    contratoId: api.contrato ?? null,
    prioridad: (api.prioridad ?? null) as MantenimientoProgramado["prioridad"],
  }
}

function normalizeContrato(api: ApiContrato): Contrato {
  return {
    id: api.idcontrato,
    instalacionId: api.instalacion,
    instalacionNombre: api.instalacion_nombre ?? "",
    empresaNombre: api.empresa_nombre ?? null,
    nivel: api.nivel,
    horasRespuesta: api.horas_respuesta,
    frecuenciaPreventivoDias: api.frecuencia_preventivo_dias,
    fechaInicio: api.fecha_inicio,
    fechaFin: api.fecha_fin ?? null,
    activo: api.activo,
  }
}

function normalizeChecklist(checklist: ApiPlanMantenimiento["checklist"]): PlanChecklistItem[] {
  if (!checklist) return []
  const items = Array.isArray(checklist) ? checklist : [checklist]
  return items
    .map((item): PlanChecklistItem | null => {
      if (typeof item === "string") {
        return item.trim() ? { titulo: item.trim(), requerido: null } : null
      }
      const title = item.titulo ?? item.title
      if (!title) return null
      return {
        titulo: title,
        requerido: item.requerido ?? item.required ?? null,
      }
    })
    .filter((item): item is PlanChecklistItem => item != null)
}

function normalizePlan(api: ApiPlanMantenimiento): PlanMantenimiento {
  return {
    id: api.idplan,
    nombre: api.nombre,
    tipoSistema: api.tipo_sistema,
    frecuenciaDias: api.frecuencia_dias,
    duracionEstimadaHoras: Number(api.duracion_estimada_horas),
    checklist: normalizeChecklist(api.checklist),
    especialidadRequerida: api.especialidad_requerida ?? null,
    especialidadNombre: api.especialidad_nombre ?? null,
    activo: api.activo,
  }
}

function extractList<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results ?? []
}

/* ---------- Hooks ---------- */

export interface UseMantenimientosParams {
  instalacion?: number
  estado?: string
  plan?: number
  desde?: string
  hasta?: string
  limit?: number
}

export function useMantenimientos(params?: UseMantenimientosParams) {
  return useQuery({
    queryKey: ["mantenimientos", params],
    queryFn: () =>
      mantenimientoService
        .programados(params)
        .then((d) => extractList(d).map(normalizeMantenimiento)),
    staleTime: 60_000,
  })
}

export function useContratos(params?: { activo?: boolean }) {
  return useQuery({
    queryKey: ["contratos", params],
    queryFn: () =>
      mantenimientoService
        .contratos(params)
        .then((d) => extractList(d as PaginatedResponse<ApiContrato> | ApiContrato[]).map(normalizeContrato)),
    staleTime: 120_000,
  })
}

export function usePlanes(params?: { tipo_sistema?: string; activo?: boolean }) {
  return useQuery({
    queryKey: ["planes-mantenimiento", params],
    queryFn: () =>
      mantenimientoService
        .planes(params)
        .then((d) =>
          extractList(d as PaginatedResponse<ApiPlanMantenimiento> | ApiPlanMantenimiento[]).map(normalizePlan)
        ),
    staleTime: 300_000,
  })
}

export function useCancelarMantenimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      mantenimientoService.cancelar(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mantenimientos"] })
      toast.success("Mantenimiento cancelado")
    },
    onError: () => toast.error("No se pudo cancelar el mantenimiento"),
  })
}
