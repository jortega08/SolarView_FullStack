import { Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/cn"
import type { InstalacionResumen } from "@/types/domain"
import type { AlertaFilterState } from "./types"

interface AlertasFilterBarProps {
  value: AlertaFilterState
  onChange: (v: AlertaFilterState) => void
  instalaciones: InstalacionResumen[]
  resultCount: number
  loading?: boolean
}

export function AlertasFilterBar({
  value,
  onChange,
  instalaciones,
  resultCount,
  loading,
}: AlertasFilterBarProps) {
  const set = <K extends keyof AlertaFilterState>(k: K, v: AlertaFilterState[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </div>

        <FilterSelect
          value={value.rango}
          onChange={(v) => set("rango", v as AlertaFilterState["rango"])}
          options={[
            { value: "1h", label: "Última hora" },
            { value: "4h", label: "Últimas 4h" },
            { value: "24h", label: "Últimas 24h" },
            { value: "7d", label: "7 días" },
            { value: "30d", label: "30 días" },
            { value: "custom", label: "Personalizado" },
          ]}
        />

        {value.rango === "custom" && (
          <>
            <input
              type="date"
              value={value.fechaInicio ?? ""}
              onChange={(e) => set("fechaInicio", e.target.value)}
              className="h-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
            />
            <span className="text-xs text-[var(--color-text-muted)]">—</span>
            <input
              type="date"
              value={value.fechaFin ?? ""}
              onChange={(e) => set("fechaFin", e.target.value)}
              className="h-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
            />
          </>
        )}

        <div className="h-4 w-px bg-[var(--color-border)]" />

        <FilterSelect
          value={value.severidad}
          onChange={(v) => set("severidad", v)}
          options={[
            { value: "", label: "Toda severidad" },
            { value: "critica", label: "Crítica" },
            { value: "alta", label: "Alta" },
            { value: "media", label: "Media" },
            { value: "baja", label: "Baja" },
          ]}
        />

        <FilterSelect
          value={value.estado}
          onChange={(v) => set("estado", v)}
          options={[
            { value: "", label: "Todos los estados" },
            { value: "activa", label: "Activas" },
            { value: "resuelta", label: "Resueltas" },
            { value: "cancelada", label: "Canceladas" },
          ]}
        />

        <FilterSelect
          value={value.instalacion}
          onChange={(v) => set("instalacion", v)}
          options={[
            { value: "", label: "Todas las instalaciones" },
            ...instalaciones.map((i) => ({ value: String(i.id), label: i.nombre })),
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1">
            <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              value={value.busqueda}
              onChange={(e) => set("busqueda", e.target.value)}
              placeholder="Buscar alerta, tipo, instalación…"
              className="w-52 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular",
              loading
                ? "bg-[var(--color-neutral-100)] text-[var(--color-text-muted)]"
                : "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
            )}
          >
            {loading ? "…" : `${resultCount} resultado${resultCount !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>
    </section>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
