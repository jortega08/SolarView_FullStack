import { apiClient } from "./apiClient"

interface FacturaMensualParams {
  domicilio_id: number
  mes: number
  ano: number
}

export const facturaService = {
  mensual: (params: FacturaMensualParams) =>
    apiClient.get("/factura/mensual/", { params }).then((r) => r.data),
}
