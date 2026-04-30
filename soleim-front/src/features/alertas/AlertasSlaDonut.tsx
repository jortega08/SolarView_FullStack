import { ShieldCheck } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { computeSlaBreakdown } from "./alertasUtils"

interface AlertasSlaDonutProps {
  breakdown: ReturnType<typeof computeSlaBreakdown>
  loading: boolean
}

const SEGMENTS = [
  { key: "dentro", label: "Dentro de SLA", color: "var(--color-energy-500)" },
  { key: "en_riesgo", label: "En riesgo", color: "var(--color-warning-500)" },
  { key: "incumplida", label: "Incumplidas", color: "var(--color-danger-600)" },
] as const

export function AlertasSlaDonut({ breakdown, loading }: AlertasSlaDonutProps) {
  const { total, dentroCount, enRiesgoCount, incumplidaCount, dentroPercent, enRiesgoPercent, incumplidaPercent } =
    breakdown

  const data = [
    { name: "dentro", value: dentroCount },
    { name: "en_riesgo", value: enRiesgoCount },
    { name: "incumplida", value: incumplidaCount },
  ]

  return (
    <ChartCard
      title="Estado del SLA ahora"
      subtitle="Distribución de alertas activas por cumplimiento SLA"
      loading={loading}
    >
      {total === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Sin alertas activas"
          description="No hay alertas activas para calcular el estado del SLA."
        />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Donut */}
          <div className="relative mx-auto h-44 w-44 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="75%"
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={SEGMENTS[i].color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Centro */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">{total}</span>
              <span className="text-xs text-[var(--color-text-muted)]">alertas</span>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex flex-1 flex-col gap-3">
            <LegendRow
              label="Dentro de SLA"
              count={dentroCount}
              percent={dentroPercent}
              color="var(--color-energy-500)"
              bgColor="var(--color-energy-50)"
            />
            <LegendRow
              label="En riesgo"
              count={enRiesgoCount}
              percent={enRiesgoPercent}
              color="var(--color-warning-500)"
              bgColor="var(--color-warning-50)"
            />
            <LegendRow
              label="Incumplidas"
              count={incumplidaCount}
              percent={incumplidaPercent}
              color="var(--color-danger-600)"
              bgColor="var(--color-danger-50)"
            />
          </div>
        </div>
      )}
    </ChartCard>
  )
}

function LegendRow({
  label,
  count,
  percent,
  color,
  bgColor,
}: {
  label: string
  count: number
  percent: number
  color: string
  bgColor: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
          <span className="tabular text-sm font-semibold text-[var(--color-text-primary)]">{count}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-neutral-100)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${percent}%`, backgroundColor: color }}
            />
          </div>
          <span
            className="w-9 text-right text-xs font-medium tabular"
            style={{ backgroundColor: bgColor, color, borderRadius: "var(--radius-sm)", padding: "1px 5px" }}
          >
            {percent}%
          </span>
        </div>
      </div>
    </div>
  )
}
