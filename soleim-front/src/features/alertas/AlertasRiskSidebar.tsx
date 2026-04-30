import { ShieldAlert, Clock, AlertOctagon, Link as LinkIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { ChartCard } from "@/components/data/ChartCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import { cn } from "@/lib/cn"
import type { InstalacionResumen, PanelEmpresa } from "@/types/domain"
import type { AlertaEnriquecida } from "./types"

/* ─── Instalaciones con mayor riesgo ─────────────────────────────────── */

interface RiskInstalacionesWidgetProps {
  instalaciones: InstalacionResumen[]
  alertas: AlertaEnriquecida[]
  panel: PanelEmpresa | undefined
  loading: boolean
}

const RIESGO_WEIGHT: Record<string, number> = { alto: 3, medio: 2, bajo: 1 }

export function RiskInstalacionesWidget({
  instalaciones,
  alertas,
  loading,
}: RiskInstalacionesWidgetProps) {
  const activasPorInstalacion = new Map<number, AlertaEnriquecida[]>()
  for (const a of alertas.filter((x) => x.estado === "activa")) {
    const list = activasPorInstalacion.get(a.instalacionId) ?? []
    list.push(a)
    activasPorInstalacion.set(a.instalacionId, list)
  }

  const ranked = instalaciones
    .filter((i) => (activasPorInstalacion.get(i.id)?.length ?? 0) > 0 || i.riesgo === "alto")
    .sort((a, b) => {
      const rw = (RIESGO_WEIGHT[b.riesgo ?? "bajo"] ?? 0) - (RIESGO_WEIGHT[a.riesgo ?? "bajo"] ?? 0)
      if (rw !== 0) return rw
      return (activasPorInstalacion.get(b.id)?.length ?? 0) - (activasPorInstalacion.get(a.id)?.length ?? 0)
    })
    .slice(0, 6)

  const maxAlerts = Math.max(...ranked.map((i) => activasPorInstalacion.get(i.id)?.length ?? 0), 1)

  return (
    <ChartCard
      title="Instalaciones con mayor riesgo"
      subtitle="Ordenadas por riesgo y alertas activas"
      loading={loading}
      toolbar={
        <Link
          to="/instalaciones"
          className="text-xs font-medium text-[var(--color-primary-600)] hover:underline"
        >
          Ver todas
        </Link>
      }
    >
      {ranked.length === 0 ? (
        <EmptyState
          icon={LinkIcon}
          title="Sin instalaciones en riesgo"
          description="No hay instalaciones con alertas activas."
        />
      ) : (
        <div className="space-y-3">
          {/* Cabecera */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
            <span>#  Instalación</span>
            <span className="text-center">Alertas</span>
            <span className="text-center">Críticas</span>
            <span className="text-center">SLA</span>
          </div>

          {ranked.map((inst, idx) => {
            const lista = activasPorInstalacion.get(inst.id) ?? []
            const total = lista.length
            const criticas = lista.filter((a) => a.severidad === "critica").length
            const slaInc = lista.filter((a) => a.slaEstado === "incumplida").length
            const barWidth = total > 0 ? Math.round((total / maxAlerts) * 100) : 0

            const barColor =
              inst.riesgo === "alto"
                ? "var(--color-danger-400)"
                : inst.riesgo === "medio"
                ? "var(--color-warning-400)"
                : "var(--color-energy-400)"

            return (
              <div key={inst.id} className="space-y-1">
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 text-xs font-bold text-[var(--color-text-muted)] tabular">
                      {idx + 1}
                    </span>
                    <RiskDot riesgo={inst.riesgo} />
                    <Link
                      to={`/instalaciones/${inst.id}`}
                      className="truncate text-xs font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-700)] hover:underline"
                    >
                      {inst.nombre}
                    </Link>
                  </div>
                  <span className="w-8 text-center text-xs font-semibold tabular text-[var(--color-text-primary)]">
                    {total}
                  </span>
                  <span
                    className={cn(
                      "w-8 text-center text-xs font-semibold tabular",
                      criticas > 0 ? "text-[var(--color-danger-600)]" : "text-[var(--color-text-muted)]",
                    )}
                  >
                    {criticas > 0 ? criticas : "—"}
                  </span>
                  <span
                    className={cn(
                      "w-8 text-center text-xs font-semibold tabular",
                      slaInc > 0 ? "text-[var(--color-sla-600)]" : "text-[var(--color-text-muted)]",
                    )}
                  >
                    {slaInc > 0 ? slaInc : "—"}
                  </span>
                </div>
                {/* Barra proporcional */}
                <div className="ml-5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-neutral-100)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}

/* ─── Atención inmediata ──────────────────────────────────────────────── */

interface AtencionInmediataWidgetProps {
  alertas: AlertaEnriquecida[]
  loading: boolean
}

export function AtencionInmediataWidget({ alertas, loading }: AtencionInmediataWidgetProps) {
  const activas = alertas.filter((a) => a.estado === "activa")

  // Críticas sin asignar: todas las críticas activas (campo "asignado" no existe en backend)
  const criticasSinAsignar = activas.filter((a) => a.severidad === "critica").length

  // Vence en menos de 30 min (en_riesgo con sla positivo y ≤ 30 min)
  const vencenProonto = activas.filter(
    (a) => a.slaEstado === "en_riesgo" && a.slaRestanteMinutos > 0 && a.slaRestanteMinutos <= 30,
  ).length

  // SLA incumplidas
  const incumplidas = activas.filter((a) => a.slaEstado === "incumplida").length

  return (
    <ChartCard title="Atención inmediata" loading={loading}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-3">
        <StatTile
          icon={ShieldAlert}
          value={criticasSinAsignar}
          label="Críticas sin asignar"
          linkLabel="Ver ahora"
          iconBg="bg-[var(--color-danger-50)]"
          iconColor="text-[var(--color-danger-600)]"
          valueColor="text-[var(--color-danger-600)]"
        />
        <StatTile
          icon={Clock}
          value={vencenProonto}
          label="Vence en < 30 min"
          linkLabel="Ver ahora"
          iconBg="bg-[var(--color-warning-50)]"
          iconColor="text-[var(--color-warning-600)]"
          valueColor="text-[var(--color-warning-600)]"
        />
        <StatTile
          icon={AlertOctagon}
          value={incumplidas}
          label="SLA incumplidas"
          linkLabel="Ver ahora"
          iconBg="bg-[var(--color-sla-50)]"
          iconColor="text-[var(--color-sla-600)]"
          valueColor="text-[var(--color-sla-600)]"
        />
      </div>
    </ChartCard>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function RiskDot({ riesgo }: { riesgo: InstalacionResumen["riesgo"] }) {
  const colorMap: Record<string, string> = {
    alto: "bg-[var(--color-danger-500)]",
    medio: "bg-[var(--color-warning-400)]",
    bajo: "bg-[var(--color-energy-400)]",
  }
  return (
    <span
      className={cn("inline-block h-2 w-2 flex-shrink-0 rounded-full", colorMap[riesgo ?? "bajo"])}
    />
  )
}

function StatTile({
  icon: Icon,
  value,
  label,
  linkLabel,
  iconBg,
  iconColor,
  valueColor,
}: {
  icon: React.ElementType
  value: number
  label: string
  linkLabel: string
  iconBg: string
  iconColor: string
  valueColor: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <span className={cn("text-2xl font-bold tabular", valueColor)}>{value}</span>
      </div>
      <div className="flex items-end justify-between gap-1">
        <p className="text-xs text-[var(--color-text-secondary)] leading-tight">{label}</p>
        <span className="whitespace-nowrap text-xs font-medium text-[var(--color-primary-600)] hover:underline cursor-pointer">
          {linkLabel} →
        </span>
      </div>
    </div>
  )
}
