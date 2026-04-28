import { Link } from "react-router-dom"
import {
  Zap, DollarSign, AlertTriangle, ClipboardList,
  Shield, Building2, Sun, Eye, MoreHorizontal, Calendar
} from "lucide-react"
import { usePanelEmpresa } from "@/hooks/usePanelEmpresa"
import { useAlertas } from "@/hooks/useAlertas"
import { useOrdenes } from "@/hooks/useOrdenes"
import { useMantenimientos } from "@/hooks/useMantenimientos"
import { useNotificaciones } from "@/hooks/useNotificaciones"
import { useAnaliticaTendencia } from "@/hooks/useAnalitica"
import { MetricCard } from "@/components/data/MetricCard"
import { ChartCard } from "@/components/data/ChartCard"
import { AreaTimeSeries } from "@/components/charts/AreaTimeSeries"
import { BatteryHealthDonut } from "@/components/charts/BatteryHealthDonut"
import { AlertList } from "@/components/domain/AlertList"
import { StatusBadge } from "@/components/status/StatusBadge"
import { SeverityBadge } from "@/components/status/SeverityBadge"
import { RiskBadge } from "@/components/status/RiskBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { formatPower, formatEnergy, formatCurrency, formatPercent, formatRelativeTime, formatDate } from "@/lib/format"
import { subDays, format } from "date-fns"

export default function CentroControlPage() {
  const { data: panel, isLoading: panelLoading, isError: panelError, refetch: refetchPanel } = usePanelEmpresa()
  const { data: alertasCriticas, isLoading: alertasLoading } = useAlertas({ severidad: "critica", estado: "activa", limit: 5 })
  const { data: ordenes, isLoading: ordenesLoading } = useOrdenes({ estado: "abierta", limit: 5 })
  const { data: mantenimientos, isLoading: mantLoading } = useMantenimientos({ limit: 5 })
  const { data: notificaciones } = useNotificaciones({ limit: 5 })

  const hoy = format(new Date(), "yyyy-MM-dd")
  const hace7 = format(subDays(new Date(), 7), "yyyy-MM-dd")
  const tendenciaInstalacionId = panel?.instalaciones[0]?.id
  const { data: tendencia, isLoading: tendLoading } = useAnaliticaTendencia({
    instalacionId: tendenciaInstalacionId,
    fechaInicio: hace7,
    fechaFin: hoy,
  })

  const kpiLoading = panelLoading
  const kpiError = panelError
  const ordenesAbiertas = panel?.ordenesAbiertas ?? ordenes?.length ?? 0
  const slaEnRiesgo =
    panel?.slaEnRiesgo ??
    ordenes?.filter((o) => o.slaEstado === "vencido" || o.slaEstado === "en_riesgo").length ??
    0
  const instalacionesConSoc = panel?.instalaciones.filter((i) => i.bateriaSoc != null) ?? []

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          title="Instalaciones activas"
          value={kpiLoading ? "—" : String(panel?.instalacionesActivas ?? 0)}
          delta={undefined}
          icon={Building2}
          iconBg="bg-[var(--color-primary-50)]"
          iconColor="text-[var(--color-primary-600)]"
          loading={kpiLoading}
          error={kpiError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title="Generación solar hoy"
          value={kpiLoading ? "—" : formatEnergy(panel?.generacionHoy)}
          icon={Zap}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-600)]"
          loading={kpiLoading}
          error={kpiError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title="Ahorro estimado"
          value={kpiLoading ? "—" : formatCurrency(panel?.ahorroEstimado)}
          icon={DollarSign}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-600)]"
          loading={kpiLoading}
          error={kpiError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title="Alertas críticas"
          value={kpiLoading ? "—" : String(panel?.alertasCriticas ?? 0)}
          icon={AlertTriangle}
          iconBg="bg-[var(--color-danger-50)]"
          iconColor="text-[var(--color-danger-600)]"
          loading={kpiLoading}
          error={kpiError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title="Órdenes abiertas"
          value={kpiLoading || ordenesLoading ? "—" : String(ordenesAbiertas)}
          icon={ClipboardList}
          iconBg="bg-[var(--color-solar-50)]"
          iconColor="text-[var(--color-solar-600)]"
          loading={kpiLoading || ordenesLoading}
          error={kpiError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title="SLA en riesgo"
          value={kpiLoading || ordenesLoading ? "—" : String(slaEnRiesgo)}
          icon={Shield}
          iconBg="bg-[var(--color-sla-50)]"
          iconColor="text-[var(--color-sla-600)]"
          loading={kpiLoading || ordenesLoading}
          error={kpiError}
          onRetry={refetchPanel}
        />
      </div>

      {/* Gráfico principal + Salud baterías */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard
          title="Generación y consumo — últimos 7 días"
          loading={tendLoading}
          className="xl:col-span-2"
        >
          {tendencia && tendencia.length > 0 ? (
            <AreaTimeSeries data={tendencia} />
          ) : (
            <EmptyState title="Sin datos de tendencia" description="Conecta instalaciones para ver generación y consumo" icon={Zap} />
          )}
        </ChartCard>

        <ChartCard title="Salud de baterías" loading={panelLoading}>
          {panel ? (
            <BatteryHealthDonut
              promedioSoc={
                instalacionesConSoc.length > 0
                  ? Math.round(instalacionesConSoc.reduce((s, i) => s + (i.bateriaSoc ?? 0), 0) / instalacionesConSoc.length)
                  : undefined
              }
              segments={buildHealthSegments(panel.instalaciones)}
            />
          ) : (
            <EmptyState title="Sin datos" icon={Zap} />
          )}
        </ChartCard>
      </div>

      {/* Instalaciones + lateral derecho */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Tabla instalaciones */}
        <div className="xl:col-span-2">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Instalaciones</h3>
              <Link to="/instalaciones" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {["Instalación", "Estado", "Batería", "Potencia actual", "Generación hoy", "Riesgo", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {panelLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)]">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-3 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : panel?.instalaciones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                        Sin instalaciones
                      </td>
                    </tr>
                  ) : (
                    panel?.instalaciones.map((inst) => (
                      <tr
                        key={inst.id}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-neutral-50)]"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">{inst.nombre}</p>
                            {inst.ciudad && <p className="text-[var(--color-text-muted)]">{inst.ciudad}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge estado={inst.estado} />
                        </td>
                        <td className="px-4 py-3 tabular font-medium">
                          {inst.bateriaSoc != null ? formatPercent(inst.bateriaSoc) : "—"}
                        </td>
                        <td className="px-4 py-3 tabular">{formatPower(inst.potenciaActual)}</td>
                        <td className="px-4 py-3 tabular">{formatEnergy(inst.generacionHoy)}</td>
                        <td className="px-4 py-3">
                          <RiskBadge riesgo={inst.riesgo} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/instalaciones/${inst.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-neutral-100)] transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna lateral derecha */}
        <div className="space-y-4">
          {/* Alertas críticas */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Alertas críticas</h3>
              <Link to="/alertas" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="px-4 py-2">
              {alertasLoading ? (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <AlertList alerts={alertasCriticas ?? []} />
              )}
            </div>
          </div>

          {/* Notificaciones recientes */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Notificaciones</h3>
              <Link to="/notificaciones" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {(notificaciones ?? []).slice(0, 4).map((n) => (
                <div key={n.id} className="px-4 py-2.5">
                  <p className={`text-xs font-medium ${n.leida ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"}`}>
                    {n.titulo}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatRelativeTime(n.fechaCreacion)}</p>
                </div>
              ))}
              {(notificaciones ?? []).length === 0 && (
                <div className="px-4 py-4 text-center text-xs text-[var(--color-text-muted)]">Sin notificaciones</div>
              )}
            </div>
          </div>

          {/* Próximos mantenimientos */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Próximos mantenimientos</h3>
              <Link to="/mantenimiento" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {mantLoading ? (
                <div className="px-4 py-2 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : mantenimientos?.length === 0 ? (
                <EmptyState title="Sin mantenimientos programados" icon={Calendar} className="py-4" />
              ) : (
                mantenimientos?.slice(0, 4).map((m) => (
                  <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{m.instalacionNombre}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] capitalize">{m.tipo}</p>
                    </div>
                    <span className="text-xs tabular text-[var(--color-text-muted)] flex-shrink-0">{formatDate(m.fechaProgramada)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Órdenes recientes */}
      {!ordenesLoading && ordenes && ordenes.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Órdenes recientes</h3>
            <Link to="/ordenes" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {ordenes.slice(0, 5).map((o) => (
              <div key={o.id} className="px-4 py-2.5 flex items-center gap-4">
                <span className="text-xs font-mono text-[var(--color-text-muted)] tabular flex-shrink-0">{o.codigo}</span>
                <p className="text-xs font-medium text-[var(--color-text-primary)] flex-1 truncate">{o.titulo}</p>
                <SeverityBadge severidad={o.prioridad} />
                <span className="text-xs text-[var(--color-text-secondary)] flex-shrink-0">{o.instalacionNombre}</span>
                <button className="w-6 h-6 flex items-center justify-center hover:bg-[var(--color-neutral-100)] rounded">
                  <MoreHorizontal className="w-3.5 h-3.5 text-[var(--color-neutral-400)]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuentes de energía */}
      {panel?.fuentesEnergia && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Fuentes de energía hoy</h3>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-[var(--color-neutral-100)] mb-3">
            <div
              className="h-full bg-[var(--color-energy-500)] rounded-full"
              style={{ width: `${panel.fuentesEnergia.solarPct ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[var(--color-solar-500)]" />
              <span className="font-semibold text-[var(--color-energy-700)]">{formatPercent(panel.fuentesEnergia.solarPct)} Solar</span>
              <span className="text-[var(--color-text-muted)]">{formatEnergy(panel.fuentesEnergia.solarKwh)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--color-primary-500)]" />
              <span className="font-semibold text-[var(--color-primary-700)]">{formatPercent(panel.fuentesEnergia.redPct)} Red</span>
              <span className="text-[var(--color-text-muted)]">{formatEnergy(panel.fuentesEnergia.redKwh)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildHealthSegments(
  instalaciones: Array<{ bateriaSoc: number | null }>
): Array<{ label: string; count: number; color: string }> {
  const segments = [
    { label: "Óptima (>90%)", count: 0, color: "var(--color-energy-500)" },
    { label: "Buena (70-90%)", count: 0, color: "var(--color-primary-500)" },
    { label: "Regular (50-70%)", count: 0, color: "var(--color-solar-500)" },
    { label: "Crítica (<50%)", count: 0, color: "var(--color-danger-500)" },
  ]
  for (const inst of instalaciones) {
    if (inst.bateriaSoc == null) continue
    if (inst.bateriaSoc > 90) segments[0].count++
    else if (inst.bateriaSoc >= 70) segments[1].count++
    else if (inst.bateriaSoc >= 50) segments[2].count++
    else segments[3].count++
  }
  return segments
}
