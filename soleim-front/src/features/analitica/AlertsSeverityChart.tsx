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
import { ShieldAlert } from "lucide-react"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { Alerta } from "@/types/domain"
import type { SeveridadAlerta } from "@/types/enums"

interface AlertsSeverityChartProps {
  alertas: Alerta[]
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

const SEVERITIES: Array<{ key: SeveridadAlerta; label: string; color: string }> = [
  { key: "critica", label: "Críticas", color: "#dc2626" },
  { key: "alta", label: "Altas", color: "#ea580c" },
  { key: "media", label: "Medias", color: "#d97706" },
  { key: "baja", label: "Bajas", color: "#2563eb" },
]

function labelDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
}

export function AlertsSeverityChart({ alertas, loading, error, onRetry }: AlertsSeverityChartProps) {
  const byDate = new Map<string, Record<SeveridadAlerta, number> & { fecha: string }>()

  for (const alerta of alertas) {
    const fecha = labelDate(alerta.fechaCreacion)
    const current = byDate.get(fecha) ?? { fecha, critica: 0, alta: 0, media: 0, baja: 0 }
    current[alerta.severidad] += 1
    byDate.set(fecha, current)
  }

  const trendData = Array.from(byDate.values()).slice(-10)
  const aggregateData = [
    SEVERITIES.reduce(
      (acc, severity) => ({
        ...acc,
        [severity.key]: alertas.filter((alerta) => alerta.severidad === severity.key).length,
      }),
      { fecha: "Alertas" } as Record<SeveridadAlerta, number> & { fecha: string }
    ),
  ]
  const chartData = trendData.length >= 2 ? trendData : aggregateData

  return (
    <ChartCard
      title="Alertas por severidad"
      subtitle={trendData.length >= 2 ? "Evolución por fecha de creación" : "Distribución agregada de alertas visibles"}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      {alertas.length === 0 ? (
        <EmptyState
          title="Sin alertas para graficar"
          description="No hay alertas reales en el contexto filtrado."
          icon={ShieldAlert}
          className="py-14"
        />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#e2e8f0",
                  boxShadow: "var(--shadow-card)",
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              {SEVERITIES.map((severity) => (
                <Bar
                  key={severity.key}
                  dataKey={severity.key}
                  name={severity.label}
                  stackId="severity"
                  fill={severity.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
