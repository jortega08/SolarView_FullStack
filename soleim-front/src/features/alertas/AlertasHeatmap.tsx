import { LayoutGrid } from "lucide-react"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import { type computeHeatmapData } from "./alertasUtils"

interface AlertasHeatmapProps {
  data: ReturnType<typeof computeHeatmapData>
  loading: boolean
}

type HeatmapRow = ReturnType<typeof computeHeatmapData>[number]
type SeverityKey = "critica" | "alta" | "media" | "baja"

const GRID_COLUMNS = "minmax(220px, 1.45fr) repeat(4, minmax(58px, 0.45fr)) minmax(52px, 0.35fr)"

const SEVERITIES: {
  key: SeverityKey
  label: string
  rgb: string
  text: string
  bar: string
}[] = [
  {
    key: "critica",
    label: "Critica",
    rgb: "220 38 38",
    text: "var(--color-danger-700)",
    bar: "var(--color-danger-600)",
  },
  {
    key: "alta",
    label: "Alta",
    rgb: "234 88 12",
    text: "var(--color-warning-600)",
    bar: "var(--color-warning-500)",
  },
  {
    key: "media",
    label: "Media",
    rgb: "217 119 6",
    text: "var(--color-solar-700)",
    bar: "var(--color-solar-500)",
  },
  {
    key: "baja",
    label: "Baja",
    rgb: "37 99 235",
    text: "var(--color-primary-700)",
    bar: "var(--color-primary-500)",
  },
]

function getCellStyle(value: number, max: number, meta: (typeof SEVERITIES)[number]) {
  if (value === 0 || max === 0) {
    return {
      backgroundColor: "var(--color-neutral-50)",
      borderColor: "var(--color-border)",
      color: "var(--color-text-muted)",
    }
  }

  const ratio = value / max
  const alpha = Math.min(0.18 + ratio * 0.58, 0.76)
  const borderAlpha = Math.min(alpha + 0.12, 0.88)

  return {
    backgroundColor: `rgb(${meta.rgb} / ${alpha})`,
    borderColor: `rgb(${meta.rgb} / ${borderAlpha})`,
    color: ratio >= 0.72 ? "white" : meta.text,
  }
}

function getDominantSeverity(row: HeatmapRow) {
  return SEVERITIES.reduce((best, current) =>
    (row[current.key] as number) > (row[best.key] as number) ? current : best,
  )
}

export function AlertasHeatmap({ data, loading }: AlertasHeatmapProps) {
  const maxValue = data.length > 0 ? Math.max(...data.flatMap((r) => SEVERITIES.map((s) => r[s.key] as number))) : 0
  const maxTotal = data.length > 0 ? Math.max(...data.map((r) => r.total), 1) : 1
  const totalAlertas = data.reduce((sum, row) => sum + row.total, 0)

  const toolbar = (
    <div className="hidden items-center gap-2 lg:flex">
      {SEVERITIES.map((severity) => (
        <span
          key={severity.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-50)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]"
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: severity.bar }} />
          {severity.label}
        </span>
      ))}
    </div>
  )

  return (
    <ChartCard
      title="Mapa de alertas por instalacion"
      subtitle="Densidad activa por severidad e instalacion"
      loading={loading}
      toolbar={toolbar}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Sin datos de densidad"
          description="No hay alertas activas para mostrar el mapa de densidad."
        />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[620px]">
            <div
              className="grid items-center gap-2 border-b border-[var(--color-border)] pb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
              style={{ gridTemplateColumns: GRID_COLUMNS }}
            >
              <span>Instalacion</span>
              {SEVERITIES.map((severity) => (
                <span key={severity.key} className="text-center">
                  {severity.label}
                </span>
              ))}
              <span className="text-center">Total</span>
            </div>

            <div className="mt-2 max-h-[360px] space-y-1 overflow-y-auto pr-1">
              {data.map((row, index) => {
                const dominant = getDominantSeverity(row)
                const width = Math.max(6, Math.round((row.total / maxTotal) * 100))

                return (
                  <div
                    key={row.zona}
                    className="grid items-center gap-2 rounded-[var(--radius-md)] border border-transparent px-2 py-2 transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-neutral-50)]"
                    style={{ gridTemplateColumns: GRID_COLUMNS }}
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-neutral-100)] text-[11px] font-bold tabular text-[var(--color-text-secondary)]">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {row.zona}
                        </span>
                      </div>
                      <div className="ml-8 mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-neutral-100)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${width}%`, backgroundColor: dominant.bar }}
                        />
                      </div>
                    </div>

                    {SEVERITIES.map((severity) => {
                      const value = row[severity.key] as number

                      return (
                        <div
                          key={severity.key}
                          className="flex h-10 items-center justify-center rounded-[var(--radius-md)] border text-sm font-bold tabular shadow-sm transition-transform hover:-translate-y-0.5"
                          style={getCellStyle(value, maxValue, severity)}
                        >
                          {value > 0 ? value : "-"}
                        </div>
                      )
                    })}

                    <div className="flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-100)] text-sm font-bold tabular text-[var(--color-text-primary)]">
                      {row.total}
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              className="mt-3 grid items-center gap-2 border-t border-[var(--color-border)] pt-3"
              style={{ gridTemplateColumns: GRID_COLUMNS }}
            >
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Total por severidad
              </span>
              {SEVERITIES.map((severity) => (
                <span
                  key={severity.key}
                  className="flex h-8 items-center justify-center rounded-[var(--radius-md)] text-xs font-bold tabular"
                  style={{
                    backgroundColor: `rgb(${severity.rgb} / 0.12)`,
                    color: severity.text,
                  }}
                >
                  {data.reduce((sum, row) => sum + (row[severity.key] as number), 0)}
                </span>
              ))}
              <span className="flex h-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-neutral-900)] text-xs font-bold tabular text-white">
                {totalAlertas}
              </span>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
