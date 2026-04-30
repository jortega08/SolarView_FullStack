import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BatteryCharging } from "lucide-react"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { Autonomia, BateriaSalud, TendenciaPunto } from "@/types/domain"

interface BatteryPerformanceChartProps {
  tendencia: TendenciaPunto[]
  bateria: BateriaSalud | null | undefined
  autonomia: Autonomia | null | undefined
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

function labelDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "No disponible"
  return `${value.toFixed(1)}%`
}

function formatTemp(value: number | null | undefined): string {
  if (value == null) return "No disponible"
  return `${value.toFixed(1)} °C`
}

function formatHours(value: number | null | undefined): string {
  if (value == null) return "No disponible"
  return `${value.toFixed(1)} h`
}

export function BatteryPerformanceChart({
  tendencia,
  bateria,
  autonomia,
  loading,
  error,
  onRetry,
}: BatteryPerformanceChartProps) {
  const chartData = tendencia
    .filter((point) => point.bateriaSoc != null)
    .map((point) => ({
      fecha: labelDate(point.fecha),
      soc: point.bateriaSoc ?? 0,
    }))

  return (
    <ChartCard
      title="Rendimiento de batería"
      subtitle="SOC histórico y última lectura de autonomía, temperatura y estado"
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BatteryStat label="SOC actual" value={formatPercent(bateria?.soc)} />
        <BatteryStat label="Autonomía" value={formatHours(autonomia?.autonomiaHoras)} />
        <BatteryStat label="Temperatura" value={formatTemp(bateria?.temperatura)} />
        <BatteryStat label="Estado" value={bateria?.estado ?? "No disponible"} />
      </div>

      {chartData.length === 0 ? (
        <EmptyState
          title="Sin serie de batería"
          description="El endpoint de tendencia no devolvió SOC para este rango."
          icon={BatteryCharging}
          className="py-12"
        />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => (typeof value === "number" ? `${value.toFixed(1)}%` : "-")}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#e2e8f0",
                  boxShadow: "var(--shadow-card)",
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="soc" name="SOC promedio" stroke="#d97706" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}

function BatteryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">{label}</p>
      <p className="tabular mt-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}
