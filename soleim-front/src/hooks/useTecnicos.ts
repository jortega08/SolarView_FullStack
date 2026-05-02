import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  tecnicosService,
  type PerfilProfesionalPayload,
  type TecnicoPayload,
} from "@/services/tecnicos.service"
import type { Especialidad, Tecnico } from "@/types/domain"
import type { ApiEspecialidad, ApiTecnico, PaginatedResponse } from "@/types/api"

function splitValue(value?: string | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeEstudios(value: ApiTecnico["estudios"]): string[] {
  if (!value) return []
  return value
    .map((item) => {
      if (typeof item === "string") return item
      return [item.titulo, item.institucion, item.ano].filter(Boolean).join(" - ")
    })
    .filter(Boolean)
}

export function normalizeTecnico(api: ApiTecnico): Tecnico {
  const id = api.idperfil ?? api.id ?? api.usuario ?? 0
  const especialidades = api.especialidades_nombres?.length
    ? api.especialidades_nombres
    : splitValue(api.especialidad)
  const zonas = api.zonas_nombres?.length ? api.zonas_nombres : splitValue(api.zona)

  return {
    id,
    usuarioId: api.usuario ?? null,
    nombre: api.nombre ?? api.usuario_nombre ?? api.usuario_email ?? `Técnico ${id}`,
    email: api.usuario_email ?? null,
    cedula: api.cedula ?? null,
    telefono: api.telefono ?? null,
    empresaId: api.empresa ?? null,
    empresaNombre: api.empresa_nombre ?? null,
    especialidad: especialidades.length ? especialidades.join(", ") : null,
    especialidades,
    especialidadesIds: api.especialidades ?? [],
    zona: zonas.length ? zonas.join(", ") : null,
    zonas,
    zonasIds: api.zonas ?? [],
    disponible: Boolean(api.disponible),
    areaProfesional: api.area_profesional?.trim() || null,
    resumenProfesional: api.resumen_profesional?.trim() || null,
    hojaVidaUrl: api.hoja_vida_url ?? api.hoja_vida ?? null,
    estudios: normalizeEstudios(api.estudios),
    cargaTrabajo: api.carga_actual ?? api.carga_trabajo ?? null,
    licenciaVence: api.licencia_vence ?? null,
    notas: api.notas ?? null,
    tituloAcademico: api.titulo_academico?.trim() || null,
    nivelEducativo: api.nivel_educativo || null,
    certificaciones: Array.isArray(api.certificaciones) ? api.certificaciones : [],
    capacidadOperacion: api.capacidad_operacion || null,
    score: api.score,
    razones: api.razones,
  }
}

function normalizeEspecialidad(api: ApiEspecialidad): Especialidad {
  return {
    id: api.idespecialidad,
    nombre: api.nombre,
    descripcion: api.descripcion ?? null,
  }
}

function extractList<T>(data: PaginatedResponse<T> | T[] | { results?: T[] }): T[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export function useTecnicos(params?: { empresa?: number; disponible?: boolean }) {
  return useQuery({
    queryKey: ["tecnicos", params],
    queryFn: () =>
      tecnicosService
        .perfiles(params)
        .then((d) => extractList(d).map(normalizeTecnico)),
    staleTime: 60_000,
  })
}

export function useTecnicosDisponibles(params?: {
  ciudad?: number
  especialidad?: number
  empresa?: number
}) {
  return useQuery({
    queryKey: ["tecnicos-disponibles", params],
    queryFn: () =>
      tecnicosService
        .disponibles({
          ciudad: params?.ciudad as number,
          especialidad: params?.especialidad,
          empresa: params?.empresa,
        })
        .then((d) => extractList(d).map(normalizeTecnico)),
    enabled: Boolean(params?.ciudad),
    staleTime: 30_000,
  })
}

export function useEspecialidades() {
  return useQuery({
    queryKey: ["especialidades"],
    queryFn: () =>
      tecnicosService
        .especialidades()
        .then((d): Especialidad[] => extractList(d).map(normalizeEspecialidad)),
    staleTime: 300_000,
  })
}

export function useMiPerfilTecnico() {
  return useQuery({
    queryKey: ["tecnicos", "me"],
    queryFn: () => tecnicosService.miPerfil().then(normalizeTecnico),
    retry: false,
    staleTime: 60_000,
  })
}

export function useTecnicoMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["tecnicos"] })
    void queryClient.invalidateQueries({ queryKey: ["tecnicos-disponibles"] })
  }

  return {
    crear: useMutation({
      mutationFn: (payload: TecnicoPayload) => tecnicosService.crear(payload),
      onSuccess: invalidate,
    }),
    actualizar: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<TecnicoPayload> }) =>
        tecnicosService.actualizar(id, payload),
      onSuccess: invalidate,
    }),
    eliminar: useMutation({
      mutationFn: (id: number) => tecnicosService.eliminar(id),
      onSuccess: invalidate,
    }),
  }
}

export function useTecnicosSugeridos(instalacionId: number | undefined) {
  return useQuery({
    queryKey: ["tecnicos-sugeridos", instalacionId],
    queryFn: () =>
      tecnicosService
        .sugeridos(instalacionId as number)
        .then((d) => (d.results ?? []).map(normalizeTecnico)),
    enabled: Boolean(instalacionId && instalacionId > 0),
    staleTime: 30_000,
  })
}

export function usePerfilProfesionalMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PerfilProfesionalPayload) =>
      tecnicosService.actualizarMiPerfil(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tecnicos"] })
      void queryClient.invalidateQueries({ queryKey: ["tecnicos", "me"] })
    },
  })
}
