import { TrendingUp } from "lucide-react"
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import { cn } from "@/lib/cn"
import type { computeTrendData } from "./alertasUtils"

interface AlertasTrendChartProps {
  data: ReturnType<typeof computeTrendData>
  loading: boolean
  trendDays: 7 | 14 | 30
  onChangeDays: (d: 7 | 14 | 30) => void
}

const DAYS: (7 | 14 | 30)[] = [7, 14, 30]

export function AlertasTrendChart({
  data,
  loading,
  trendDays,
  onChangeDays,
}: AlertasTrendChartProps) {
  const isEmpty = data.every(
    (d) => d.activas === 0 && d.enRiesgo === 0 && d.incumplidas === 0,
  )

  const toolbar = (
    <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
      {DAYS.map((d) => (
        <button
          key={d}
          onClick={() => onChangeDays(d)}
          className={cn(
            "rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors",
            trendDays === d
              ? "bg-[var(--color-primary-600)] text-white"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]",
          )}
        >
          {d}d
        </button>
      ))}
    </div>
  )

  return (
    <ChartCard
      title="Tendencia de alertas y cumplimiento SLA"
      subtitle="Alertas por día y porcentaje de cumplimiento"
      loading={loading}
      toolbar={toolbar}
    >
      {isEmpty ? (
        <EmptyState
          icon={TrendingUp}
          title="Sin datos de tendencia"
          description="No hay suficientes alertas para mostrar la tendencia en este periodo."
        />
      ) : (
        <ResponsiveContainer width="100%" height={288}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-neutral-200)"
              vertical={false}
            />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
            />
            {/* Eje izquierdo — conteos */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            {/* Eje derecho — porcentaje SLA */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
              }}
              labelStyle={{ fontWeight: 600, color: "var(--color-text-primary)" }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  activas: "Alertas activas",
                  enRiesgo: "SLA en riesgo",
                  incumplidas: "Incumplidas",
                  cumplimientoSla: "Cumplimiento SLA",
                }
                const suffix = name === "cumplimientoSla" ? "%" : ""
                return [`${value}${suffix}`, labels[name] ?? name]
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  activas: "Alertas activas",
                  enRiesgo: "SLA en riesgo",
                  incumplidas: "Incumplidas",
                  cumplimientoSla: "Cumplimiento SLA %",
                }
                return labels[value] ?? value
              }}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="activas"
              fill="var(--color-danger-100)"
              stroke="var(--color-danger-500)"
              strokeWidth={2}
              fillOpacity={0.6}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="enRiesgo"
              fill="var(--color-warning-50)"
              stroke="var(--color-warning-500)"
              strokeWidth={2}
              fillOpacity={0.5}
            />
            <Bar
              yAxisId="left"
              dataKey="incumplidas"
              fill="var(--color-danger-600)"
              radius={[2, 2, 0, 0]}
              maxBarSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumplimientoSla"
              stroke="var(--color-energy-500)"
              strokeWidth={2.5}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: "var(--color-energy-500)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
