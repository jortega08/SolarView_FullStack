import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3 } from "lucide-react"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { ActividadEnergetica } from "@/types/domain"

interface ConsumptionPeriodChartProps {
  data: ActividadEnergetica[]
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

function formatValue(value: number | string | Array<number | string> | undefined): string {
  if (typeof value !== "number") return "-"
  return `${value.toFixed(1)} kWh`
}

export function ConsumptionPeriodChart({ data, loading, error, onRetry }: ConsumptionPeriodChartProps) {
  const chartData = data.map((item) => ({
    periodo: item.label,
    solar: item.solar ?? 0,
    red: item.redElectrica ?? 0,
  }))

  return (
    <ChartCard
      title="Consumo por periodo"
      subtitle="Agregación por día, mes o año según el periodo disponible"
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      {chartData.length === 0 ? (
        <EmptyState
          title="Sin consumo agregado"
          description="No hay lecturas suficientes para este periodo."
          icon={BarChart3}
          className="py-14"
        />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
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
              <Bar dataKey="solar" name="Solar" stackId="energia" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="red" name="Red eléctrica" stackId="energia" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
