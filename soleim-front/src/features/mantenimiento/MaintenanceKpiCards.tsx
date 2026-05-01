import { CalendarDays, CheckCircle2, Clock3, FileText, Gauge, ShieldCheck, XCircle } from "lucide-react"
import { MetricCard } from "@/components/data/MetricCard"
import type { Contrato, MantenimientoProgramado } from "@/types/domain"
import { getDisplayEstado, isUpcomingPreventive } from "./maintenanceUtils"

interface MaintenanceKpiCardsProps {
  mantenimientos: MantenimientoProgramado[]
  contratos: Contrato[]
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

export function MaintenanceKpiCards({
  mantenimientos,
  contratos,
  loading,
  error,
  onRetry,
}: MaintenanceKpiCardsProps) {
  const programados = mantenimientos.filter((m) => getDisplayEstado(m) === "programado").length
  const vencidos = mantenimientos.filter((m) => getDisplayEstado(m) === "vencido").length
  const preventivosProximos = mantenimientos.filter(isUpcomingPreventive).length
  const cancelados = mantenimientos.filter((m) => m.estado === "cancelado").length
  const completados = mantenimientos.filter((m) => m.estado === "completado").length
  const contratosActivos = contratos.filter((c) => c.activo).length

  const cards = [
    {
      title: "Programados",
      value: String(programados),
      delta: "En rango visible",
      icon: CalendarDays,
      iconColor: "text-[var(--color-primary-700)]",
      iconBg: "bg-[var(--color-primary-50)]",
    },
    {
      title: "Vencidos",
      value: String(vencidos),
      delta: vencidos > 0 ? "Requieren revisión" : "Sin vencidos",
      deltaPositive: vencidos === 0,
      icon: Clock3,
      iconColor: "text-[var(--color-danger-600)]",
      iconBg: "bg-[var(--color-danger-50)]",
    },
    {
      title: "Contratos activos",
      value: String(contratosActivos),
      delta: `${contratos.length} contratos`,
      icon: FileText,
      iconColor: "text-[var(--color-energy-700)]",
      iconBg: "bg-[var(--color-energy-50)]",
    },
    {
      title: "Preventivos próximos",
      value: String(preventivosProximos),
      delta: "Próximos 30 días",
      icon: ShieldCheck,
      iconColor: "text-[var(--color-sla-700)]",
      iconBg: "bg-[var(--color-sla-50)]",
    },
    {
      title: "Completados",
      value: String(completados),
      delta: "En rango visible",
      icon: CheckCircle2,
      iconColor: "text-[var(--color-energy-700)]",
      iconBg: "bg-[var(--color-energy-50)]",
    },
    {
      title: "Cancelados",
      value: String(cancelados),
      delta: "En rango visible",
      icon: XCircle,
      iconColor: "text-[var(--color-neutral-600)]",
      iconBg: "bg-[var(--color-neutral-100)]",
    },
    {
      title: "Cumplimiento SLA",
      value: "N/D",
      delta: "No expuesto por backend",
      icon: Gauge,
      iconColor: "text-[var(--color-neutral-600)]",
      iconBg: "bg-[var(--color-neutral-100)]",
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          {...card}
          loading={loading}
          error={error}
          onRetry={onRetry}
        />
      ))}
    </div>
  )
}
