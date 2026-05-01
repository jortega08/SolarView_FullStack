import { useQuery } from "@tanstack/react-query"
import { empresaService } from "@/services/empresa.service"
import type { InstalacionDetalle } from "@/types/domain"
import type { ApiDetalleInstalacionResponse, ApiInstalacionDetalle } from "@/types/api"

type DetallePayload = ApiInstalacionDetalle | ApiDetalleInstalacionResponse

function normalize(api: DetallePayload): InstalacionDetalle {
  const hasWrapper = "instalacion" in api
  const inst = hasWrapper && api.instalacion ? api.instalacion : (api as ApiInstalacionDetalle)
  const bateria = hasWrapper ? api.bateria : null
  const consumoHoy = hasWrapper ? api.consumo_hoy : null
  const consumoTotal =
    consumoHoy != null ? (consumoHoy.solar ?? 0) + (consumoHoy.electrica ?? 0) : null

  return {
    id: inst.id ?? inst.idinstalacion ?? 0,
    nombre: inst.nombre ?? "",
    estado: (inst.estado ?? "inactiva") as InstalacionDetalle["estado"],
    tipoSistema: (inst.tipo_sistema ?? "hibrido") as InstalacionDetalle["tipoSistema"],
    capacidadSolarKwp: inst.capacidad_solar_kwp ?? inst.capacidad_panel_kw ?? 0,
    capacidadBateriaKwh: inst.capacidad_bateria_kwh ?? 0,
    ciudad: inst.ciudad ?? "",
    imagen: inst.imagen ?? null,
    ultimaActualizacion: inst.ultima_actualizacion ?? bateria?.fecha ?? null,
    potenciaActual: inst.potencia_actual ?? null,
    generacionHoy: inst.generacion_hoy ?? consumoHoy?.solar ?? null,
    consumoActual: inst.consumo_actual ?? consumoTotal,
    bateriaSoc: inst.bateria_soc ?? bateria?.soc ?? bateria?.porcentaje_carga ?? null,
    eficiencia: inst.eficiencia ?? null,
  }
}

export function useDetalleInstalacion(id: number | null) {
  return useQuery({
    queryKey: ["instalacion-detalle", id],
    queryFn: () => empresaService.instalacion(id!).then(normalize),
    enabled: id != null,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
