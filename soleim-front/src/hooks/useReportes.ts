import axios from "axios"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { empresaService, type CsvReportDownload, type CsvReportParams } from "@/services/empresa.service"
import type { ApiEmpresaBasica } from "@/types/api"
import type { EmpresaBasica, MantenimientoProgramado, Orden, PanelEmpresa, ReporteTipo } from "@/types/domain"

export type CsvReportKind = "consumo" | "alertas"

export interface CsvReportRequest {
  tipo: CsvReportKind
  params: CsvReportParams
}

export interface PdfReportRequest {
  tipo: ReporteTipo
  params?: CsvReportParams
  periodoLabel: string
  instalacionNombre?: string
  mantenimientos?: MantenimientoProgramado[]
  ordenes?: Orden[]
  panel?: PanelEmpresa | null
}

function normalizeEmpresa(api: ApiEmpresaBasica): EmpresaBasica {
  return {
    id: api.idempresa,
    nombre: api.nombre,
    nit: api.nit ?? null,
    sector: api.sector ?? null,
    ciudadNombre: api.ciudad_nombre ?? null,
  }
}

async function errorMessageFromUnknown(error: unknown): Promise<string> {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data instanceof Blob) {
      const text = await data.text()
      try {
        const payload = JSON.parse(text) as { error?: string; detail?: string }
        return payload.error ?? payload.detail ?? "No se pudo descargar el reporte"
      } catch {
        return "No se pudo descargar el reporte"
      }
    }
    if (typeof data === "object" && data != null) {
      const payload = data as { error?: string; detail?: string }
      return payload.error ?? payload.detail ?? "No se pudo descargar el reporte"
    }
  }
  return error instanceof Error ? error.message : "No se pudo descargar el reporte"
}

function saveBlob({ blob, filename }: CsvReportDownload) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function toPdfFilename(filename: string, fallback: string): string {
  if (!filename) return fallback
  return filename.replace(/\.csv$/i, ".pdf")
}

function normalizeCell(value: unknown): string {
  if (value == null || value === "") return "-"
  return String(value)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatNumber(value: number | null | undefined, suffix = ""): string {
  if (value == null) return "-"
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value)}${suffix}`
}

async function loadPdfTools() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])
  return { jsPDF, autoTable }
}

async function parseCsv(blob: Blob): Promise<{ headers: string[]; rows: string[][] }> {
  const text = (await blob.text()).replace(/^\uFEFF/, "")
  const { default: Papa } = await import("papaparse")
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  })
  const rows = parsed.data.filter((row) => row.length > 0)
  return {
    headers: rows[0] ?? [],
    rows: rows.slice(1),
  }
}

async function exportTablePdf(input: {
  title: string
  subtitle: string
  filename: string
  head: string[]
  body: string[][]
  summary?: Array<[string, string]>
}) {
  const { jsPDF, autoTable } = await loadPdfTools()
  const doc = new jsPDF({ orientation: input.head.length > 6 ? "landscape" : "portrait" })
  const generatedAt = new Date().toLocaleString("es-CO")

  doc.setFontSize(15)
  doc.text(input.title, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(input.subtitle, 14, 23)
  doc.text(`Generado: ${generatedAt}`, 14, 29)

  let startY = 36
  if (input.summary && input.summary.length > 0) {
    autoTable(doc, {
      startY,
      head: [["Indicador", "Valor"]],
      body: input.summary,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    })
    startY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY
    startY += 8
  }

  autoTable(doc, {
    startY,
    head: [input.head],
    body: input.body.length > 0 ? input.body : [["Sin datos disponibles"]],
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
  })

  doc.save(input.filename)
}

async function buildCsvPdf(request: PdfReportRequest, tipo: CsvReportKind) {
  if (!request.params?.instalacion_id) {
    throw new Error("Selecciona una instalación para generar el PDF")
  }

  const download =
    tipo === "consumo"
      ? await empresaService.reporteConsumo(request.params)
      : await empresaService.reporteAlertas(request.params)
  const parsed = await parseCsv(download.blob)
  if (parsed.headers.length === 0) {
    throw new Error("El reporte no tiene columnas para exportar")
  }

  await exportTablePdf({
    title: tipo === "consumo" ? "Reporte de consumo" : "Reporte de alertas",
    subtitle: `${request.instalacionNombre ?? `Instalación ${request.params.instalacion_id}`} · ${request.periodoLabel}`,
    filename: toPdfFilename(
      download.filename,
      tipo === "consumo" ? "reporte_consumo.pdf" : "reporte_alertas.pdf"
    ),
    head: parsed.headers.map(normalizeCell),
    body: parsed.rows.map((row) => row.map(normalizeCell)),
  })

  return toPdfFilename(download.filename, `${tipo}.pdf`)
}

async function buildMaintenancePdf(request: PdfReportRequest) {
  const mantenimientos = request.mantenimientos ?? []
  if (mantenimientos.length === 0) {
    throw new Error("No hay mantenimientos disponibles para exportar")
  }

  await exportTablePdf({
    title: "Reporte de mantenimiento",
    subtitle: `${request.instalacionNombre ?? "Instalaciones visibles"} · ${request.periodoLabel}`,
    filename: "reporte_mantenimiento.pdf",
    head: ["Instalación", "Tipo", "Fecha", "Estado", "Orden", "Técnico", "Prioridad"],
    body: mantenimientos.map((item) => [
      item.instalacionNombre || "-",
      item.tipo,
      formatDate(item.fechaProgramada),
      item.estado,
      item.ordenCodigo ?? "-",
      item.tecnicoNombre ?? "-",
      item.prioridad ?? "-",
    ]),
  })
  return "reporte_mantenimiento.pdf"
}

async function buildSlaPdf(request: PdfReportRequest) {
  const ordenes = request.ordenes ?? []
  const slaRows = ordenes
    .filter((orden) => orden.slaEstado != null || orden.slaObjetivoHoras != null || orden.slaVencido)
    .map((orden) => [
      orden.codigo,
      orden.instalacionNombre || "-",
      orden.estado,
      orden.slaEstado ?? "-",
      orden.slaVencido ? "Sí" : "No",
      formatNumber(orden.slaObjetivoHoras, " h"),
      formatNumber(orden.tiempoResolucionHoras, " h"),
      formatDate(orden.fechaVencimiento),
    ])

  const summary: Array<[string, string]> = [
    ["Empresa", request.panel?.empresa ?? "-"],
    ["Órdenes abiertas", formatNumber(request.panel?.ordenesAbiertas)],
    ["SLA en riesgo", formatNumber(request.panel?.slaEnRiesgo)],
    ["Instalación", request.instalacionNombre ?? "Instalaciones visibles"],
    ["Periodo", request.periodoLabel],
  ]

  if (slaRows.length === 0 && request.panel?.slaEnRiesgo == null) {
    throw new Error("No hay datos SLA disponibles para exportar")
  }

  await exportTablePdf({
    title: "Reporte de SLA",
    subtitle: `${request.instalacionNombre ?? "Instalaciones visibles"} · ${request.periodoLabel}`,
    filename: "reporte_sla.pdf",
    head: ["Orden", "Instalación", "Estado", "SLA", "Vencido", "Objetivo", "Resolución", "Vencimiento"],
    body: slaRows,
    summary,
  })
  return "reporte_sla.pdf"
}

export function useEmpresas() {
  return useQuery({
    queryKey: ["empresas"],
    queryFn: () => empresaService.empresas().then((res) => res.map(normalizeEmpresa)),
    staleTime: 300_000,
  })
}

export function useCsvReportDownload() {
  return useMutation({
    mutationFn: ({ tipo, params }: CsvReportRequest) =>
      tipo === "consumo"
        ? empresaService.reporteConsumo(params)
        : empresaService.reporteAlertas(params),
    onSuccess: (download, request) => {
      saveBlob(download)
      toast.success(
        request.tipo === "consumo"
          ? "Reporte de consumo descargado"
          : "Reporte de alertas descargado"
      )
    },
    onError: async (error) => {
      toast.error(await errorMessageFromUnknown(error))
    },
  })
}

export function usePdfReportDownload() {
  return useMutation({
    mutationFn: async (request: PdfReportRequest) => {
      if (request.tipo === "consumo") return buildCsvPdf(request, "consumo")
      if (request.tipo === "alertas") return buildCsvPdf(request, "alertas")
      if (request.tipo === "mantenimiento") return buildMaintenancePdf(request)
      if (request.tipo === "sla") return buildSlaPdf(request)
      throw new Error("La factura se exporta desde el panel de factura mensual")
    },
    onSuccess: (_filename, request) => {
      toast.success(`Reporte ${request.tipo} exportado en PDF`)
    },
    onError: async (error) => {
      toast.error(await errorMessageFromUnknown(error))
    },
  })
}
