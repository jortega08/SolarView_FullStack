import { RotateCcw, SlidersHorizontal } from "lucide-react"
import type { EmpresaBasica, InstalacionResumen } from "@/types/domain"

export type AnalyticsPeriod = "week" | "month" | "year" | "custom"
export type AnalyticsEnergySource = "todas" | "solar" | "electrica"
export type AnalyticsComparisonMode = "periodo_anterior" | "instalaciones" | "sin_comparacion"

export interface AnalyticsFilterState {
  empresaId?: number
  instalacionId?: number
  periodo: AnalyticsPeriod
  fechaInicio?: string
  fechaFin?: string
  fuente: AnalyticsEnergySource
  comparacion: AnalyticsComparisonMode
}

interface AnalyticsFiltersProps {
  value: AnalyticsFilterState
  empresas: EmpresaBasica[]
  instalaciones: InstalacionResumen[]
  loading?: boolean
  onChange: (next: AnalyticsFilterState) => void
  onApply: () => void
  onClear: () => void
}

const inputClass =
  "h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] disabled:cursor-not-allowed disabled:opacity-60"

const labelClass = "text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]"

export function AnalyticsFilters({
  value,
  empresas,
  instalaciones,
  loading,
  onChange,
  onApply,
  onClear,
}: AnalyticsFiltersProps) {
  const update = <K extends keyof AnalyticsFilterState>(key: K, nextValue: AnalyticsFilterState[K]) => {
    onChange({ ...value, [key]: nextValue })
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Empresa</span>
          <select
            className={inputClass}
            value={value.empresaId ?? ""}
            disabled={loading || empresas.length === 0}
            onChange={(event) => update("empresaId", event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">Todas visibles</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Instalación</span>
          <select
            className={inputClass}
            value={value.instalacionId ?? ""}
            disabled={loading || instalaciones.length === 0}
            onChange={(event) => update("instalacionId", event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">Todas visibles</option>
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
            onChange={(event) => update("periodo", event.target.value as AnalyticsPeriod)}
          >
            <option value="week">Últimos 7 días</option>
            <option value="month">Mes actual</option>
            <option value="year">Últimos 12 meses</option>
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
          <span className={labelClass}>Fuente</span>
          <select
            className={inputClass}
            value={value.fuente}
            onChange={(event) => update("fuente", event.target.value as AnalyticsEnergySource)}
          >
            <option value="todas">Todas</option>
            <option value="solar">Solar</option>
            <option value="electrica">Red eléctrica</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Comparación</span>
          <select
            className={inputClass}
            value={value.comparacion}
            onChange={(event) => update("comparacion", event.target.value as AnalyticsComparisonMode)}
          >
            <option value="periodo_anterior">Periodo anterior</option>
            <option value="instalaciones">Instalaciones</option>
            <option value="sin_comparacion">Sin comparación</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Aplicar filtros
        </button>
      </div>
    </section>
  )
}
