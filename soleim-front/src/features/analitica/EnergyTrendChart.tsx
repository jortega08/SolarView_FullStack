import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Zap } from "lucide-react"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { TendenciaPunto } from "@/types/domain"
import type { AnalyticsEnergySource } from "./AnalyticsFilters"

interface EnergyTrendChartProps {
  data: TendenciaPunto[]
  source: AnalyticsEnergySource
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

function labelDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
}

function formatValue(value: number | string | Array<number | string> | undefined): string {
  if (typeof value !== "number") return "-"
  return `${value.toFixed(1)} kWh`
}

export function EnergyTrendChart({ data, source, loading, error, onRetry }: EnergyTrendChartProps) {
  const chartData = data.map((point) => ({
    fecha: labelDate(point.fecha),
    solar: point.generacion ?? 0,
    red: point.importacion ?? 0,
    consumo: point.consumo ?? 0,
  }))
  const showSolar = source === "todas" || source === "solar"
  const showGrid = source === "todas" || source === "electrica"

  return (
    <ChartCard
      title="Generación solar vs red eléctrica"
      subtitle="Serie temporal construida con telemetría real de consumo por fuente"
      loading={loading}
      error={error}
      onRetry={onRetry}
      className="xl:col-span-2"
    >
      {chartData.length === 0 ? (
        <EmptyState
          title="Sin tendencia energética"
          description="Selecciona una instalación con telemetría para ver la serie."
          icon={Zap}
          className="py-16"
        />
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value) => `${value}`} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={formatValue}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#e2e8f0",
                  boxShadow: "var(--shadow-card)",
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              {showSolar && (
                <Area
                  type="monotone"
                  dataKey="solar"
                  name="Solar"
                  stroke="#16a34a"
                  fill="#dcfce7"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              )}
              {showGrid && (
                <Line
                  type="monotone"
                  dataKey="red"
                  name="Red eléctrica"
                  stroke="#2563eb"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="consumo"
                name="Consumo total"
                stroke="#64748b"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
