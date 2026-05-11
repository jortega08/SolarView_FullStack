import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  BatteryCharging,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CloudSun,
  DollarSign,
  Eye,
  Gauge,
  Grid2X2,
  Info,
  MoreHorizontal,
  Radio,
  RefreshCw,
  Shield,
  Sun,
  Zap,
} from "lucide-react"
import { subDays, format as formatDateFns } from "date-fns"
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
import { StatusBadge } from "@/components/status/StatusBadge"
import { SeverityBadge } from "@/components/status/SeverityBadge"
import { RiskBadge } from "@/components/status/RiskBadge"
import { PriorityBadge } from "@/components/status/PriorityBadge"
import { OrdenEstadoBadge } from "@/components/status/OrdenEstadoBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import {
  formatCurrency,
  formatDate,
  formatEnergy,
  formatIrradiance,
  formatPercent,
  formatPower,
  formatRelativeTime,
  formatTemp,
} from "@/lib/format"
import type {
  Alerta,
  Clima,
  FuentesEnergia,
  InstalacionResumen,
  MantenimientoProgramado,
  Notificacion,
  Orden,
} from "@/types/domain"
import type { SeveridadAlerta } from "@/types/enums"
import { useI18n } from "@/contexts/I18nContext"

export default function CentroControlPage() {
  const { t } = useI18n()
  const { data: panel, isLoading: panelLoading, isError: panelError, refetch: refetchPanel } = usePanelEmpresa()
  const { data: alertasActivas, isLoading: alertasLoading } = useAlertas({ estado: "activa", limit: 24 })
  const { data: ordenes, isLoading: ordenesLoading } = useOrdenes({ estado: "abierta", limit: 8 })
  const { data: mantenimientos, isLoading: mantLoading } = useMantenimientos({ limit: 6 })
  const { data: notificaciones } = useNotificaciones({ limit: 8 })

  const hoy = formatDateFns(new Date(), "yyyy-MM-dd")
  const hace7 = formatDateFns(subDays(new Date(), 7), "yyyy-MM-dd")
  const tendenciaInstalacionId = panel?.instalaciones[0]?.id
  const { data: tendencia, isLoading: tendLoading } = useAnaliticaTendencia({
    instalacionId: tendenciaInstalacionId,
    fechaInicio: hace7,
    fechaFin: hoy,
  })

  const ordenesAbiertas = panel?.ordenesAbiertas ?? ordenes?.length ?? 0
  const slaEnRiesgo =
    panel?.slaEnRiesgo ??
    ordenes?.filter((o) => o.slaEstado === "vencido" || o.slaEstado === "en_riesgo").length ??
    0
  const instalacionesConSoc = panel?.instalaciones.filter((i) => i.bateriaSoc != null) ?? []
  const facturacion = panel?.facturacionHoy ?? null
  const monedaPanel = facturacion?.moneda ?? "COP"

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title={t("dash.metric.active_inst")}
          value={panelLoading ? "—" : String(panel?.instalacionesActivas ?? 0)}
          icon={Building2}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-700)]"
          loading={panelLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title={t("dash.metric.solar_gen")}
          value={panelLoading ? "—" : formatEnergy(panel?.generacionHoy)}
          icon={Zap}
          iconBg="bg-[var(--color-primary-50)]"
          iconColor="text-[var(--color-primary-700)]"
          loading={panelLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title={t("dash.metric.critical_alerts")}
          value={panelLoading ? "—" : String(panel?.alertasCriticas ?? 0)}
          icon={AlertTriangle}
          iconBg="bg-[var(--color-danger-50)]"
          iconColor="text-[var(--color-danger-600)]"
          loading={panelLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title={t("dash.metric.open_orders")}
          value={panelLoading || ordenesLoading ? "—" : String(ordenesAbiertas)}
          icon={ClipboardList}
          iconBg="bg-[var(--color-solar-50)]"
          iconColor="text-[var(--color-solar-600)]"
          loading={panelLoading || ordenesLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title={t("dash.metric.sla_risk")}
          value={panelLoading || ordenesLoading ? "—" : String(slaEnRiesgo)}
          icon={Shield}
          iconBg="bg-[var(--color-sla-50)]"
          iconColor="text-[var(--color-sla-600)]"
          loading={panelLoading || ordenesLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title={t("dash.metric.savings")}
          value={panelLoading ? "—" : formatCurrency(panel?.ahorroEstimado, monedaPanel)}
          icon={DollarSign}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-700)]"
          loading={panelLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          title={t("dash.metric.grid_cost")}
          value={
            panelLoading
              ? "—"
              : formatCurrency(facturacion?.valorConsumo, monedaPanel)
          }
          icon={Zap}
          iconBg="bg-[var(--color-primary-50)]"
          iconColor="text-[var(--color-primary-700)]"
          loading={panelLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title={t("dash.metric.solar_savings")}
          value={
            panelLoading
              ? "—"
              : formatCurrency(facturacion?.valorAhorro, monedaPanel)
          }
          icon={Sun}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-700)]"
          loading={panelLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
        <MetricCard
          title={t("dash.metric.total_cost")}
          value={
            panelLoading
              ? "—"
              : formatCurrency(facturacion?.valorTotal, monedaPanel)
          }
          icon={DollarSign}
          iconBg="bg-[var(--color-solar-50)]"
          iconColor="text-[var(--color-solar-600)]"
          loading={panelLoading}
          error={panelError}
          onRetry={refetchPanel}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title={t("dash.chart.gen_cons")}
          subtitle={t("dash.chart.gen_cons.sub")}
          loading={tendLoading}
          className="xl:col-span-2"
          toolbar={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-energy-200)] bg-[var(--color-energy-50)] px-2 py-1 text-xs font-medium text-[var(--color-energy-700)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-energy-500)]" />
                {t("common.live")}
              </span>
              <button
                type="button"
                onClick={() => refetchPanel()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
                title={t("common.refresh")}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          }
        >
          {tendencia && tendencia.length > 0 ? (
            <AreaTimeSeries data={tendencia} />
          ) : (
            <EmptyState
              title={t("dash.empty.trend")}
              description={t("dash.empty.trend.desc")}
              icon={Zap}
            />
          )}
        </ChartCard>

        <div className="grid gap-4">
          <ChartCard title={t("dash.chart.battery")} loading={panelLoading} bodyClassName="pb-5">
            {panel ? (
              <BatteryHealthDonut
                promedioSoc={
                  instalacionesConSoc.length > 0
                    ? Math.round(instalacionesConSoc.reduce((s, i) => s + (i.bateriaSoc ?? 0), 0) / instalacionesConSoc.length)
                    : undefined
                }
                segments={buildHealthSegments(panel.instalaciones, t)}
              />
            ) : (
              <EmptyState title={t("dash.empty.battery")} icon={BatteryCharging} />
            )}
          </ChartCard>
          <EnergySourcesCard fuentes={panel?.fuentesEnergia ?? null} loading={panelLoading} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RecentTelemetryCard instalaciones={panel?.instalaciones ?? []} loading={panelLoading} />
        <ClimateIrradianceCard clima={panel?.clima ?? null} loading={panelLoading} />
        <NotificationsCard notificaciones={notificaciones ?? []} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <InstallationsTable instalaciones={panel?.instalaciones ?? []} loading={panelLoading} />
        </div>
        <div className="space-y-4">
          <GroupedAlertsPanel alertas={alertasActivas ?? []} loading={alertasLoading} />
          <MaintenancePreviewCard mantenimientos={mantenimientos ?? []} loading={mantLoading} />
        </div>
      </section>

      {!ordenesLoading && ordenes && ordenes.length > 0 && (
        <RecentOrdersCard ordenes={ordenes} />
      )}
    </div>
  )
}

function EnergySourcesCard({
  fuentes,
  loading,
}: {
  fuentes: FuentesEnergia | null
  loading: boolean
}) {
  const { t } = useI18n()
  const solarPct = Math.max(0, Math.min(100, fuentes?.solarPct ?? 0))
  const redPct = Math.max(0, Math.min(100, fuentes?.redPct ?? 0))

  return (
    <PanelCard
      title={t("dash.card.energy_sources")}
      action={<Link to="/analitica" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("dash.view.analytics")}</Link>}
    >
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : fuentes ? (
        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-[var(--color-neutral-100)]">
            <div className="h-full bg-[var(--color-energy-500)]" style={{ width: `${solarPct}%` }} />
            <div className="h-full bg-[var(--color-primary-500)]" style={{ width: `${redPct}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <EnergySourceItem
              icon={<Sun className="h-5 w-5 text-[var(--color-energy-600)]" />}
              label={t("dash.energy.solar")}
              pct={formatPercent(fuentes.solarPct)}
              value={formatEnergy(fuentes.solarKwh)}
            />
            <EnergySourceItem
              icon={<Zap className="h-5 w-5 text-[var(--color-primary-600)]" />}
              label={t("dash.energy.grid")}
              pct={formatPercent(fuentes.redPct)}
              value={formatEnergy(fuentes.redKwh)}
            />
          </div>
        </div>
      ) : (
        <EmptyState title={t("dash.empty.energy")} icon={Grid2X2} className="py-5" />
      )}
    </PanelCard>
  )
}

function EnergySourceItem({
  icon,
  label,
  pct,
  value,
}: {
  icon: ReactNode
  label: string
  pct: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-neutral-50)]">
        {icon}
      </div>
      <div>
        <p className="tabular text-lg font-bold leading-tight text-[var(--color-text-primary)]">{pct}</p>
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
        <p className="tabular text-xs text-[var(--color-text-muted)]">{value}</p>
      </div>
    </div>
  )
}

function RecentTelemetryCard({
  instalaciones,
  loading,
}: {
  instalaciones: InstalacionResumen[]
  loading: boolean
}) {
  const { t } = useI18n()
  const rows = instalaciones.slice(0, 5)

  return (
    <PanelCard
      title={t("dash.card.telemetry")}
      action={<Link to="/telemetria" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("dash.view.telemetry")}</Link>}
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={t("dash.empty.telemetry")} icon={Radio} className="py-6" />
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {rows.map((inst) => (
            <div key={inst.id} className="flex items-center gap-3 py-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-neutral-100)]">
                <Gauge className="h-4 w-4 text-[var(--color-neutral-500)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">{inst.nombre}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {inst.bateriaSoc != null ? `${t("dash.chart.battery")} ${formatPercent(inst.bateriaSoc)}` : inst.ciudad ?? "Sin ubicación"}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular text-xs font-semibold text-[var(--color-energy-700)]">{formatPower(inst.potenciaActual)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-energy-500)]" />
                  {inst.estado === "activa" ? t("dash.online") : t("dash.check")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  )
}

function ClimateIrradianceCard({ clima, loading }: { clima: Clima | null; loading: boolean }) {
  const { t } = useI18n()
  return (
    <PanelCard
      title={t("dash.card.climate")}
      action={<Link to="/analitica" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("dash.view.analytics.link")}</Link>}
    >
      {loading ? (
        <Skeleton className="h-36 w-full" />
      ) : clima ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-solar-50)]">
              <CloudSun className="h-9 w-9 text-[var(--color-solar-500)]" />
            </div>
            <div className="min-w-0">
              <p className="tabular text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
                {formatTemp(clima.temperatura)}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">{clima.descripcion ?? "Clima sin descripción"}</p>
            </div>
            <div className="ml-auto border-l border-[var(--color-border)] pl-4">
              <p className="text-xs text-[var(--color-text-secondary)]">{t("dash.irradiance")}</p>
              <p className="tabular text-lg font-bold text-[var(--color-text-primary)]">{formatIrradiance(clima.irradiancia)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-3">
            <MiniStat label={t("dash.humidity")} value={formatPercent(clima.humedad)} />
            <MiniStat label={t("dash.wind")} value={clima.viento == null ? "—" : `${Math.round(clima.viento)} km/h`} />
          </div>
        </div>
      ) : (
        <EmptyState
          title={t("dash.empty.climate")}
          description={t("dash.empty.climate.desc")}
          icon={CloudSun}
          className="py-6"
        />
      )}
    </PanelCard>
  )
}

function NotificationsCard({ notificaciones }: { notificaciones: Notificacion[] }) {
  const { t } = useI18n()
  const visible = notificaciones.slice(0, 5)

  return (
    <PanelCard
      title={t("dash.card.notifications")}
      action={<Link to="/notificaciones" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("dash.view.telemetry")}</Link>}
    >
      {visible.length === 0 ? (
        <EmptyState title={t("dash.empty.notifications")} icon={Info} className="py-6" />
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {visible.map((notificacion) => (
            <div key={notificacion.id} className="flex items-start gap-3 py-2.5">
              <NotificationIcon tipo={notificacion.tipo} leida={notificacion.leida} />
              <div className="min-w-0 flex-1">
                <p className={notificacion.leida ? "truncate text-xs font-medium text-[var(--color-text-secondary)]" : "truncate text-xs font-semibold text-[var(--color-text-primary)]"}>
                  {notificacion.titulo}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{notificacion.mensaje || "Sin detalle"}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-[var(--color-text-muted)]">
                {formatRelativeTime(notificacion.fechaCreacion)}
              </span>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  )
}

function GroupedAlertsPanel({ alertas, loading }: { alertas: Alerta[]; loading: boolean }) {
  const { t } = useI18n()
  const total = alertas.length
  const ALERT_GROUPS: Array<{ severidad: SeveridadAlerta; label: string; iconClass: string }> = [
    { severidad: "critica", label: t("alert.sev.critical"), iconClass: "text-[var(--color-danger-600)]" },
    { severidad: "alta",    label: t("alert.sev.high"),     iconClass: "text-[var(--color-warning-600)]" },
    { severidad: "media",   label: t("alert.sev.medium"),   iconClass: "text-[var(--color-solar-600)]" },
    { severidad: "baja",    label: t("alert.sev.low"),      iconClass: "text-[var(--color-primary-600)]" },
  ]

  return (
    <PanelCard
      title={t("dash.card.alerts")}
      action={<Link to="/alertas" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("dash.view.telemetry")}</Link>}
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState title={t("dash.empty.alerts")} icon={CheckCircle2} className="py-6" />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-neutral-50)] px-3 py-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{t("dash.alerts.grouped")}</span>
            <span className="tabular text-xs font-semibold text-[var(--color-text-primary)]">{total} {t("dash.alerts.visible")}</span>
          </div>
          <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
            {ALERT_GROUPS.map((group) => {
              const items = alertas.filter((alerta) => alerta.severidad === group.severidad)
              if (items.length === 0) return null
              return (
                <div key={group.severidad}>
                  <div className="sticky top-0 z-10 mb-1 flex items-center justify-between bg-[var(--color-surface)] py-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-3.5 w-3.5 ${group.iconClass}`} />
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">{group.label}</span>
                    </div>
                    <span className="tabular rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      {items.length}
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    {items.map((alerta) => (
                      <Link
                        key={alerta.id}
                        to="/alertas"
                        className="block px-3 py-2.5 hover:bg-[var(--color-neutral-50)]"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--color-text-primary)]">
                            {alerta.instalacionNombre || "Instalación sin nombre"}
                          </p>
                          <SeverityBadge severidad={alerta.severidad} />
                        </div>
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">{alerta.descripcion || alerta.tipoAlertaNombre}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{formatRelativeTime(alerta.fechaCreacion)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </PanelCard>
  )
}

function MaintenancePreviewCard({
  mantenimientos,
  loading,
}: {
  mantenimientos: MantenimientoProgramado[]
  loading: boolean
}) {
  const { t } = useI18n()
  const visible = mantenimientos.slice(0, 4)

  return (
    <PanelCard
      title={t("dash.card.maintenance")}
      action={<Link to="/mantenimiento" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("common.view.all.m")}</Link>}
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title={t("dash.empty.maintenance")} icon={Calendar} className="py-5" />
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {visible.map((mantenimiento) => (
            <Link
              key={mantenimiento.id}
              to="/mantenimiento"
              className="flex items-center gap-3 py-2.5 hover:bg-[var(--color-neutral-50)]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-neutral-100)]">
                <Calendar className="h-4 w-4 text-[var(--color-neutral-500)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">{mantenimiento.instalacionNombre}</p>
                <p className="truncate text-xs text-[var(--color-text-secondary)] capitalize">{mantenimiento.tipo}</p>
              </div>
              <span className="tabular whitespace-nowrap text-xs text-[var(--color-text-muted)]">
                {formatDate(mantenimiento.fechaProgramada)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PanelCard>
  )
}

function InstallationsTable({
  instalaciones,
  loading,
}: {
  instalaciones: InstalacionResumen[]
  loading: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("dash.card.installations")}</h3>
        <Link to="/instalaciones" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">
          {t("common.view.all")}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-neutral-50)]">
              {[t("dash.inst.col.name"), t("dash.inst.col.status"), t("dash.inst.col.battery"), t("dash.inst.col.power"), t("dash.inst.col.gen"), t("dash.inst.col.risk"), ""].map((header) => (
                <th key={header} className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-[var(--color-text-secondary)]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, row) => (
                <tr key={row} className="border-b border-[var(--color-border)]">
                  {Array.from({ length: 7 }).map((__, col) => (
                    <td key={col} className="px-4 py-3">
                      <Skeleton className="h-3 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : instalaciones.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title={t("dash.empty.installations")} icon={Building2} className="py-8" />
                </td>
              </tr>
            ) : (
              instalaciones.slice(0, 8).map((instalacion) => (
                <tr
                  key={instalacion.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-neutral-50)]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {instalacion.imagen ? (
                        <img
                          src={instalacion.imagen}
                          alt=""
                          className="h-9 w-9 flex-shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[var(--color-neutral-100)]">
                          <Building2 className="h-4 w-4 text-[var(--color-neutral-500)]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">{instalacion.nombre}</p>
                        {instalacion.ciudad && <p className="truncate text-[var(--color-text-muted)]">{instalacion.ciudad}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge estado={instalacion.estado} /></td>
                  <td className="px-4 py-3">
                    <BatteryMiniBar value={instalacion.bateriaSoc} />
                  </td>
                  <td className="px-4 py-3 tabular">{formatPower(instalacion.potenciaActual)}</td>
                  <td className="px-4 py-3 tabular">{formatEnergy(instalacion.generacionHoy)}</td>
                  <td className="px-4 py-3"><RiskBadge riesgo={instalacion.riesgo} /></td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/instalaciones/${instalacion.id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--color-neutral-100)]"
                      title={t("inst.action.view")}
                    >
                      <Eye className="h-3.5 w-3.5 text-[var(--color-neutral-500)]" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BatteryMiniBar({ value }: { value: number | null }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value))
  const color =
    value == null
      ? "bg-[var(--color-neutral-300)]"
      : value >= 70
        ? "bg-[var(--color-energy-500)]"
        : value >= 50
          ? "bg-[var(--color-solar-500)]"
          : "bg-[var(--color-danger-500)]"

  return (
    <div className="flex min-w-28 items-center gap-2">
      <span className="tabular min-w-9 font-medium text-[var(--color-text-primary)]">
        {value == null ? "—" : formatPercent(value)}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-neutral-200)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function RecentOrdersCard({ ordenes }: { ordenes: Orden[] }) {
  const { t } = useI18n()
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("dash.card.orders")}</h3>
        <Link to="/ordenes" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">
          {t("common.view.all")}
        </Link>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {ordenes.slice(0, 6).map((orden) => (
          <div key={orden.id} className="flex items-center gap-4 px-4 py-2.5">
            <span className="tabular flex-shrink-0 font-mono text-xs text-[var(--color-text-muted)]">{orden.codigo}</span>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--color-text-primary)]">{orden.titulo}</p>
            <OrdenEstadoBadge estado={orden.estado} />
            <PriorityBadge prioridad={orden.prioridad} />
            <span className="hidden flex-shrink-0 text-xs text-[var(--color-text-secondary)] md:inline">{orden.instalacionNombre}</span>
            <button type="button" className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--color-neutral-100)]">
              <MoreHorizontal className="h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function PanelCard({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
          <span className="truncate">{title}</span>
          <Info className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-muted)]" />
        </h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="tabular text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}

function NotificationIcon({ tipo, leida }: { tipo: string | null; leida: boolean }) {
  const base = "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
  if (tipo?.includes("alert")) {
    return (
      <span className={`${base} bg-[var(--color-danger-50)]`}>
        <AlertTriangle className="h-4 w-4 text-[var(--color-danger-600)]" />
      </span>
    )
  }
  if (leida) {
    return (
      <span className={`${base} bg-[var(--color-neutral-100)]`}>
        <Info className="h-4 w-4 text-[var(--color-neutral-500)]" />
      </span>
    )
  }
  return (
    <span className={`${base} bg-[var(--color-primary-50)]`}>
      <Info className="h-4 w-4 text-[var(--color-primary-600)]" />
    </span>
  )
}

function buildHealthSegments(
  instalaciones: Array<{ bateriaSoc: number | null }>,
  t: (key: string) => string
): Array<{ label: string; count: number; color: string }> {
  const segments = [
    { label: t("dash.battery.optimal"), count: 0, color: "var(--color-energy-500)" },
    { label: t("dash.battery.good"), count: 0, color: "var(--color-primary-500)" },
    { label: t("dash.battery.fair"), count: 0, color: "var(--color-solar-500)" },
    { label: t("dash.battery.critical"), count: 0, color: "var(--color-danger-500)" },
  ]
  for (const instalacion of instalaciones) {
    if (instalacion.bateriaSoc == null) continue
    if (instalacion.bateriaSoc > 90) segments[0].count++
    else if (instalacion.bateriaSoc >= 70) segments[1].count++
    else if (instalacion.bateriaSoc >= 50) segments[2].count++
    else segments[3].count++
  }
  return segments
}
