import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { GitCompare } from "lucide-react"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { ComparativaInstalacion } from "@/types/domain"

interface InstallationComparisonChartProps {
  data: ComparativaInstalacion[]
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

export function InstallationComparisonChart({ data, loading, error, onRetry }: InstallationComparisonChartProps) {
  const chartData = data.map((item) => ({
    instalacion: item.instalacionNombre,
    eficiencia: item.solarRatio == null ? null : item.solarRatio * 100,
    alertas: item.alertasActivas ?? 0,
  }))

  return (
    <ChartCard
      title="Comparativa por instalación"
      subtitle="Ratio solar y alertas activas de los últimos 30 días"
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      {chartData.length === 0 ? (
        <EmptyState
          title="Sin comparativa"
          description="El endpoint requiere empresa y datos agregados por instalación."
          icon={GitCompare}
          className="py-14"
        />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="instalacion"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value, name) => {
                  if (typeof value !== "number") return ["-", name]
                  return [name === "Eficiencia solar" ? `${value.toFixed(1)}%` : String(value), name]
                }}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#e2e8f0",
                  boxShadow: "var(--shadow-card)",
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="eficiencia" name="Eficiencia solar" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="alertas" name="Alertas" stroke="#dc2626" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
