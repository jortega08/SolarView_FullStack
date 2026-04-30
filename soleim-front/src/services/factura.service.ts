import { apiClient } from "./apiClient"
import type { ApiFacturaMensual } from "@/types/api"

export interface FacturaMensualParams {
  domicilio_id: number
  mes: number
  ano: number
}

export const facturaService = {
  mensual: (params: FacturaMensualParams) =>
    apiClient.get<ApiFacturaMensual>("/factura/mensual/", { params }).then((r) => r.data),
}
