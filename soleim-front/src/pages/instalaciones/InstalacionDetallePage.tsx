import { Link, useParams } from "react-router-dom"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  Activity,
  Battery,
  Calendar,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Home,
  Info,
  Radio,
  Sun,
  Thermometer,
  Zap,
} from "lucide-react"
import { format, subDays } from "date-fns"
import { useDetalleInstalacion } from "@/hooks/useDetalleInstalacion"
import {
  useAnaliticaAutonomia,
  useAnaliticaBateria,
  useAnaliticaTendencia,
} from "@/hooks/useAnalitica"
import { useAlertas } from "@/hooks/useAlertas"
import { useMantenimientos } from "@/hooks/useMantenimientos"
import { useOrdenes } from "@/hooks/useOrdenes"
import { useSensorSocket } from "@/hooks/useSensorSocket"
import { AreaTimeSeries } from "@/components/charts/AreaTimeSeries"
import { ChartCard } from "@/components/data/ChartCard"
import { MetricCard } from "@/components/data/MetricCard"
import { BatteryGauge } from "@/components/domain/BatteryGauge"
import { TelemetryTimeline } from "@/components/domain/TelemetryTimeline"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { LiveBadge } from "@/components/status/LiveBadge"
import { OrdenEstadoBadge } from "@/components/status/OrdenEstadoBadge"
import { SeverityBadge } from "@/components/status/SeverityBadge"
import { StatusBadge } from "@/components/status/StatusBadge"
import {
  formatCurrent,
  formatDate,
  formatDuration,
  formatEnergy,
  formatPercent,
  formatPower,
  formatRelativeTime,
  formatTemp,
  formatVoltage,
} from "@/lib/format"
import type { Alerta, MantenimientoProgramado, Orden } from "@/types/domain"
import type { BateriaSalud, TelemetriaEvento } from "@/types/domain"
import type { ConexionWS, SeveridadAlerta } from "@/types/enums"
import { useI18n } from "@/contexts/I18nContext"

export default function InstalacionDetallePage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const instalacionId = id ? Number.parseInt(id, 10) : null

  const { data: inst, isLoading: instLoading, isError: instError, refetch } = useDetalleInstalacion(instalacionId)
  const { data: bateria } = useAnaliticaBateria(instalacionId)
  const { data: autonomia } = useAnaliticaAutonomia(instalacionId)
  const { data: alertas, isLoading: alertasLoading } = useAlertas({
    instalacion: instalacionId ?? undefined,
    estado: "activa",
    limit: 24,
  })
  const { data: ordenes, isLoading: ordenesLoading } = useOrdenes({
    instalacion: instalacionId ?? undefined,
    limit: 8,
  })
  const { data: mantenimientos, isLoading: mantLoading } = useMantenimientos({
    instalacion: instalacionId ?? undefined,
    limit: 4,
  })
  const { connectionStatus, messages } = useSensorSocket(instalacionId)

  const hoy = format(new Date(), "yyyy-MM-dd")
  const hace7 = format(subDays(new Date(), 7), "yyyy-MM-dd")
  const { data: tendencia, isLoading: tendLoading } = useAnaliticaTendencia({
    instalacionId: instalacionId ?? undefined,
    fechaInicio: hace7,
    fechaFin: hoy,
  })

  const autonomiaMin =
    autonomia?.autonomiaHoras != null
      ? autonomia.autonomiaHoras * 60 + (autonomia.autonomiaMinutos ?? 0)
      : bateria?.tiempoRestanteMinutos ?? null
  const capacidadDisponible =
    bateria?.capacidadDisponible ??
    (bateria?.capacidadTotal != null && bateria.soc != null
      ? (bateria.capacidadTotal * bateria.soc) / 100
      : null)

  if (instError) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <ErrorState message={t("inst.detail.title")} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {t("inst.detail.title")}
          </h2>
          <nav className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-[var(--color-primary-600)]">
              <Home className="h-3.5 w-3.5" />
              {t("inst.detail.breadcrumb.home")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/instalaciones" className="hover:text-[var(--color-primary-600)]">{t("inst.detail.breadcrumb.list")}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-[var(--color-text-primary)]">{inst?.nombre ?? t("inst.detail.title")}</span>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">{inst?.nombre ?? "Instalación"}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {inst?.capacidadSolarKwp ? `${inst.capacidadSolarKwp} kWp` : "Capacidad N/D"}
            </p>
          </div>
          <LiveBadge status={connectionStatus} />
          <span className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">
            {formatDate(hace7)} - {formatDate(hoy)}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
          >
            <Download className="h-3.5 w-3.5" />
            {t("inst.detail.btn.export")}
          </button>
        </div>
      </section>

      <InstallationSummaryCard
        loading={instLoading}
        name={inst?.nombre}
        image={inst?.imagen}
        estado={inst?.estado}
        tipoSistema={inst?.tipoSistema}
        capacidadSolarKwp={inst?.capacidadSolarKwp}
        capacidadBateriaKwh={inst?.capacidadBateriaKwh}
        ciudad={inst?.ciudad}
        ultimaActualizacion={inst?.ultimaActualizacion}
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-8">
        <MetricCard
          title={t("inst.detail.metric.power")}
          value={formatPower(inst?.potenciaActual)}
          delta={inst?.capacidadSolarKwp ? `${Math.round(((inst.potenciaActual ?? 0) / inst.capacidadSolarKwp) * 100)}% de capacidad` : undefined}
          icon={Zap}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-700)]"
          loading={instLoading}
        />
        <MetricCard
          title={t("inst.detail.metric.gen")}
          value={formatEnergy(inst?.generacionHoy)}
          delta={t("inst.detail.delta.daily")}
          icon={Sun}
          iconBg="bg-[var(--color-primary-50)]"
          iconColor="text-[var(--color-primary-700)]"
          loading={instLoading}
        />
        <MetricCard
          title={t("inst.detail.metric.cons")}
          value={formatPower(inst?.consumoActual)}
          delta={t("inst.detail.delta.current")}
          icon={Activity}
          iconBg="bg-[var(--color-sla-50)]"
          iconColor="text-[var(--color-sla-700)]"
          loading={instLoading}
        />
        <MetricCard
          title={t("inst.detail.metric.soc")}
          value={bateria ? formatPercent(bateria.soc) : formatPercent(inst?.bateriaSoc)}
          delta={capacidadDisponible != null ? `${formatEnergy(capacidadDisponible)} ${t("inst.detail.battery.available")}` : undefined}
          icon={Battery}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-700)]"
          loading={instLoading}
        />
        <MetricCard
          title={t("inst.detail.metric.auto")}
          value={autonomiaMin != null ? formatDuration(autonomiaMin) : "—"}
          delta={t("inst.detail.delta.load")}
          icon={Battery}
          iconBg="bg-[var(--color-solar-50)]"
          iconColor="text-[var(--color-solar-700)]"
          loading={instLoading}
        />
        <MetricCard
          title={t("inst.detail.metric.temp")}
          value={bateria ? formatTemp(bateria.temperatura) : "—"}
          delta={t("inst.detail.delta.ambient")}
          icon={Thermometer}
          iconBg="bg-[var(--color-primary-50)]"
          iconColor="text-[var(--color-primary-700)]"
          loading={instLoading}
        />
        <MetricCard
          title={t("inst.detail.metric.irrad")}
          value={latestIrradiance(tendencia)}
          delta={t("inst.detail.delta.last")}
          icon={Sun}
          iconBg="bg-[var(--color-solar-50)]"
          iconColor="text-[var(--color-solar-700)]"
          loading={instLoading || tendLoading}
        />
        <MetricCard
          title={t("inst.detail.metric.eff")}
          value={formatPercent(inst?.eficiencia)}
          delta={inst?.eficiencia != null && inst.eficiencia >= 90 ? t("inst.detail.delta.excellent") : undefined}
          icon={Activity}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-700)]"
          loading={instLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)_220px]">
        <ChartCard
          title={t("inst.detail.chart.title")}
          subtitle={t("inst.detail.chart.sub")}
          loading={tendLoading}
          toolbar={
            <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-1">
              {[t("inst.detail.time.today"), t("inst.detail.time.7d"), t("inst.detail.time.30d")].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={
                    index === 1
                      ? "rounded bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary-700)] shadow-sm"
                      : "px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {tendencia && tendencia.length > 0 ? (
            <AreaTimeSeries data={tendencia} />
          ) : (
            <EmptyState title={t("inst.detail.empty.trend")} icon={Zap} />
          )}
        </ChartCard>

        <BatterySystemCard
          bateria={bateria}
          autonomiaMin={autonomiaMin}
          capacidadDisponible={capacidadDisponible}
          capacidadTotal={bateria?.capacidadTotal ?? inst?.capacidadBateriaKwh ?? null}
        />

        <QuickActionsCard />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <LiveTelemetryCard messages={messages} connectionStatus={connectionStatus} />
        <GroupedAlertsCard alertas={alertas ?? []} loading={alertasLoading} />
        <RelatedOrdersCard ordenes={ordenes ?? []} loading={ordenesLoading} />
        <NextMaintenanceCard mantenimientos={mantenimientos ?? []} loading={mantLoading} />
      </section>
    </div>
  )
}

function InstallationSummaryCard({
  loading,
  name,
  image,
  estado,
  tipoSistema,
  capacidadSolarKwp,
  capacidadBateriaKwh,
  ciudad,
  ultimaActualizacion,
}: {
  loading: boolean
  name?: string
  image?: string | null
  estado?: string
  tipoSistema?: string
  capacidadSolarKwp?: number
  capacidadBateriaKwh?: number
  ciudad?: string
  ultimaActualizacion?: string | null
}) {
  const { t } = useI18n()
  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-28 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.2fr)_repeat(5,minmax(120px,1fr))] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--color-neutral-100)]">
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Zap className="h-7 w-7 text-[var(--color-neutral-400)]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--color-text-primary)]">{name ?? "Instalación"}</h3>
            {estado && <StatusBadge estado={estado} className="mt-2" />}
          </div>
        </div>
        <SummaryItem label={t("inst.detail.summary.type")} value={tipoSistema?.replace("_", " ") ?? "—"} />
        <SummaryItem label={t("inst.detail.summary.solar")} value={capacidadSolarKwp != null ? `${capacidadSolarKwp} kWp` : "—"} />
        <SummaryItem label={t("inst.detail.summary.battery")} value={capacidadBateriaKwh != null ? `${capacidadBateriaKwh} kWh` : "—"} />
        <SummaryItem label={t("inst.detail.summary.city")} value={ciudad || "—"} />
        <SummaryItem
          label={t("inst.detail.summary.updated")}
          value={ultimaActualizacion ? formatRelativeTime(ultimaActualizacion) : "—"}
        />
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}

function BatterySystemCard({
  bateria,
  autonomiaMin,
  capacidadDisponible,
  capacidadTotal,
}: {
  bateria: BateriaSalud | null | undefined
  autonomiaMin: number | null
  capacidadDisponible: number | null
  capacidadTotal: number | null
}) {
  const { t } = useI18n()
  const healthLabel = bateria?.soc == null ? t("inst.detail.battery.nd") : bateria.soc >= 70 ? t("inst.detail.battery.optimal") : bateria.soc >= 40 ? t("inst.detail.battery.fair") : t("inst.detail.battery.critical")

  return (
    <PanelCard
      title={t("inst.detail.battery.title")}
      action={<span className="text-xs font-semibold text-[var(--color-energy-700)]">{t("inst.detail.battery.health")}: {healthLabel}</span>}
    >
      {bateria ? (
        <div className="grid gap-4 md:grid-cols-[130px_minmax(0,1fr)] 2xl:grid-cols-1">
          <div className="flex flex-col items-center">
            <BatteryGauge soc={Math.round(bateria.soc)} size={136} />
            <p className="tabular text-xs font-semibold text-[var(--color-text-primary)]">
              {capacidadDisponible != null ? formatEnergy(capacidadDisponible) : "—"} {t("inst.detail.battery.available")}
            </p>
            <p className="tabular text-xs text-[var(--color-text-muted)]">
              {t("inst.detail.battery.of")} {capacidadTotal != null ? formatEnergy(capacidadTotal) : "—"}
            </p>
          </div>
          <div className="space-y-2 text-xs">
            <BatteryRow label={t("inst.detail.battery.status")} value={bateria.estado ?? t("inst.detail.battery.noexposed")} />
            <BatteryRow label={t("inst.detail.battery.voltage")} value={formatVoltage(bateria.voltaje)} />
            <BatteryRow label={t("inst.detail.battery.current")} value={formatCurrent(bateria.corriente)} />
            <BatteryRow label={t("inst.detail.battery.temp")} value={formatTemp(bateria.temperatura)} />
            <BatteryRow label={t("inst.detail.battery.remain")} value={autonomiaMin != null ? formatDuration(autonomiaMin) : "—"} />
            <BatteryRow label={t("inst.detail.battery.source")} value={bateria.fuentePrincipal ?? "—"} />
            <BatteryRow label={t("inst.detail.battery.grid")} value={formatPower(bateria.desdeRed)} />
          </div>
        </div>
      ) : (
        <EmptyState title={t("inst.detail.empty.battery")} icon={Battery} className="py-8" />
      )}
      <Link
        to="/telemetria"
        className="mt-4 flex items-center justify-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs font-medium text-[var(--color-primary-700)] hover:underline"
      >
        {t("inst.detail.telemetry.live")}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </PanelCard>
  )
}

function BatteryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="tabular text-right font-semibold text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

function QuickActionsCard() {
  const { t } = useI18n()
  const actions = [
    { label: t("inst.detail.actions.alert"), to: "/alertas", icon: AlertTriangle, color: "text-[var(--color-danger-600)]", bg: "hover:bg-[var(--color-danger-50)]" },
    { label: t("inst.detail.actions.order"), to: "/ordenes", icon: ClipboardList, color: "text-[var(--color-primary-600)]", bg: "hover:bg-[var(--color-primary-50)]" },
    { label: t("inst.detail.actions.history"), to: "/analitica", icon: Activity, color: "text-[var(--color-sla-700)]", bg: "hover:bg-[var(--color-sla-50)]" },
    { label: t("inst.detail.actions.telemetry"), to: "/telemetria", icon: Radio, color: "text-[var(--color-energy-700)]", bg: "hover:bg-[var(--color-energy-50)]" },
    { label: t("inst.detail.actions.report"), to: "/reportes", icon: Download, color: "text-[var(--color-primary-700)]", bg: "hover:bg-[var(--color-primary-50)]" },
  ]

  return (
    <PanelCard title={t("inst.detail.actions.title")}>
      <div className="space-y-2">
        {actions.map(({ label, to, icon: Icon, color, bg }) => (
          <Link
            key={label}
            to={to}
            className={`flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-xs font-medium transition-colors ${bg}`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
            <span className="text-[var(--color-text-primary)]">{label}</span>
          </Link>
        ))}
      </div>
    </PanelCard>
  )
}

function LiveTelemetryCard({
  messages,
  connectionStatus,
}: {
  messages: TelemetriaEvento[]
  connectionStatus: ConexionWS
}) {
  const { t } = useI18n()
  return (
    <PanelCard title={t("inst.detail.telemetry.title")} action={<LiveBadge status={connectionStatus} />}>
      <TelemetryTimeline events={messages} className="max-h-[300px]" />
      <Link
        to="/telemetria"
        className="mt-3 flex items-center justify-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs font-medium text-[var(--color-primary-700)] hover:underline"
      >
        {t("inst.detail.telemetry.full")}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </PanelCard>
  )
}

function GroupedAlertsCard({ alertas, loading }: { alertas: Alerta[]; loading: boolean }) {
  const { t } = useI18n()
  const ALERT_GROUPS: Array<{ severidad: SeveridadAlerta; label: string; color: string }> = [
    { severidad: "critica", label: t("alert.sev.critical"), color: "text-[var(--color-danger-600)]" },
    { severidad: "alta", label: t("alert.sev.high"), color: "text-[var(--color-warning-600)]" },
    { severidad: "media", label: t("alert.sev.medium"), color: "text-[var(--color-solar-600)]" },
    { severidad: "baja", label: t("alert.sev.low"), color: "text-[var(--color-primary-600)]" },
  ]
  return (
    <PanelCard
      title={t("inst.detail.alerts.title")}
      action={
        <Link to="/alertas" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">
          {t("inst.detail.alerts.view")}
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
        </div>
      ) : alertas.length === 0 ? (
        <EmptyState title={t("inst.detail.empty.alerts")} icon={AlertTriangle} className="py-8" />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-neutral-50)] px-3 py-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{t("inst.detail.alerts.grouped")}</span>
            <span className="tabular rounded-full bg-[var(--color-danger-500)] px-2 py-0.5 text-xs font-bold text-white">
              {alertas.length}
            </span>
          </div>
          <div className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
            {ALERT_GROUPS.map((group) => {
              const items = alertas.filter((alerta) => alerta.severidad === group.severidad)
              if (items.length === 0) return null
              return (
                <div key={group.severidad}>
                  <div className="sticky top-0 z-10 mb-1 flex items-center justify-between bg-[var(--color-surface)] py-1">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${group.color}`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {group.label}
                    </span>
                    <span className="tabular rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                      {items.length}
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    {items.map((alerta) => (
                      <div key={alerta.id} className="px-3 py-2.5">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--color-text-primary)]">
                            {alerta.tipoAlertaNombre || "Alerta"}
                          </p>
                          <SeverityBadge severidad={alerta.severidad} />
                        </div>
                        <p className="truncate text-xs text-[var(--color-text-secondary)]">{alerta.descripcion}</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-xs text-[var(--color-text-muted)]">{formatRelativeTime(alerta.fechaCreacion)}</span>
                          <Link
                            to="/alertas"
                            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]"
                          >
                            {t("inst.detail.alerts.resolve")}
                          </Link>
                        </div>
                      </div>
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

function RelatedOrdersCard({ ordenes, loading }: { ordenes: Orden[]; loading: boolean }) {
  const { t } = useI18n()
  return (
    <PanelCard
      title={t("inst.detail.orders.title")}
      action={<Link to="/ordenes" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("inst.detail.orders.view")}</Link>}
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
        </div>
      ) : ordenes.length === 0 ? (
        <EmptyState title={t("inst.detail.empty.orders")} icon={ClipboardList} className="py-8" />
      ) : (
        <div className="max-h-[300px] divide-y divide-[var(--color-border)] overflow-y-auto pr-1">
          {ordenes.map((orden) => (
            <Link key={orden.id} to="/ordenes" className="flex items-center gap-3 py-3 hover:bg-[var(--color-neutral-50)]">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
                <ClipboardList className="h-4 w-4 text-[var(--color-primary-700)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">{orden.codigo}</span>
                  <OrdenEstadoBadge estado={orden.estado} />
                </div>
                <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">{orden.titulo}</p>
                <p className="truncate text-xs text-[var(--color-text-secondary)]">{t("inst.detail.orders.tech")}: {orden.tecnicoNombre ?? t("inst.detail.orders.unassigned")}</p>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
            </Link>
          ))}
        </div>
      )}
    </PanelCard>
  )
}

function NextMaintenanceCard({
  mantenimientos,
  loading,
}: {
  mantenimientos: MantenimientoProgramado[]
  loading: boolean
}) {
  const { t } = useI18n()
  const next = mantenimientos[0]

  return (
    <PanelCard
      title={t("inst.detail.maint.title")}
      action={<Link to="/mantenimiento" className="text-xs font-medium text-[var(--color-primary-600)] hover:underline">{t("inst.detail.maint.view")}</Link>}
    >
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : next ? (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{next.planNombre ?? t("inst.detail.maint.scheduled")}</p>
            <p className="mt-1 text-xs capitalize text-[var(--color-text-secondary)]">{next.tipo}</p>
            <span className="mt-3 inline-flex rounded-full border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] px-2 py-0.5 text-xs font-semibold capitalize text-[var(--color-primary-700)]">
              {next.estado}
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <MaintenanceInfo icon={<Calendar className="h-4 w-4" />} label={formatDate(next.fechaProgramada)} />
            <MaintenanceInfo icon={<Activity className="h-4 w-4" />} label={next.tecnicoNombre ? `${next.tecnicoNombre}` : t("inst.detail.maint.no_tech")} />
            <MaintenanceInfo icon={<FileText className="h-4 w-4" />} label={next.notas?.trim() || t("inst.detail.maint.no_notes")} />
          </div>
          <Link
            to="/mantenimiento"
            className="flex items-center justify-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs font-medium text-[var(--color-primary-700)] hover:underline"
          >
            {t("inst.detail.maint.plan")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <EmptyState title={t("inst.detail.empty.maint")} icon={Calendar} className="py-8" />
      )}
    </PanelCard>
  )
}

function MaintenanceInfo({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-3 text-[var(--color-text-secondary)]">
      <span className="mt-0.5 text-[var(--color-text-muted)]">{icon}</span>
      <span>{label}</span>
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

function latestIrradiance(tendencia: ReturnType<typeof useAnaliticaTendencia>["data"]) {
  const latest = [...(tendencia ?? [])].reverse().find((point) => point.irradiancia != null)
  return latest?.irradiancia == null ? "—" : `${Math.round(latest.irradiancia)} W/m²`
}
