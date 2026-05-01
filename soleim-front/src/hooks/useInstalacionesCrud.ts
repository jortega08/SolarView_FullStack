import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  instalacionesCrudService,
  type InstalacionPayload,
  type SensorPayload,
} from "@/services/instalaciones-crud.service"
import type { ApiInstalacionCrud, ApiSensor } from "@/types/api"
import type { InstalacionCrud, SensorInstalacion } from "@/types/domain"
import type { EstadoInstalacion, TipoSistema } from "@/types/enums"

function normalizeInstalacion(api: ApiInstalacionCrud): InstalacionCrud {
  return {
    id: api.idinstalacion,
    empresaId: api.empresa,
    empresaNombre: api.empresa_nombre ?? null,
    nombre: api.nombre,
    direccion: api.direccion ?? "",
    ciudadId: api.ciudad ?? null,
    ciudadNombre: api.ciudad_nombre ?? null,
    tipoSistema: api.tipo_sistema as TipoSistema,
    capacidadPanelKw: Number(api.capacidad_panel_kw ?? 0),
    capacidadBateriaKwh: Number(api.capacidad_bateria_kwh ?? 0),
    fechaInstalacion: api.fecha_instalacion ?? null,
    estado: api.estado as EstadoInstalacion,
    imagenUrl: api.imagen_url ?? api.imagen ?? null,
  }
}

function normalizeSensor(api: ApiSensor): SensorInstalacion {
  return {
    id: api.idsensor,
    instalacionId: api.instalacion ?? null,
    instalacionNombre: api.instalacion_nombre ?? null,
    nombre: api.nombre,
    codigo: api.codigo,
    tipo: api.tipo,
    unidad: api.unidad ?? "",
    estado: api.estado,
    ultimaLectura: api.ultima_lectura ?? null,
    fechaUltimaLectura: api.fecha_ultima_lectura ?? null,
    notas: api.notas ?? "",
  }
}

export function useInstalacionesCrud() {
  return useQuery({
    queryKey: ["instalaciones-crud"],
    queryFn: () => instalacionesCrudService.listar().then((data) => data.map(normalizeInstalacion)),
    staleTime: 60_000,
  })
}

export function useSensores(params?: { instalacion?: number }) {
  return useQuery({
    queryKey: ["sensores", params],
    queryFn: () => instalacionesCrudService.sensores(params).then((data) => data.map(normalizeSensor)),
    staleTime: 30_000,
  })
}

export function useInstalacionMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["instalaciones"] })
    void queryClient.invalidateQueries({ queryKey: ["instalaciones-crud"] })
  }

  return {
    crear: useMutation({
      mutationFn: (payload: InstalacionPayload) => instalacionesCrudService.crear(payload),
      onSuccess: invalidate,
    }),
    actualizar: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: InstalacionPayload }) =>
        instalacionesCrudService.actualizar(id, payload),
      onSuccess: invalidate,
    }),
    eliminar: useMutation({
      mutationFn: (id: number) => instalacionesCrudService.eliminar(id),
      onSuccess: invalidate,
    }),
  }
}

export function useSensorMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["sensores"] })
  }

  return {
    crear: useMutation({
      mutationFn: (payload: SensorPayload) => instalacionesCrudService.crearSensor(payload),
      onSuccess: invalidate,
    }),
    actualizar: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<SensorPayload> }) =>
        instalacionesCrudService.actualizarSensor(id, payload),
      onSuccess: invalidate,
    }),
    eliminar: useMutation({
      mutationFn: (id: number) => instalacionesCrudService.eliminarSensor(id),
      onSuccess: invalidate,
    }),
  }
}
