import { useParams, Link } from "react-router-dom"
import {
  Zap, Battery, Thermometer, Sun, Activity,
  AlertTriangle, ClipboardList, Calendar, Download,
  ChevronRight, MapPin, Settings2
} from "lucide-react"
import { useDetalleInstalacion } from "@/hooks/useDetalleInstalacion"
import { useAnaliticaBateria, useAnaliticaAutonomia, useAnaliticaTendencia } from "@/hooks/useAnalitica"
import { useAlertas } from "@/hooks/useAlertas"
import { useOrdenes } from "@/hooks/useOrdenes"
import { useMantenimientos } from "@/hooks/useMantenimientos"
import { useSensorSocket } from "@/hooks/useSensorSocket"
import { MetricCard } from "@/components/data/MetricCard"
import { ChartCard } from "@/components/data/ChartCard"
import { AreaTimeSeries } from "@/components/charts/AreaTimeSeries"
import { BatteryGauge } from "@/components/domain/BatteryGauge"
import { TelemetryTimeline } from "@/components/domain/TelemetryTimeline"
import { AlertList } from "@/components/domain/AlertList"
import { StatusBadge } from "@/components/status/StatusBadge"
import { SeverityBadge } from "@/components/status/SeverityBadge"
import { LiveBadge } from "@/components/status/LiveBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { ErrorState } from "@/components/feedback/ErrorState"
import {
  formatPower, formatEnergy, formatPercent, formatTemp,
  formatVoltage, formatCurrent, formatRelativeTime, formatDate, formatDuration
} from "@/lib/format"
import { subDays, format } from "date-fns"

export default function InstalacionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const instalacionId = id ? parseInt(id, 10) : null

  const { data: inst, isLoading: instLoading, isError: instError, refetch } = useDetalleInstalacion(instalacionId)
  const { data: bateria } = useAnaliticaBateria(instalacionId)
  const { data: autonomia } = useAnaliticaAutonomia(instalacionId)
  const { data: alertas, isLoading: alertasLoading } = useAlertas({ instalacion: instalacionId ?? undefined, estado: "activa" })
  const { data: ordenes, isLoading: ordenesLoading } = useOrdenes({ instalacion: instalacionId ?? undefined, limit: 3 })
  const { data: mantenimientos } = useMantenimientos({ instalacion: instalacionId ?? undefined, limit: 1 })
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
      : null

  if (instError) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorState message="Error al cargar la instalación" onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <Link to="/" className="hover:text-[var(--color-primary-600)]">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/instalaciones" className="hover:text-[var(--color-primary-600)]">Instalaciones</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[var(--color-text-primary)] font-medium">{inst?.nombre ?? "Detalle"}</span>
      </nav>

      {/* Banner cabecera */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-4">
        {instLoading ? (
          <div className="flex gap-4 items-center">
            <Skeleton className="w-16 h-16 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ) : inst ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--color-neutral-100)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {inst.imagen ? (
                <img src={inst.imagen} alt={inst.nombre} className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-7 h-7 text-[var(--color-neutral-400)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{inst.nombre}</h1>
                <StatusBadge estado={inst.estado} />
                <LiveBadge status={connectionStatus} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1"><Settings2 className="w-3.5 h-3.5" />{inst.tipoSistema}</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{inst.capacidadSolarKwp} kWp solar</span>
                <span className="flex items-center gap-1"><Battery className="w-3.5 h-3.5" />{inst.capacidadBateriaKwh} kWh batería</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{inst.ciudad}</span>
                {inst.ultimaActualizacion && (
                  <span className="text-[var(--color-text-muted)]">Actualizado {formatRelativeTime(inst.ultimaActualizacion)}</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <MetricCard title="Potencia actual" value={formatPower(inst?.potenciaActual)} icon={Zap} iconBg="bg-[var(--color-energy-50)]" iconColor="text-[var(--color-energy-600)]" loading={instLoading} />
        <MetricCard title="Generación hoy" value={formatEnergy(inst?.generacionHoy)} icon={Sun} iconBg="bg-[var(--color-solar-50)]" iconColor="text-[var(--color-solar-600)]" loading={instLoading} />
        <MetricCard title="Consumo actual" value={formatPower(inst?.consumoActual)} icon={Activity} iconBg="bg-[var(--color-primary-50)]" iconColor="text-[var(--color-primary-600)]" loading={instLoading} />
        <MetricCard title="Batería SOC" value={bateria ? formatPercent(bateria.soc) : "—"} icon={Battery} iconBg="bg-[var(--color-energy-50)]" iconColor="text-[var(--color-energy-600)]" loading={instLoading} />
        <MetricCard title="Autonomía est." value={autonomiaMin != null ? formatDuration(autonomiaMin) : "—"} icon={Battery} iconBg="bg-[var(--color-sla-50)]" iconColor="text-[var(--color-sla-600)]" loading={instLoading} />
        <MetricCard title="Temperatura" value={bateria ? formatTemp(bateria.temperatura) : "—"} icon={Thermometer} iconBg="bg-[var(--color-solar-50)]" iconColor="text-[var(--color-solar-600)]" loading={instLoading} />
        <MetricCard title="Irradiancia" value={"—"} icon={Sun} iconBg="bg-[var(--color-solar-50)]" iconColor="text-[var(--color-solar-600)]" loading={instLoading} />
        <MetricCard title="Eficiencia" value={formatPercent(inst?.eficiencia)} icon={Activity} iconBg="bg-[var(--color-energy-50)]" iconColor="text-[var(--color-energy-600)]" loading={instLoading} />
      </div>

      {/* Gráfico + Batería + Acciones */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard title="Generación, consumo y batería" loading={tendLoading} className="xl:col-span-2">
          {tendencia && tendencia.length > 0 ? (
            <AreaTimeSeries data={tendencia} />
          ) : (
            <EmptyState title="Sin datos de tendencia" icon={Zap} />
          )}
        </ChartCard>

        <div className="space-y-4">
          {/* Salud batería */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              Batería y salud del sistema
            </h3>
            {bateria ? (
              <div className="flex gap-4 items-start">
                <BatteryGauge soc={bateria.soc} />
                <div className="flex-1 space-y-1.5 text-xs">
                  {[
                    ["Voltaje", formatVoltage(bateria.voltaje)],
                    ["Corriente", formatCurrent(bateria.corriente)],
                    ["Temperatura", formatTemp(bateria.temperatura)],
                    ["Fuente", bateria.fuentePrincipal ?? "—"],
                    ["Desde red", formatEnergy(bateria.desdeRed)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">{k}</span>
                      <span className="font-medium tabular text-[var(--color-text-primary)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Sin datos de batería" icon={Battery} />
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Acciones rápidas</h3>
            <div className="space-y-2">
              {[
                { icon: AlertTriangle, label: "Resolver alerta", color: "text-[var(--color-danger-600)]", bg: "hover:bg-[var(--color-danger-50)]" },
                { icon: ClipboardList, label: "Crear orden", color: "text-[var(--color-primary-600)]", bg: "hover:bg-[var(--color-primary-50)]" },
                { icon: Activity, label: "Ver histórico", color: "text-[var(--color-neutral-600)]", bg: "hover:bg-[var(--color-neutral-100)]" },
                { icon: Download, label: "Exportar reporte", color: "text-[var(--color-energy-600)]", bg: "hover:bg-[var(--color-energy-50)]" },
              ].map(({ icon: Icon, label, color, bg }) => (
                <button
                  key={label}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors ${bg}`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
                  <span className={color}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetría + Alertas + Órdenes + Mantenimiento */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Telemetría en vivo */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Telemetría en vivo</h3>
            <LiveBadge status={connectionStatus} />
          </div>
          <div className="px-4 py-2">
            <TelemetryTimeline events={messages} />
          </div>
        </div>

        {/* Alertas activas */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Alertas activas</h3>
              {alertas && alertas.length > 0 && (
                <span className="w-5 h-5 bg-[var(--color-danger-500)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {alertas.length}
                </span>
              )}
            </div>
            <Link to="/alertas" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">Ver todas</Link>
          </div>
          <div className="px-4 py-2">
            {alertasLoading ? (
              <div className="space-y-2 py-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <AlertList alerts={alertas ?? []} showResolve />
            )}
          </div>
        </div>
      </div>

      {/* Órdenes relacionadas + Próximo mantenimiento */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Órdenes relacionadas</h3>
            <Link to="/ordenes" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {ordenesLoading ? (
              <div className="px-4 py-3 space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : ordenes?.length === 0 ? (
              <EmptyState title="Sin órdenes relacionadas" icon={ClipboardList} className="py-6" />
            ) : (
              ordenes?.map((o) => (
                <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-[var(--color-neutral-400)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{o.titulo}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {o.tecnicoNombre ?? "Sin asignar"} · {o.fechaVencimiento ? formatDate(o.fechaVencimiento) : ""}
                    </p>
                  </div>
                  <SeverityBadge severidad={o.prioridad} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Próximo mantenimiento</h3>
            <Link to="/mantenimiento" className="text-xs text-[var(--color-primary-600)] font-medium hover:underline">Ver plan</Link>
          </div>
          <div className="p-4">
            {mantenimientos && mantenimientos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-primary-500)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">{mantenimientos[0].tipo}</span>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                  <p><span className="text-[var(--color-text-muted)]">Fecha: </span>{formatDate(mantenimientos[0].fechaProgramada)}</p>
                  {mantenimientos[0].tecnicoNombre && (
                    <p><span className="text-[var(--color-text-muted)]">Técnico: </span>{mantenimientos[0].tecnicoNombre}</p>
                  )}
                  <p className="capitalize">
                    <span className="text-[var(--color-text-muted)]">Estado: </span>{mantenimientos[0].estado}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState title="Sin mantenimientos programados" icon={Calendar} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
