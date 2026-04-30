import { Bell, ShieldAlert, Clock, AlertOctagon, Timer, Building2 } from "lucide-react"
import { MetricCard } from "@/components/data/MetricCard"
import { formatDuration } from "@/lib/format"
import type { computeKpis } from "./alertasUtils"

interface AlertasKpiCardsProps {
  kpis: ReturnType<typeof computeKpis>
  loading: boolean
  error: boolean
  onRetry: () => void
}

export function AlertasKpiCards({ kpis, loading, error, onRetry }: AlertasKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        title="Alertas activas"
        value={loading ? "…" : String(kpis.alertasActivas)}
        delta="Sin comparación ayer"
        icon={Bell}
        iconBg="bg-[var(--color-danger-50)]"
        iconColor="text-[var(--color-danger-600)]"
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <MetricCard
        title="Críticas"
        value={loading ? "…" : String(kpis.alertasCriticas)}
        delta="Sin comparación ayer"
        icon={ShieldAlert}
        iconBg="bg-[var(--color-danger-50)]"
        iconColor="text-[var(--color-danger-700)]"
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <MetricCard
        title="SLA en riesgo"
        value={loading ? "…" : String(kpis.slaEnRiesgo)}
        delta="Sin comparación ayer"
        icon={Clock}
        iconBg="bg-[var(--color-warning-50)]"
        iconColor="text-[var(--color-warning-600)]"
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <MetricCard
        title="SLA incumplidas"
        value={loading ? "…" : String(kpis.slaIncumplidas)}
        delta="Sin comparación ayer"
        icon={AlertOctagon}
        iconBg="bg-[var(--color-sla-50)]"
        iconColor="text-[var(--color-sla-700)]"
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <MetricCard
        title="T. medio respuesta"
        value={
          loading ? "…" : kpis.tiempoMedioRespuestaMin != null
            ? formatDuration(kpis.tiempoMedioRespuestaMin)
            : "—"
        }
        delta="Basado en resueltas"
        icon={Timer}
        iconBg="bg-[var(--color-solar-50)]"
        iconColor="text-[var(--color-solar-700)]"
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
      <MetricCard
        title="Instalaciones con incidentes"
        value={loading ? "…" : String(kpis.instalacionesConIncidentes)}
        delta="Sin comparación ayer"
        icon={Building2}
        iconBg="bg-[var(--color-primary-50)]"
        iconColor="text-[var(--color-primary-600)]"
        loading={loading}
        error={error}
        onRetry={onRetry}
      />
    </div>
  )
}
