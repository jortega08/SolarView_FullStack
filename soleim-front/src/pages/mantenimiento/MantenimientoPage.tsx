import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { format, endOfMonth, startOfMonth } from "date-fns"
import { Link } from "react-router-dom"
import {
  CalendarDays,
  ClipboardList,
  FileText,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import {
  useCancelarMantenimiento,
  useContratos,
  useMantenimientos,
  usePlanes,
} from "@/hooks/useMantenimientos"
import { cn } from "@/lib/cn"
import type { MantenimientoProgramado } from "@/types/domain"
import { MaintenanceCalendar } from "@/features/mantenimiento/MaintenanceCalendar"
import { MaintenanceKpiCards } from "@/features/mantenimiento/MaintenanceKpiCards"
import { MaintenanceTable } from "@/features/mantenimiento/MaintenanceTable"
import { ContractServicePanel } from "@/features/mantenimiento/ContractServicePanel"
import { MaintenancePlanList } from "@/features/mantenimiento/MaintenancePlanList"
import { MantenimientoDetalleSheet } from "@/features/mantenimiento/MantenimientoDetalleSheet"
import { useI18n } from "@/contexts/I18nContext"

type Tab = "calendario" | "lista" | "contratos" | "planes"

interface FiltersState {
  estado: string
  instalacion: string
  plan: string
  desde: string
  hasta: string
  busqueda: string
}

export default function MantenimientoPage() {
  const { t } = useI18n()

  const TABS: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "calendario", label: t("maint.tab.calendar"), icon: <CalendarDays className="h-4 w-4" /> },
    { id: "lista", label: t("maint.tab.table"), icon: <ListChecks className="h-4 w-4" /> },
    { id: "contratos", label: t("maint.tab.contracts"), icon: <FileText className="h-4 w-4" /> },
    { id: "planes", label: t("maint.tab.plans"), icon: <ClipboardList className="h-4 w-4" /> },
  ]

  const now = new Date()
  const [tab, setTab] = useState<Tab>("calendario")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filters, setFilters] = useState<FiltersState>({
    estado: "",
    instalacion: "",
    plan: "",
    desde: format(startOfMonth(now), "yyyy-MM-dd"),
    hasta: format(endOfMonth(now), "yyyy-MM-dd"),
    busqueda: "",
  })

  const mantenimientoParams = {
    desde: filters.desde || undefined,
    hasta: filters.hasta || undefined,
    estado: filters.estado || undefined,
    instalacion: filters.instalacion ? Number(filters.instalacion) : undefined,
    plan: filters.plan ? Number(filters.plan) : undefined,
  }

  const {
    data: mantenimientos = [],
    isLoading,
    isError,
    refetch: refetchMantenimientos,
  } = useMantenimientos(mantenimientoParams)
  const {
    data: contratos = [],
    isLoading: contratosLoading,
    refetch: refetchContratos,
  } = useContratos()
  const {
    data: planes = [],
    isLoading: planesLoading,
    refetch: refetchPlanes,
  } = usePlanes()
  const { data: instalaciones = [] } = useInstalaciones()
  const cancelar = useCancelarMantenimiento()

  const filteredMantenimientos = useMemo(() => {
    const q = filters.busqueda.trim().toLowerCase()
    if (!q) return mantenimientos
    return mantenimientos.filter((m) =>
      [
        m.instalacionNombre,
        m.planNombre ?? "",
        m.tipo,
        m.ordenCodigo ?? "",
        m.notas ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [mantenimientos, filters.busqueda])

  const selectedMantenimiento = useMemo(
    () => mantenimientos.find((m) => m.id === selectedId) ?? null,
    [mantenimientos, selectedId]
  )

  const selectedPlan = useMemo(
    () =>
      selectedMantenimiento?.planId
        ? planes.find((p) => p.id === selectedMantenimiento.planId) ?? null
        : null,
    [planes, selectedMantenimiento]
  )

  const openDetalle = (mantenimiento: MantenimientoProgramado) => {
    setSelectedId(mantenimiento.id)
    setSheetOpen(true)
  }

  const refreshAll = () => {
    void refetchMantenimientos()
    void refetchContratos()
    void refetchPlanes()
  }

  const onCalendarDatesSet = (desde: string, hasta: string) => {
    setFilters((current) =>
      current.desde === desde && current.hasta === hasta
        ? current
        : { ...current, desde, hasta }
    )
  }

  const onCancel = (mantenimiento: MantenimientoProgramado) => {
    const motivo = window.prompt("Motivo de cancelación:") ?? ""
    if (!motivo.trim()) return
    cancelar.mutate({ id: mantenimiento.id, motivo })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("maint.eyebrow")}
        title={t("maint.title")}
        description={t("maint.desc")}
        actions={
          <>
            <button
              type="button"
              disabled
              title={t("maint.btn.schedule")}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-100)] px-3 py-2 text-sm font-medium text-[var(--color-text-muted)]"
            >
              <Plus className="h-4 w-4" />
              {t("maint.btn.schedule")}
            </button>
            <Link
              to="/ordenes"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
            >
              <ClipboardList className="h-4 w-4" />
              {t("maint.btn.order")}
            </Link>
            <button
              type="button"
              onClick={() => setTab("contratos")}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
            >
              <FileText className="h-4 w-4" />
              {t("maint.btn.contracts")}
            </button>
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
            >
              <RefreshCw className="h-4 w-4" />
              {t("maint.btn.refresh")}
            </button>
          </>
        }
      />

      <MaintenanceKpiCards
        mantenimientos={filteredMantenimientos}
        contratos={contratos}
        loading={isLoading || contratosLoading}
        error={isError}
        onRetry={() => refetchMantenimientos()}
      />

      <Filters
        filters={filters}
        onChange={setFilters}
        instalaciones={instalaciones.map((i) => ({ id: i.id, nombre: i.nombre }))}
        planes={planes.map((p) => ({ id: p.id, nombre: p.nombre }))}
      />

      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-[var(--color-primary-600)] text-[var(--color-primary-700)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === "calendario" && (
        <>
          {isError ? (
            <ErrorState
              message={t("maint.error.calendar")}
              onRetry={() => refetchMantenimientos()}
            />
          ) : isLoading ? (
            <Skeleton className="h-[560px] w-full rounded-[var(--radius-lg)]" />
          ) : (
            <MaintenanceCalendar
              mantenimientos={filteredMantenimientos}
              onDatesSet={onCalendarDatesSet}
              onEventClick={(id) => {
                const mantenimiento = mantenimientos.find((m) => m.id === id)
                if (mantenimiento) openDetalle(mantenimiento)
              }}
            />
          )}
        </>
      )}

      {tab === "lista" && (
        <>
          {isError ? (
            <ErrorState
              message={t("maint.error.load")}
              onRetry={() => refetchMantenimientos()}
            />
          ) : (
            <MaintenanceTable
              mantenimientos={filteredMantenimientos}
              loading={isLoading}
              onView={openDetalle}
              onCancel={onCancel}
              cancellingId={cancelar.isPending ? cancelar.variables?.id ?? null : null}
            />
          )}
        </>
      )}

      {tab === "contratos" && (
        <ContractServicePanel contratos={contratos} loading={contratosLoading} />
      )}

      {tab === "planes" && (
        <MaintenancePlanList planes={planes} loading={planesLoading} />
      )}

      <MantenimientoDetalleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mantenimiento={selectedMantenimiento}
        plan={selectedPlan}
      />
    </div>
  )
}

function Filters({
  filters,
  onChange,
  instalaciones,
  planes,
}: {
  filters: FiltersState
  onChange: Dispatch<SetStateAction<FiltersState>>
  instalaciones: Array<{ id: number; nombre: string }>
  planes: Array<{ id: number; nombre: string }>
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1.5fr]">
        <Field label={t("maint.filter.inst")}>
          <select
            value={filters.instalacion}
            onChange={(e) => onChange((f) => ({ ...f, instalacion: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">{t("maint.filter.all")}</option>
            {instalaciones.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("maint.filter.status")}>
          <select
            value={filters.estado}
            onChange={(e) => onChange((f) => ({ ...f, estado: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">{t("maint.filter.all_status")}</option>
            <option value="programado">{t("maint.status.scheduled")}</option>
            <option value="en_proceso">{t("maint.status.in_progress")}</option>
            <option value="completado">{t("maint.status.completed")}</option>
            <option value="cancelado">{t("maint.status.cancelled")}</option>
          </select>
        </Field>
        <Field label={t("maint.filter.plan")}>
          <select
            value={filters.plan}
            onChange={(e) => onChange((f) => ({ ...f, plan: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">{t("maint.filter.all_plans")}</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("maint.filter.from")}>
          <input
            type="date"
            value={filters.desde}
            onChange={(e) => onChange((f) => ({ ...f, desde: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none tabular"
          />
        </Field>
        <Field label={t("maint.filter.to")}>
          <input
            type="date"
            value={filters.hasta}
            onChange={(e) => onChange((f) => ({ ...f, hasta: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none tabular"
          />
        </Field>
        <Field label={t("maint.filter.search")}>
          <div className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2">
            <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              value={filters.busqueda}
              onChange={(e) => onChange((f) => ({ ...f, busqueda: e.target.value }))}
              placeholder={t("maint.filter.placeholder")}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  )
}
