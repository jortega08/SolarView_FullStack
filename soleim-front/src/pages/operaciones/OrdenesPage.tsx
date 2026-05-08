import { useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Filter,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { MetricCard } from "@/components/data/MetricCard"
import { ErrorState } from "@/components/feedback/ErrorState"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { OrdenEstadoBadge } from "@/components/status/OrdenEstadoBadge"
import { PriorityBadge } from "@/components/status/PriorityBadge"
import { useOrdenes, useTransicionarOrden } from "@/hooks/useOrdenes"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { cn } from "@/lib/cn"
import { formatDateTime, formatRelativeTime } from "@/lib/format"
import { OrdenKanbanColumn } from "@/features/operaciones/OrdenKanbanColumn"
import { OrdenDetalleSheet } from "@/features/operaciones/OrdenDetalleSheet"
import { CrearOrdenDialog } from "@/features/operaciones/CrearOrdenDialog"
import type { Orden } from "@/types/domain"
import type { EstadoOrden } from "@/types/enums"
import { useI18n } from "@/contexts/I18nContext"
import { usePermissions } from "@/hooks/usePermissions"

interface ColumnDef {
  estado: EstadoOrden
  label: string
  accent: string
}

const ACTIVE_STATES: EstadoOrden[] = ["abierta", "asignada", "en_progreso"]

interface FiltersState {
  estado: string
  prioridad: string
  instalacion: string
  tipo: string
  busqueda: string
}

const TRANSICIONES_PERMITIDAS: Record<EstadoOrden, EstadoOrden[]> = {
  abierta: ["cancelada"],
  asignada: ["en_progreso", "completada", "cancelada"],
  en_progreso: ["completada", "cancelada"],
  completada: ["cerrada"],
  cerrada: [],
  cancelada: [],
}

const TRANSICION_ACCION: Partial<
  Record<EstadoOrden, "iniciar" | "completar" | "cerrar" | "cancelar">
> = {
  en_progreso: "iniciar",
  completada: "completar",
  cerrada: "cerrar",
  cancelada: "cancelar",
}

export default function OrdenesPage() {
  const { t } = useI18n()
  const { ordenes: permOrdenes } = usePermissions()

  const COLUMNS: ColumnDef[] = [
    { estado: "abierta", label: t("order.col.open"), accent: "var(--color-solar-500)" },
    { estado: "asignada", label: t("order.col.assigned"), accent: "var(--color-primary-500)" },
    { estado: "en_progreso", label: t("order.col.progress"), accent: "var(--color-warning-500)" },
    { estado: "completada", label: t("order.col.completed"), accent: "var(--color-energy-500)" },
    { estado: "cerrada", label: t("order.col.closed"), accent: "var(--color-neutral-500)" },
    { estado: "cancelada", label: t("order.col.cancelled"), accent: "var(--color-danger-500)" },
  ]

  const [filters, setFilters] = useState<FiltersState>({
    estado: "",
    prioridad: "",
    instalacion: "",
    tipo: "",
    busqueda: "",
  })
  const [openOrdenId, setOpenOrdenId] = useState<number | null>(null)
  const [crearOpen, setCrearOpen] = useState(false)

  const {
    data: ordenes = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useOrdenes({
    estado: filters.estado || undefined,
    prioridad: filters.prioridad || undefined,
    instalacion: filters.instalacion ? Number(filters.instalacion) : undefined,
    limit: 200,
  })
  const { data: instalaciones } = useInstalaciones()
  const transicionar = useTransicionarOrden()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const tipos = useMemo(() => {
    const unique = new Set<string>()
    for (const orden of ordenes) {
      if (orden.tipo) unique.add(orden.tipo)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [ordenes])

  const filtradas = useMemo(() => {
    const q = filters.busqueda.trim().toLowerCase()
    return ordenes.filter((orden) => {
      if (filters.estado && orden.estado !== filters.estado) return false
      if (filters.prioridad && orden.prioridad !== filters.prioridad) return false
      if (filters.instalacion && orden.instalacionId !== Number(filters.instalacion)) return false
      if (filters.tipo && orden.tipo !== filters.tipo) return false
      if (!q) return true
      return [
        orden.codigo,
        orden.titulo,
        orden.descripcion ?? "",
        orden.instalacionNombre,
        orden.tecnicoNombre ?? "",
        orden.tipo ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [ordenes, filters.busqueda, filters.estado, filters.instalacion, filters.prioridad, filters.tipo])

  const metrics = useMemo(() => {
    const activas = ordenes.filter((orden) => ACTIVE_STATES.includes(orden.estado))
    const urgentes = ordenes.filter(
      (orden) => orden.prioridad === "urgente" || orden.slaVencido
    )
    const asignadas = ordenes.filter((orden) => orden.estado === "asignada")
    const enCampo = ordenes.filter((orden) => orden.estado === "en_progreso")
    const completadas = ordenes.filter((orden) => orden.estado === "completada")
    const tecnicos = new Set(
      activas.map((orden) => orden.tecnicoNombre).filter(Boolean)
    )

    return {
      total: ordenes.length,
      activas: activas.length,
      asignadas: asignadas.length,
      enCampo: enCampo.length,
      completadas: completadas.length,
      urgentes: urgentes.length,
      tecnicos: tecnicos.size,
    }
  }, [ordenes])

  const porEstado = useMemo(() => {
    const m = new Map<EstadoOrden, Orden[]>()
    for (const column of COLUMNS) m.set(column.estado, [])
    for (const orden of filtradas) {
      const arr = m.get(orden.estado as EstadoOrden)
      if (arr) arr.push(orden)
    }
    return m
  }, [filtradas])

  const ordenesCriticas = useMemo(
    () =>
      filtradas
        .filter(
          (orden) =>
            orden.slaVencido ||
            orden.prioridad === "urgente" ||
            orden.prioridad === "alta"
        )
        .sort((a, b) => {
          if (a.slaVencido !== b.slaVencido) return a.slaVencido ? -1 : 1
          const weight = { urgente: 0, alta: 1, media: 2, baja: 3 }
          return weight[a.prioridad] - weight[b.prioridad]
        })
        .slice(0, 12),
    [filtradas]
  )

  const cargaTecnicos = useMemo(() => {
    const grouped = new Map<string, { nombre: string; total: number; urgentes: number }>()
    for (const orden of filtradas) {
      if (!ACTIVE_STATES.includes(orden.estado)) continue
      const nombre = orden.tecnicoNombre ?? "Sin asignar"
      const item = grouped.get(nombre) ?? { nombre, total: 0, urgentes: 0 }
      item.total += 1
      if (orden.prioridad === "urgente" || orden.slaVencido) item.urgentes += 1
      grouped.set(nombre, item)
    }
    return Array.from(grouped.values())
      .sort((a, b) => b.total - a.total || b.urgentes - a.urgentes)
      .slice(0, 6)
  }, [filtradas])

  const handleDragEnd = (event: DragEndEvent) => {
    const ordenId = event.active.data.current?.ordenId as number | undefined
    const estadoActual = event.active.data.current?.estadoActual as EstadoOrden | undefined
    const estadoDestino = event.over?.data.current?.estadoDestino as EstadoOrden | undefined
    if (!ordenId || !estadoActual || !estadoDestino || estadoActual === estadoDestino) return

    const permitidas = TRANSICIONES_PERMITIDAS[estadoActual] ?? []
    if (!permitidas.includes(estadoDestino)) {
      toast.error(`No se permite mover de ${estadoActual} a ${estadoDestino}`)
      return
    }
    const accion = TRANSICION_ACCION[estadoDestino]
    if (!accion) return
    if (accion === "completar") {
      const notas = window.prompt("Notas de resolución (opcional):") ?? undefined
      transicionar.mutate({ id: ordenId, accion, notasResolucion: notas })
      return
    }
    if (accion === "cancelar") {
      const motivo = window.prompt("Motivo de cancelación:") ?? ""
      if (!motivo) return
      transicionar.mutate({ id: ordenId, accion, motivo })
      return
    }
    transicionar.mutate({ id: ordenId, accion })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("order.eyebrow")}
        title={t("order.title")}
        description={t("order.desc")}
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)]"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              {t("order.btn.refresh")}
            </button>
            {permOrdenes.crear && (
              <button
                onClick={() => setCrearOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
              >
                <Plus className="h-4 w-4" />
                {t("order.btn.new")}
              </button>
            )}
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title={t("order.metric.total")}
          value={String(metrics.total)}
          delta={t("order.metric.total.delta")}
          icon={ClipboardList}
          iconBg="bg-[var(--color-primary-50)]"
          iconColor="text-[var(--color-primary-600)]"
          loading={isLoading}
        />
        <MetricCard
          title={t("order.metric.active")}
          value={String(metrics.activas)}
          delta={t("order.metric.active.delta")}
          icon={Gauge}
          iconBg="bg-[var(--color-solar-50)]"
          iconColor="text-[var(--color-solar-700)]"
          loading={isLoading}
        />
        <MetricCard
          title={t("order.metric.assigned")}
          value={String(metrics.asignadas)}
          delta={t("order.metric.assigned.delta")}
          icon={UserCheck}
          iconBg="bg-[var(--color-primary-50)]"
          iconColor="text-[var(--color-primary-600)]"
          loading={isLoading}
        />
        <MetricCard
          title={t("order.metric.field")}
          value={String(metrics.enCampo)}
          delta={t("order.metric.field.delta")}
          icon={Wrench}
          iconBg="bg-[var(--color-warning-50)]"
          iconColor="text-[var(--color-warning-600)]"
          loading={isLoading}
        />
        <MetricCard
          title={t("order.metric.completed")}
          value={String(metrics.completadas)}
          delta={t("order.metric.completed.delta")}
          icon={CheckCircle2}
          iconBg="bg-[var(--color-energy-50)]"
          iconColor="text-[var(--color-energy-700)]"
          loading={isLoading}
        />
        <MetricCard
          title={t("order.metric.sla")}
          value={String(metrics.urgentes)}
          delta={metrics.urgentes > 0 ? t("order.metric.sla.risk") : t("order.metric.sla.ok")}
          deltaPositive={metrics.urgentes === 0}
          icon={ShieldAlert}
          iconBg="bg-[var(--color-danger-50)]"
          iconColor="text-[var(--color-danger-600)]"
          loading={isLoading}
        />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
            <Filter className="h-3.5 w-3.5" />
            {t("order.filter.label")}
          </div>

          <select
            value={filters.estado}
            onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
            className="min-h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2.5 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-300)]"
          >
            <option value="">{t("order.filter.status")}</option>
            {COLUMNS.map((column) => (
              <option key={column.estado} value={column.estado}>
                {column.label}
              </option>
            ))}
          </select>

          <select
            value={filters.prioridad}
            onChange={(e) => setFilters((f) => ({ ...f, prioridad: e.target.value }))}
            className="min-h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2.5 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-300)]"
          >
            <option value="">{t("order.filter.priority")}</option>
            <option value="urgente">{t("order.priority.urgent")}</option>
            <option value="alta">{t("order.priority.high")}</option>
            <option value="media">{t("order.priority.medium")}</option>
            <option value="baja">{t("order.priority.low")}</option>
          </select>

          <select
            value={filters.instalacion}
            onChange={(e) => setFilters((f) => ({ ...f, instalacion: e.target.value }))}
            className="min-h-9 max-w-[260px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2.5 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-300)]"
          >
            <option value="">{t("order.filter.all_inst")}</option>
            {(instalaciones ?? []).map((instalacion) => (
              <option key={instalacion.id} value={instalacion.id}>
                {instalacion.nombre}
              </option>
            ))}
          </select>

          <select
            value={filters.tipo}
            onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
            className="min-h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2.5 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary-300)]"
          >
            <option value="">{t("order.filter.all_type")}</option>
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>

          <div className="ml-auto flex min-h-9 min-w-[240px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2.5 focus-within:border-[var(--color-primary-300)]">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-muted)]" />
            <input
              value={filters.busqueda}
              onChange={(e) => setFilters((f) => ({ ...f, busqueda: e.target.value }))}
              placeholder={t("order.filter.search")}
              className="w-full bg-transparent text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </div>
      </section>

      {isError ? (
        <ErrorState message={t("order.error.load")} onRetry={() => refetch()} />
      ) : isLoading ? (
        <BoardSkeleton />
      ) : filtradas.length === 0 ? (
        <EmptyState
          title={t("order.empty")}
          description={t("order.empty.desc")}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {t("order.board.title")}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {t("order.board.desc")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {COLUMNS.map((column) => (
                  <div
                    key={column.estado}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: column.accent }}
                    />
                    {column.label}
                  </div>
                ))}
              </div>
            </div>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {COLUMNS.map((column) => (
                  <OrdenKanbanColumn
                    key={column.estado}
                    estado={column.estado}
                    label={column.label}
                    accentColor={column.accent}
                    ordenes={porEstado.get(column.estado) ?? []}
                    onOpenOrden={(id) => setOpenOrdenId(id)}
                  />
                ))}
              </div>
            </DndContext>
          </section>

          <aside className="space-y-4">
            <Panel title={t("order.panel.critical")} action={t("order.panel.critical.max")} icon={<AlertTriangle className="h-4 w-4" />}>
              {ordenesCriticas.length === 0 ? (
                <EmptyState
                  title={t("order.empty.urgent")}
                  description={t("order.empty.urgent.desc")}
                />
              ) : (
                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {ordenesCriticas.map((orden) => (
                    <button
                      key={orden.id}
                      onClick={() => setOpenOrdenId(orden.id)}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 text-left transition hover:border-[var(--color-primary-200)] hover:bg-[var(--color-primary-50)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                            {orden.codigo} · {orden.titulo}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-[var(--color-text-secondary)]">
                            {orden.instalacionNombre}
                          </p>
                        </div>
                        <PriorityBadge prioridad={orden.prioridad} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--color-text-muted)]">
                        <span>{orden.tecnicoNombre ?? t("order.tech.no")}</span>
                        <span
                          className={cn(
                            "tabular-nums",
                            orden.slaVencido && "font-semibold text-[var(--color-danger-600)]"
                          )}
                        >
                          {orden.slaVencido
                            ? t("order.sla.expired")
                            : formatRelativeTime(orden.fechaCreacion)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title={t("order.panel.technicians")} action={`${metrics.tecnicos} ${t("order.tech.active")}`} icon={<Users className="h-4 w-4" />}>
              {cargaTecnicos.length === 0 ? (
                <EmptyState
                  title={t("order.empty.load")}
                  description={t("order.empty.load.desc")}
                />
              ) : (
                <div className="space-y-3">
                  {cargaTecnicos.map((item) => {
                    const max = Math.max(...cargaTecnicos.map((t) => t.total), 1)
                    const pct = Math.round((item.total / max) * 100)
                    return (
                      <div key={item.nombre}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                            {item.nombre}
                          </p>
                          <span className="tabular-nums text-xs font-semibold text-[var(--color-text-secondary)]">
                            {item.total}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-neutral-100)]">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              item.urgentes > 0
                                ? "bg-[var(--color-danger-500)]"
                                : "bg-[var(--color-primary-500)]"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                          {item.urgentes > 0
                            ? `${item.urgentes} ${t("order.tech.urgent")}`
                            : t("order.tech.no_urgent")}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>

            <Panel title={t("order.panel.actions")} icon={<BriefcaseBusiness className="h-4 w-4" />}>
              <div className="space-y-2">
                <button
                  onClick={() => setCrearOpen(true)}
                  className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)]"
                >
                  {t("order.action.create")}
                  <Plus className="h-4 w-4 text-[var(--color-primary-600)]" />
                </button>
                <Link
                  to="/tecnicos"
                  className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)]"
                >
                  {t("order.action.view_tech")}
                  <Users className="h-4 w-4 text-[var(--color-primary-600)]" />
                </Link>
                <button
                  onClick={() => refetch()}
                  className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)]"
                >
                  {t("order.action.sync")}
                  <RefreshCw className={cn("h-4 w-4 text-[var(--color-primary-600)]", isFetching && "animate-spin")} />
                </button>
              </div>
            </Panel>

            <Panel title={t("order.panel.activity")} icon={<Clock3 className="h-4 w-4" />}>
              <div className="space-y-2">
                {filtradas.slice(0, 5).map((orden) => (
                  <button
                    key={orden.id}
                    onClick={() => setOpenOrdenId(orden.id)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-2 text-left hover:bg-[var(--color-neutral-50)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[11px] text-[var(--color-text-muted)]">
                        {orden.codigo}
                      </span>
                      <OrdenEstadoBadge estado={orden.estado} />
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-[var(--color-text-primary)]">
                      {orden.titulo}
                    </p>
                    <p className="mt-1 tabular-nums text-[11px] text-[var(--color-text-muted)]">
                      {formatDateTime(orden.fechaCreacion)}
                    </p>
                  </button>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      )}

      <OrdenDetalleSheet
        ordenId={openOrdenId}
        open={openOrdenId != null}
        onOpenChange={(open) => !open && setOpenOrdenId(null)}
      />

      <CrearOrdenDialog open={crearOpen} onOpenChange={setCrearOpen} />
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {(["abierta", "asignada", "en_progreso", "completada"] as const).map((estado) => (
            <div key={estado} className="w-80 flex-shrink-0 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      </section>
      <aside className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-40 w-full" />
      </aside>
    </div>
  )
}

interface PanelProps {
  title: string
  action?: string
  icon?: ReactNode
  children: ReactNode
}

function Panel({ title, action, icon, children }: PanelProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
              {icon}
            </div>
          )}
          <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>
        {action && (
          <span className="flex-shrink-0 text-xs font-medium text-[var(--color-primary-600)]">
            {action}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
