import { useQuery } from "@tanstack/react-query"
import { empresaService } from "@/services/empresa.service"
import type { PanelEmpresa } from "@/types/domain"
import type { ApiPanelEmpresa } from "@/types/api"

function normalize(api: ApiPanelEmpresa): PanelEmpresa {
  const instalaciones = api.instalaciones ?? []
  const empresa =
    typeof api.empresa === "string"
      ? api.empresa
      : api.empresa?.nombre ?? ""
  const activas = instalaciones.filter((i) =>
    ["activa", "activo", "en_linea", "online"].includes(i.estado)
  ).length

  return {
    empresa,
    instalacionesActivas: api.instalaciones_activas ?? (instalaciones.length > 0 ? activas : api.resumen?.total ?? 0),
    generacionHoy: api.total_generacion_hoy ?? null,
    ahorroEstimado: api.ahorro_estimado ?? null,
    alertasCriticas: api.alertas_criticas ?? api.resumen?.con_alerta_critica ?? 0,
    ordenesAbiertas: api.ordenes_abiertas ?? null,
    slaEnRiesgo: api.sla_en_riesgo ?? null,
    instalaciones: instalaciones.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      estado: (i.estado ?? "inactiva") as PanelEmpresa["instalaciones"][0]["estado"],
      bateriaSoc: i.bateria_soc ?? i.bateria_pct ?? null,
      potenciaActual: i.potencia_actual ?? null,
      generacionHoy: i.generacion_hoy ?? null,
      tipoSistema: (i.tipo_sistema ?? null) as PanelEmpresa["instalaciones"][0]["tipoSistema"],
      ciudad: i.ciudad ?? null,
      imagen: i.imagen ?? null,
      riesgo: i.riesgo ?? null,
    })),
    clima: api.clima
      ? {
          temperatura: api.clima.temperatura ?? null,
          humedad: api.clima.humedad ?? null,
          viento: api.clima.viento ?? null,
          descripcion: api.clima.descripcion ?? null,
          irradiancia: api.clima.irradiancia ?? null,
        }
      : null,
    fuentesEnergia: api.fuentes_energia
      ? {
          solarKwh: api.fuentes_energia.solar_kwh ?? null,
          redKwh: api.fuentes_energia.red_kwh ?? null,
          solarPct: api.fuentes_energia.solar_pct ?? null,
          redPct: api.fuentes_energia.red_pct ?? null,
        }
      : null,
  }
}

export function usePanelEmpresa(empresaId?: number) {
  return useQuery({
    queryKey: ["panel-empresa", empresaId],
    queryFn: () => empresaService.panel(empresaId).then(normalize),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
