import { useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { ErrorState } from "@/components/feedback/ErrorState"
import { useAlertas, useResolverAlerta } from "@/hooks/useAlertas"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { usePanelEmpresa } from "@/hooks/usePanelEmpresa"
import { CrearOrdenDialog } from "@/features/operaciones/CrearOrdenDialog"

import { AlertasFilterBar } from "@/features/alertas/AlertasFilterBar"
import { AlertasKpiCards } from "@/features/alertas/AlertasKpiCards"
import { AlertasSlaDonut } from "@/features/alertas/AlertasSlaDonut"
import { AlertasPriorityTable } from "@/features/alertas/AlertasPriorityTable"
import { AlertasDetalleSheet } from "@/features/alertas/AlertasDetalleSheet"
import { AlertasHeatmap } from "@/features/alertas/AlertasHeatmap"
import { AlertasTrendChart } from "@/features/alertas/AlertasTrendChart"
import { RiskInstalacionesWidget, AtencionInmediataWidget } from "@/features/alertas/AlertasRiskSidebar"
import {
  enrichAlertas,
  filterAlertas,
  sortByPriority,
  computeKpis,
  computeSlaBreakdown,
  computeHeatmapData,
  computeTrendData,
} from "@/features/alertas/alertasUtils"
import type { AlertaFilterState, AlertaEnriquecida } from "@/features/alertas/types"
import { cn } from "@/lib/cn"

export default function AlertasPage() {
  /* ── Estado de filtros ─────────────────────────────────────────────── */
  const [filters, setFilters] = useState<AlertaFilterState>({
    rango: "24h",
    severidad: "",
    estado: "activa",
    instalacion: "",
    busqueda: "",
  })

  /* ── Estado de UI ──────────────────────────────────────────────────── */
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaEnriquecida | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [trendDays, setTrendDays] = useState<7 | 14 | 30>(7)
  const [crearOrden, setCrearOrden] = useState<{
    open: boolean
    alertaId?: number
    instalacionId?: number
    titulo?: string
    descripcion?: string
  }>({ open: false })

  /* ── Datos del servidor ────────────────────────────────────────────── */
  const { data: rawAlertas = [], isLoading, isError, refetch } = useAlertas({ limit: 500 })
  const { data: panel } = usePanelEmpresa()
  const { data: instalaciones = [] } = useInstalaciones()
  const { mutate: resolver, isPending: resolviendo } = useResolverAlerta()

  /* ── Datos derivados ───────────────────────────────────────────────── */
  const enriched = useMemo(() => enrichAlertas(rawAlertas), [rawAlertas])
  const filtered = useMemo(() => filterAlertas(enriched, filters), [enriched, filters])
  const prioritized = useMemo(() => sortByPriority(filtered), [filtered])
  const kpis = useMemo(() => computeKpis(enriched, panel), [enriched, panel])
  const slaBreakdown = useMemo(
    () => computeSlaBreakdown(enriched.filter((a) => a.estado === "activa")),
    [enriched],
  )
  const heatmapData = useMemo(
    () => computeHeatmapData(enriched.filter((a) => a.estado === "activa")),
    [enriched],
  )
  const trendData = useMemo(() => computeTrendData(enriched, trendDays), [enriched, trendDays])

  /* ── Handlers ──────────────────────────────────────────────────────── */
  function handleVerDetalle(alerta: AlertaEnriquecida) {
    setSelectedAlerta(alerta)
    setSheetOpen(true)
  }

  function handleVerAhora(filtro: { severidad?: string; slaEstado?: string }) {
    setFilters((prev) => ({
      ...prev,
      severidad: filtro.severidad ?? "",
      slaEstado: filtro.slaEstado ?? "",
      estado: "activa",
      rango: "24h",
    }))
    // Scroll suave a la tabla de prioridad
    setTimeout(() => {
      document.getElementById("alertas-priority-table")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function handleCrearOrden(alerta: AlertaEnriquecida) {
    setCrearOrden({
      open: true,
      alertaId: alerta.id,
      instalacionId: alerta.instalacionId,
      titulo: `Atender alerta: ${alerta.tipoAlertaNombre || alerta.descripcion.slice(0, 60)}`,
      descripcion: alerta.descripcion,
    })
  }

  /* ── Render ────────────────────────────────────────────────────────── */
  if (isError) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Centro de operaciones"
          title="Centro de Alertas"
          description="Monitoreo, priorización y cumplimiento SLA en todas las instalaciones"
        />
        <ErrorState
          message="No se pudieron cargar las alertas. Verifica la conexión con el servidor."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        eyebrow="Centro de operaciones"
        title="Centro de Alertas"
        description="Monitoreo, priorización y cumplimiento SLA en todas las instalaciones"
        actions={
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-card)] hover:bg-[var(--color-neutral-50)] disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Actualizar
          </button>
        }
      />

      {/* Filtros */}
      <AlertasFilterBar
        value={filters}
        onChange={setFilters}
        instalaciones={instalaciones}
        resultCount={filtered.length}
        loading={isLoading}
      />

      {/* KPI Cards */}
      <AlertasKpiCards
        kpis={kpis}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
      />

      {/* Cuadrícula principal: contenido (2/3) + sidebar (1/3) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AlertasSlaDonut breakdown={slaBreakdown} loading={isLoading} />
        </div>
        <AtencionInmediataWidget alertas={enriched} loading={isLoading} onVerAhora={handleVerAhora} />
      </div>

      <div id="alertas-priority-table" className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AlertasPriorityTable
            alertas={prioritized}
            loading={isLoading}
            onVerDetalle={handleVerDetalle}
            onResolver={(id) => resolver(id)}
            onCrearOrden={handleCrearOrden}
            resolviendo={resolviendo}
          />
        </div>
        <RiskInstalacionesWidget
          instalaciones={instalaciones}
          alertas={enriched}
          panel={panel}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <AlertasHeatmap data={heatmapData} loading={isLoading} />
        </div>
        <div className="xl:col-span-2">
          <AlertasTrendChart
            data={trendData}
            loading={isLoading}
            trendDays={trendDays}
            onChangeDays={setTrendDays}
          />
        </div>
      </div>

      {/* Sheet de detalle */}
      <AlertasDetalleSheet
        alerta={selectedAlerta}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onResolver={(id) => resolver(id)}
        onCrearOrden={handleCrearOrden}
        resolviendo={resolviendo}
      />

      {/* Dialog para crear orden */}
      <CrearOrdenDialog
        open={crearOrden.open}
        onOpenChange={(o) => setCrearOrden((s) => ({ ...s, open: o }))}
        defaultInstalacion={crearOrden.instalacionId}
        defaultAlertaId={crearOrden.alertaId}
        defaultTitulo={crearOrden.titulo}
        defaultDescripcion={crearOrden.descripcion}
      />
    </div>
  )
}
