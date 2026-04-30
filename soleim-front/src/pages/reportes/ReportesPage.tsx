import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarCheck2,
  Download,
  FileDown,
  FileText,
  ReceiptText,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/feedback/EmptyState"
import { CsvDownloadButton } from "@/features/reportes/CsvDownloadButton"
import { MonthlyInvoicePanel } from "@/features/reportes/MonthlyInvoicePanel"
import { PdfDownloadButton } from "@/features/reportes/PdfDownloadButton"
import { ReportCard } from "@/features/reportes/ReportCard"
import { ReportExportPanel } from "@/features/reportes/ReportExportPanel"
import { ReportFilters } from "@/features/reportes/ReportFilters"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { useMantenimientos } from "@/hooks/useMantenimientos"
import { useOrdenes } from "@/hooks/useOrdenes"
import { usePanelEmpresa } from "@/hooks/usePanelEmpresa"
import type { PdfReportRequest } from "@/hooks/useReportes"
import type { ReportFiltersState, ReporteFormato } from "@/types/domain"

interface LocalDownload {
  filename: string
  tipo: string
  date: string
}

function currentYear(): number {
  return new Date().getFullYear()
}

function currentMonth(): number {
  return new Date().getMonth() + 1
}

const DEFAULT_FILTERS: ReportFiltersState = {
  periodo: "30d",
  mes: currentMonth(),
  ano: currentYear(),
  tipo: "consumo",
  fuente: "todas",
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function subtractDays(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function daysBetween(start?: string, end?: string): number {
  if (!start || !end) return 30
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 30
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1)
}

function reportDays(filters: ReportFiltersState): number {
  if (filters.periodo === "7d") return 7
  if (filters.periodo === "90d") return 90
  if (filters.periodo === "custom") {
    const start = filters.fechaInicio ?? toDateInput(subtractDays(29))
    const end = filters.fechaFin ?? toDateInput(new Date())
    return daysBetween(start, end)
  }
  return 30
}

function periodLabel(filters: ReportFiltersState, dias: number): string {
  if (filters.periodo === "custom") return `${dias} días`
  if (filters.periodo === "7d") return "Últimos 7 días"
  if (filters.periodo === "90d") return "Últimos 90 días"
  return "Últimos 30 días"
}

export default function ReportesPage() {
  const [draftFilters, setDraftFilters] = useState<ReportFiltersState>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<ReportFiltersState>(DEFAULT_FILTERS)
  const [formato, setFormato] = useState<ReporteFormato>("csv")
  const [downloads, setDownloads] = useState<LocalDownload[]>([])
  const [autoSelected, setAutoSelected] = useState(false)

  const { data: panel } = usePanelEmpresa()
  const { data: instalaciones = [], isLoading: instalacionesLoading } = useInstalaciones()
  const { data: mantenimientos = [] } = useMantenimientos({
    instalacion: appliedFilters.instalacionId,
  })
  const { data: ordenes = [] } = useOrdenes({
    instalacion: appliedFilters.instalacionId,
    limit: 200,
  })

  useEffect(() => {
    if (!autoSelected && instalaciones[0]) {
      const nextDraft = { ...draftFilters, instalacionId: instalaciones[0].id }
      const nextApplied = { ...appliedFilters, instalacionId: instalaciones[0].id }
      setDraftFilters(nextDraft)
      setAppliedFilters(nextApplied)
      setAutoSelected(true)
    }
  }, [appliedFilters, autoSelected, draftFilters, instalaciones])

  const dias = useMemo(() => reportDays(appliedFilters), [appliedFilters])
  const periodo = useMemo(() => periodLabel(appliedFilters, dias), [appliedFilters, dias])
  const selectedInstalacion = instalaciones.find((instalacion) => instalacion.id === appliedFilters.instalacionId)
  const csvKind = appliedFilters.tipo === "alertas" ? "alertas" : "consumo"
  const canHeaderCsv = appliedFilters.tipo === "consumo" || appliedFilters.tipo === "alertas"
  const hasMaintenanceData = mantenimientos.length > 0
  const hasSlaData =
    panel?.slaEnRiesgo != null ||
    ordenes.some((orden) => orden.slaEstado != null || orden.slaObjetivoHoras != null)
  const pdfRequest: PdfReportRequest = useMemo(
    () => ({
      tipo: appliedFilters.tipo,
      params: appliedFilters.instalacionId ? { instalacion_id: appliedFilters.instalacionId, dias } : undefined,
      periodoLabel: periodo,
      instalacionNombre: selectedInstalacion?.nombre,
      mantenimientos,
      ordenes,
      panel,
    }),
    [appliedFilters.tipo, appliedFilters.instalacionId, dias, mantenimientos, ordenes, panel, periodo, selectedInstalacion?.nombre]
  )

  const recordDownload = (tipo: string) => (filename: string) => {
    setDownloads((current) => [
      { filename, tipo, date: new Date().toLocaleString("es-CO") },
      ...current,
    ].slice(0, 6))
  }

  const scrollToExport = () => document.getElementById("report-export")?.scrollIntoView({ behavior: "smooth", block: "start" })
  const scrollToInvoice = () => document.getElementById("monthly-invoice")?.scrollIntoView({ behavior: "smooth", block: "start" })

  const clearFilters = () => {
    const next = { ...DEFAULT_FILTERS, instalacionId: instalaciones[0]?.id }
    setDraftFilters(next)
    setAppliedFilters(next)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reportes"
        description="Exportación y consulta de reportes de consumo, alertas, mantenimiento y facturación."
        actions={
          <>
            <button
              type="button"
              onClick={scrollToExport}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)]"
            >
              <FileText className="h-3.5 w-3.5" />
              Generar reporte
            </button>
            <CsvDownloadButton
              tipo={csvKind}
              instalacionId={appliedFilters.instalacionId}
              dias={dias}
              label="Exportar CSV"
              disabled={!canHeaderCsv}
              className="border border-[var(--color-primary-700)]"
              onDownloaded={recordDownload(appliedFilters.tipo)}
            />
            {appliedFilters.tipo === "factura" ? (
              <button
                type="button"
                onClick={scrollToInvoice}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)]"
              >
                <FileDown className="h-3.5 w-3.5" />
                Exportar PDF
              </button>
            ) : (
              <PdfDownloadButton
                request={pdfRequest}
                label="Exportar PDF"
                onDownloaded={recordDownload(`${appliedFilters.tipo} pdf`)}
              />
            )}
          </>
        }
      />

      <ReportFilters
        value={draftFilters}
        instalaciones={instalaciones}
        loading={instalacionesLoading}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters(draftFilters)}
        onClear={clearFilters}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ReportCard
          title="Reporte de consumo"
          description="Detalle de consumo energético por fuente para una instalación."
          formats={["CSV", "PDF"]}
          icon={Zap}
          tone="primary"
          action={
            <div className="grid grid-cols-2 gap-2">
              <CsvDownloadButton
                tipo="consumo"
                instalacionId={appliedFilters.instalacionId}
                dias={dias}
                label="CSV"
                className="w-full"
                onDownloaded={recordDownload("consumo")}
              />
              <PdfDownloadButton
                request={{ ...pdfRequest, tipo: "consumo" }}
                label="PDF"
                className="w-full"
                onDownloaded={recordDownload("consumo pdf")}
              />
            </div>
          }
        />
        <ReportCard
          title="Reporte de alertas"
          description="Alertas, severidad, estado, causa probable y resolución."
          formats={["CSV", "PDF"]}
          icon={AlertTriangle}
          tone="danger"
          action={
            <div className="grid grid-cols-2 gap-2">
              <CsvDownloadButton
                tipo="alertas"
                instalacionId={appliedFilters.instalacionId}
                dias={dias}
                label="CSV"
                className="w-full"
                onDownloaded={recordDownload("alertas")}
              />
              <PdfDownloadButton
                request={{ ...pdfRequest, tipo: "alertas" }}
                label="PDF"
                className="w-full"
                onDownloaded={recordDownload("alertas pdf")}
              />
            </div>
          }
        />
        <ReportCard
          title="Reporte de mantenimiento"
          description="Vista operativa basada en mantenimientos visibles del backend."
          formats={["PDF"]}
          icon={CalendarCheck2}
          tone="solar"
          action={
            <PdfDownloadButton
              request={{ ...pdfRequest, tipo: "mantenimiento" }}
              label="Descargar PDF"
              disabled={!hasMaintenanceData}
              className="w-full"
              onDownloaded={recordDownload("mantenimiento pdf")}
            />
          }
        />
        <ReportCard
          title="Reporte de SLA"
          description="Indicadores de SLA disponibles cuando el panel expone estado de riesgo."
          formats={["PDF"]}
          icon={ShieldCheck}
          tone="sla"
          action={
            <PdfDownloadButton
              request={{ ...pdfRequest, tipo: "sla" }}
              label="Descargar PDF"
              disabled={!hasSlaData}
              className="w-full"
              onDownloaded={recordDownload("sla pdf")}
            />
          }
        />
        <ReportCard
          title="Factura mensual"
          description="Consulta y PDF de factura por domicilio, mes y año."
          formats={["Vista", "PDF"]}
          icon={ReceiptText}
          tone="energy"
          action={
            <button
              type="button"
              onClick={scrollToInvoice}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)]"
            >
              <Download className="h-3.5 w-3.5" />
              Consultar
            </button>
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div id="report-export" className="xl:col-span-1">
          <ReportExportPanel
            filters={appliedFilters}
            dias={dias}
            formato={formato}
            pdfRequest={pdfRequest}
            onFormatoChange={setFormato}
            onDownloaded={recordDownload(appliedFilters.tipo)}
          />
        </div>
        <div className="xl:col-span-2">
          <SessionHistory downloads={downloads} />
        </div>
      </section>

      <div id="monthly-invoice">
        <MonthlyInvoicePanel mes={appliedFilters.mes} ano={appliedFilters.ano} />
      </div>
    </div>
  )
}

function SessionHistory({ downloads }: { downloads: LocalDownload[] }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Historial y vista previa</h3>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          El backend no expone historial persistente; esta lista solo registra descargas de la sesión actual.
        </p>
      </div>
      {downloads.length === 0 ? (
        <EmptyState
          title="Historial no disponible"
          description="Las descargas realizadas en esta sesión aparecerán aquí temporalmente."
          icon={FileText}
          className="py-12"
        />
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {downloads.map((download) => (
            <div key={`${download.filename}-${download.date}`} className="grid grid-cols-1 gap-2 px-4 py-3 text-xs md:grid-cols-[1fr_120px_180px]">
              <span className="truncate font-semibold text-[var(--color-text-primary)]">{download.filename}</span>
              <span className="capitalize text-[var(--color-text-secondary)]">{download.tipo}</span>
              <span className="tabular text-[var(--color-text-muted)]">{download.date}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
