import { useQuery } from "@tanstack/react-query"
import { empresaService } from "@/services/empresa.service"
import { facturaService, type FacturaMensualParams } from "@/services/factura.service"
import type { ApiDomicilio, ApiFacturaMensual } from "@/types/api"
import type { Domicilio, FacturaMensual } from "@/types/domain"

function normalizeDomicilio(api: ApiDomicilio): Domicilio {
  return {
    id: api.iddomicilio,
    ciudadId: api.ciudad ?? null,
    usuarioId: api.usuario ?? null,
    usuarioNombre: api.usuario_nombre ?? null,
    ciudadNombre: api.ciudad_nombre ?? null,
  }
}

function normalizeFactura(api: ApiFacturaMensual): FacturaMensual {
  return {
    electrica: api.electrica ?? null,
    solar: api.solar ?? null,
    costo: api.costo ?? null,
    fechaEmision: api.fecha_emision ?? null,
    usuario: api.usuario ?? null,
    domicilio: api.domicilio ?? null,
    ciudad: api.ciudad ?? null,
  }
}

export function useDomicilios() {
  return useQuery({
    queryKey: ["domicilios"],
    queryFn: () => empresaService.domicilios().then((res) => res.map(normalizeDomicilio)),
    staleTime: 300_000,
  })
}

export function useFacturaMensual(params: FacturaMensualParams | null) {
  return useQuery({
    queryKey: ["factura-mensual", params],
    queryFn: () => facturaService.mensual(params!).then(normalizeFactura),
    enabled: params != null,
    staleTime: 60_000,
  })
}
