import { RotateCcw, SlidersHorizontal } from "lucide-react"
import type { InstalacionResumen, ReportFiltersState, ReporteTipo } from "@/types/domain"

interface ReportFiltersProps {
  value: ReportFiltersState
  instalaciones: InstalacionResumen[]
  loading?: boolean
  onChange: (next: ReportFiltersState) => void
  onApply: () => void
  onClear: () => void
}

const inputClass =
  "h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] disabled:cursor-not-allowed disabled:opacity-60"

const labelClass = "text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]"

const reportTypes: Array<{ value: ReporteTipo; label: string }> = [
  { value: "consumo", label: "Consumo" },
  { value: "alertas", label: "Alertas" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "sla", label: "SLA" },
  { value: "factura", label: "Factura mensual" },
]

export function ReportFilters({
  value,
  instalaciones,
  loading,
  onChange,
  onApply,
  onClear,
}: ReportFiltersProps) {
  const update = <K extends keyof ReportFiltersState>(key: K, nextValue: ReportFiltersState[K]) => {
    onChange({ ...value, [key]: nextValue })
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Instalación</span>
          <select
            className={inputClass}
            value={value.instalacionId ?? ""}
            disabled={loading || instalaciones.length === 0}
            onChange={(event) => update("instalacionId", event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">Seleccionar</option>
            {instalaciones.map((instalacion) => (
              <option key={instalacion.id} value={instalacion.id}>
                {instalacion.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Periodo</span>
          <select
            className={inputClass}
            value={value.periodo}
            onChange={(event) => update("periodo", event.target.value as ReportFiltersState["periodo"])}
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="custom">Rango manual</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Desde</span>
          <input
            className={inputClass}
            type="date"
            value={value.fechaInicio ?? ""}
            disabled={value.periodo !== "custom"}
            onChange={(event) => update("fechaInicio", event.target.value || undefined)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Hasta</span>
          <input
            className={inputClass}
            type="date"
            value={value.fechaFin ?? ""}
            disabled={value.periodo !== "custom"}
            onChange={(event) => update("fechaFin", event.target.value || undefined)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Mes</span>
          <select
            className={inputClass}
            value={value.mes}
            onChange={(event) => update("mes", Number(event.target.value))}
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2026, index, 1).toLocaleDateString("es-CO", { month: "long" })}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Año</span>
          <input
            className={inputClass}
            type="number"
            min={2020}
            max={2100}
            value={value.ano}
            onChange={(event) => update("ano", Number(event.target.value))}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Tipo</span>
          <select
            className={inputClass}
            value={value.tipo}
            onChange={(event) => update("tipo", event.target.value as ReporteTipo)}
          >
            {reportTypes.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(180px,220px)_1fr_auto_auto] md:items-end">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Fuente energética</span>
          <select
            className={inputClass}
            value={value.fuente}
            onChange={(event) => update("fuente", event.target.value as ReportFiltersState["fuente"])}
          >
            <option value="todas">Todas</option>
            <option value="solar">Solar</option>
            <option value="electrica">Red eléctrica</option>
          </select>
        </label>
        <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
          El rango manual se usa para calcular el periodo de descarga.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Aplicar
        </button>
      </div>
    </section>
  )
}
