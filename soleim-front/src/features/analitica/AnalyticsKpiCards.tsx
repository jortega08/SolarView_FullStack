import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  SunMedium,
  Wrench,
  Zap,
} from "lucide-react"
import { MetricCard } from "@/components/data/MetricCard"

export interface AnalyticsKpis {
  generacionTotal: number | null
  consumoTotal: number | null
  ahorroEstimado: number | null
  autonomiaPromedio: number | null
  disponibilidad: number | null
  alertasPeriodo: number | null
  mantenimientosCompletados: number | null
  cumplimientoSla: number | null
}

interface AnalyticsKpiCardsProps {
  kpis: AnalyticsKpis
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

function formatEnergy(value: number | null): string {
  if (value == null) return "No disponible"
  if (value >= 1000) return `${(value / 1000).toFixed(2)} GWh`
  return `${value.toFixed(1)} kWh`
}

function formatCurrency(value: number | null): string {
  if (value == null) return "No disponible"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number | null): string {
  if (value == null) return "No disponible"
  return `${value.toFixed(1)}%`
}

function formatHours(value: number | null): string {
  if (value == null) return "No disponible"
  return `${value.toFixed(1)} h`
}

export function AnalyticsKpiCards({ kpis, loading, error, onRetry }: AnalyticsKpiCardsProps) {
  const cards = [
    {
      title: "Generación total",
      value: formatEnergy(kpis.generacionTotal),
      icon: SunMedium,
      iconBg: "bg-[var(--color-energy-50)]",
      iconColor: "text-[var(--color-energy-700)]",
    },
    {
      title: "Consumo total",
      value: formatEnergy(kpis.consumoTotal),
      icon: Zap,
      iconBg: "bg-[var(--color-primary-50)]",
      iconColor: "text-[var(--color-primary-700)]",
    },
    {
      title: "Ahorro estimado",
      value: formatCurrency(kpis.ahorroEstimado),
      icon: DollarSign,
      iconBg: "bg-[var(--color-energy-50)]",
      iconColor: "text-[var(--color-energy-700)]",
    },
    {
      title: "Autonomía promedio",
      value: formatHours(kpis.autonomiaPromedio),
      icon: BatteryCharging,
      iconBg: "bg-[var(--color-solar-50)]",
      iconColor: "text-[var(--color-solar-700)]",
    },
    {
      title: "Disponibilidad",
      value: formatPercent(kpis.disponibilidad),
      icon: CheckCircle2,
      iconBg: "bg-[var(--color-energy-50)]",
      iconColor: "text-[var(--color-energy-700)]",
    },
    {
      title: "Alertas del periodo",
      value: kpis.alertasPeriodo == null ? "No disponible" : String(kpis.alertasPeriodo),
      icon: AlertTriangle,
      iconBg: "bg-[var(--color-danger-50)]",
      iconColor: "text-[var(--color-danger-600)]",
    },
    {
      title: "Mantenimientos completados",
      value: kpis.mantenimientosCompletados == null ? "No disponible" : String(kpis.mantenimientosCompletados),
      icon: Wrench,
      iconBg: "bg-[var(--color-solar-50)]",
      iconColor: "text-[var(--color-solar-700)]",
    },
    {
      title: "Cumplimiento SLA",
      value: formatPercent(kpis.cumplimientoSla),
      icon: ShieldCheck,
      iconBg: "bg-[var(--color-sla-50)]",
      iconColor: "text-[var(--color-sla-600)]",
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          iconBg={card.iconBg}
          iconColor={card.iconColor}
          loading={loading}
          error={error}
          onRetry={onRetry}
          className="min-h-32"
        />
      ))}
    </section>
  )
}
