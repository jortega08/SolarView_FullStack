import { DownloadCloud, FileWarning } from "lucide-react"
import { CsvDownloadButton } from "./CsvDownloadButton"
import { PdfDownloadButton } from "./PdfDownloadButton"
import type { PdfReportRequest } from "@/hooks/useReportes"
import type { ReportFiltersState, ReporteFormato } from "@/types/domain"

interface ReportExportPanelProps {
  filters: ReportFiltersState
  dias: number
  formato: ReporteFormato
  pdfRequest: PdfReportRequest
  onFormatoChange: (formato: ReporteFormato) => void
  onDownloaded?: (filename: string) => void
}

export function ReportExportPanel({
  filters,
  dias,
  formato,
  pdfRequest,
  onFormatoChange,
  onDownloaded,
}: ReportExportPanelProps) {
  const csvType = filters.tipo === "consumo" || filters.tipo === "alertas" ? filters.tipo : null
  const canDownloadCsv = formato === "csv" && csvType != null
  const canDownloadPdf = formato === "pdf" && filters.tipo !== "factura"

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <DownloadCloud className="h-4 w-4 text-[var(--color-primary-600)]" />
          Panel de exportación
        </h3>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          Descarga reportes disponibles con filtros aplicados.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <ExportMeta label="Tipo" value={filters.tipo} />
          <ExportMeta label="Periodo" value={`${dias} días`} />
          <ExportMeta label="Instalación" value={filters.instalacionId ? `ID ${filters.instalacionId}` : "No seleccionada"} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
              Formato
            </span>
            <select
              className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] outline-none"
              value={formato}
              onChange={(event) => onFormatoChange(event.target.value as ReporteFormato)}
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
        </div>

        {canDownloadCsv ? (
          <CsvDownloadButton
            tipo={csvType}
            instalacionId={filters.instalacionId}
            dias={dias}
            label={csvType === "consumo" ? "Descargar consumo" : "Descargar alertas"}
            className="w-full"
            onDownloaded={onDownloaded}
          />
        ) : canDownloadPdf ? (
          <PdfDownloadButton
            request={pdfRequest}
            label={`Descargar ${filters.tipo}`}
            className="w-full"
            onDownloaded={onDownloaded}
          />
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-3">
            <div className="flex gap-2 text-xs text-[var(--color-text-secondary)]">
              <FileWarning className="h-4 w-4 flex-shrink-0 text-[var(--color-solar-600)]" />
              <p>
                La factura mensual se exporta desde su panel dedicado.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ExportMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">{label}</p>
      <p className="tabular mt-1 truncate text-xs font-semibold capitalize text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}
