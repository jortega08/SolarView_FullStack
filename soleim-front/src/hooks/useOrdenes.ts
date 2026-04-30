import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ordenesService } from "@/services/ordenes.service"
import { toast } from "sonner"
import type {
  Orden,
  ComentarioOrden,
  EvidenciaOrden,
} from "@/types/domain"
import type {
  ApiOrden,
  ApiComentarioOrden,
  ApiEvidenciaOrden,
  PaginatedResponse,
} from "@/types/api"

function normalize(api: ApiOrden): Orden {
  const id = api.id ?? api.idorden ?? 0
  return {
    id,
    codigo: api.codigo ?? `ORD-${id}`,
    instalacionId: api.instalacion,
    instalacionNombre: api.instalacion_nombre ?? "",
    empresaNombre: api.empresa_nombre ?? null,
    tipo: api.tipo ?? null,
    titulo: api.titulo,
    descripcion: api.descripcion ?? null,
    notasResolucion: api.notas_resolucion ?? null,
    estado: (api.estado ?? "abierta") as Orden["estado"],
    prioridad: (api.prioridad ?? "media") as Orden["prioridad"],
    tecnicoId: api.tecnico ?? api.asignado_a ?? null,
    tecnicoNombre: api.tecnico_nombre ?? api.asignado_a_nombre ?? null,
    alertaId: api.alerta ?? null,
    mantenimientoId: api.mantenimiento ?? null,
    fechaCreacion: api.fecha_creacion ?? api.creada_at ?? "",
    fechaAsignacion: api.fecha_asignacion ?? api.asignada_at ?? null,
    fechaInicio: api.iniciada_at ?? null,
    fechaCompletada: api.completada_at ?? null,
    fechaCerrada: api.cerrada_at ?? null,
    fechaVencimiento: api.fecha_vencimiento ?? null,
    slaEstado: api.sla_estado ?? (api.sla_vencido ? "vencido" : null),
    slaVencido: api.sla_vencido ?? false,
    slaObjetivoHoras: api.sla_objetivo_horas ?? null,
    tiempoResolucionHoras: api.tiempo_resolucion_horas ?? null,
  }
}

function normalizeComentario(api: ApiComentarioOrden): ComentarioOrden {
  return {
    id: api.idcomentario,
    ordenId: api.orden,
    usuarioId: api.usuario,
    usuarioNombre: api.usuario_nombre ?? "",
    tipo: api.tipo ?? "comentario",
    texto: api.texto,
    fechaCreacion: api.creado_at,
  }
}

function normalizeEvidencia(api: ApiEvidenciaOrden): EvidenciaOrden {
  return {
    id: api.idevidencia,
    ordenId: api.orden,
    tipo: api.tipo,
    archivoUrl: api.archivo_url ?? api.archivo ?? null,
    descripcion: api.descripcion ?? "",
    subidoPorId: api.subido_por ?? null,
    subidoPorNombre: api.subido_por_nombre ?? "",
    fechaCreacion: api.creado_at,
  }
}

function extractList(data: PaginatedResponse<ApiOrden> | ApiOrden[]): ApiOrden[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export interface UseOrdenesParams {
  estado?: string
  prioridad?: string
  instalacion?: number
  asignado_a?: number
  tecnico?: number
  limit?: number
  enabled?: boolean
}

export function useOrdenes(params?: UseOrdenesParams) {
  const { enabled = true, ...queryParams } = params ?? {}
  return useQuery({
    queryKey: ["ordenes", queryParams],
    queryFn: () => ordenesService.listar(queryParams).then((d) => extractList(d).map(normalize)),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useOrden(id: number | null) {
  return useQuery({
    queryKey: ["orden", id],
    queryFn: () => ordenesService.detalle(id as number).then(normalize),
    enabled: id != null,
    staleTime: 15_000,
  })
}

export function useComentariosOrden(id: number | null) {
  return useQuery({
    queryKey: ["orden-comentarios", id],
    queryFn: () =>
      ordenesService
        .comentarios(id as number)
        .then((list) => list.map(normalizeComentario)),
    enabled: id != null,
    staleTime: 10_000,
  })
}

export function useAgregarComentario(ordenId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (texto: string) =>
      ordenesService.agregarComentario(ordenId as number, texto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orden-comentarios", ordenId] })
      toast.success("Comentario agregado")
    },
    onError: () => toast.error("No se pudo agregar el comentario"),
  })
}

export function useEvidenciasOrden(id: number | null) {
  return useQuery({
    queryKey: ["orden-evidencias", id],
    queryFn: () =>
      ordenesService
        .evidencias(id as number)
        .then((list) => list.map(normalizeEvidencia)),
    enabled: id != null,
    staleTime: 30_000,
  })
}

export function useSubirEvidencia(ordenId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      archivo: File
      tipo?: "foto" | "firma" | "documento"
      descripcion?: string
    }) =>
      ordenesService.subirEvidencia(
        ordenId as number,
        input.archivo,
        input.tipo ?? "foto",
        input.descripcion
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orden-evidencias", ordenId] })
      toast.success("Evidencia cargada")
    },
    onError: () => toast.error("No se pudo subir la evidencia"),
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

export function useAsignarOrden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: number; tecnicoId: number; slaObjetivoHoras?: number }) =>
      ordenesService.asignar(input.id, input.tecnicoId, input.slaObjetivoHoras),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["ordenes"] })
      qc.invalidateQueries({ queryKey: ["orden", variables.id] })
      toast.success("Orden asignada")
    },
    onError: () => toast.error("No se pudo asignar la orden"),
  })
}

export function useTransicionarOrden() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: number
      accion: "iniciar" | "completar" | "cerrar" | "cancelar"
      notasResolucion?: string
      motivo?: string
    }) => {
      const { id, accion, notasResolucion, motivo } = input
      switch (accion) {
        case "iniciar":
          return ordenesService.iniciar(id)
        case "completar":
          return ordenesService.completar(id, notasResolucion)
        case "cerrar":
          return ordenesService.cerrar(id)
        case "cancelar":
          return ordenesService.cancelar(id, motivo)
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["ordenes"] })
      qc.invalidateQueries({ queryKey: ["orden", variables.id] })
      qc.invalidateQueries({ queryKey: ["panel-empresa"] })
      qc.invalidateQueries({ queryKey: ["alertas"] })
      const labels: Record<typeof variables.accion, string> = {
        iniciar: "Orden iniciada",
        completar: "Orden completada",
        cerrar: "Orden cerrada",
        cancelar: "Orden cancelada",
      }
      toast.success(labels[variables.accion])
    },
    onError: () => toast.error("No se pudo actualizar la orden"),
  })
}
