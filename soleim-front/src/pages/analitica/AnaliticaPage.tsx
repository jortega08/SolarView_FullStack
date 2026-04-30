import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Download, FileText, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  AnalyticsFilters,
  type AnalyticsFilterState,
} from "@/features/analitica/AnalyticsFilters"
import { AnalyticsKpiCards, type AnalyticsKpis } from "@/features/analitica/AnalyticsKpiCards"
import { AlertsSeverityChart } from "@/features/analitica/AlertsSeverityChart"
import { BatteryPerformanceChart } from "@/features/analitica/BatteryPerformanceChart"
import { ConsumptionPeriodChart } from "@/features/analitica/ConsumptionPeriodChart"
import { EnergyTrendChart } from "@/features/analitica/EnergyTrendChart"
import { InsightPanel } from "@/features/analitica/InsightPanel"
import { InstallationBenchmarkTable } from "@/features/analitica/InstallationBenchmarkTable"
import { InstallationComparisonChart } from "@/features/analitica/InstallationComparisonChart"
import { useAlertas } from "@/hooks/useAlertas"
import {
  useAnaliticaActividades,
  useAnaliticaAutonomia,
  useAnaliticaBateria,
  useAnaliticaComparativa,
  useAnaliticaTendencia,
} from "@/hooks/useAnalitica"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { useMantenimientos } from "@/hooks/useMantenimientos"
import { usePanelEmpresa } from "@/hooks/usePanelEmpresa"
import { useEmpresas } from "@/hooks/useReportes"
import type { Alerta, MantenimientoProgramado } from "@/types/domain"

const DEFAULT_FILTERS: AnalyticsFilterState = {
  periodo: "month",
  fuente: "todas",
  comparacion: "instalaciones",
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function subtractDays(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function daysBetween(start?: string, end?: string): number {
  if (!start || !end) return 30
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 30
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1)
}

function dateRange(filters: AnalyticsFilterState): { start: string; end: string; days: number } {
  const end = toDateInput(new Date())
  if (filters.periodo === "week") return { start: toDateInput(subtractDays(6)), end, days: 7 }
  if (filters.periodo === "year") return { start: toDateInput(subtractDays(364)), end, days: 365 }
  if (filters.periodo === "custom") {
    const start = filters.fechaInicio ?? toDateInput(subtractDays(29))
    const customEnd = filters.fechaFin ?? end
    return { start, end: customEnd, days: daysBetween(start, customEnd) }
  }
  return { start: toDateInput(subtractDays(29)), end, days: 30 }
}

function periodForActivities(filters: AnalyticsFilterState): "week" | "month" | "year" {
  if (filters.periodo !== "custom") return filters.periodo
  const days = daysBetween(filters.fechaInicio, filters.fechaFin)
  if (days <= 7) return "week"
  if (days <= 31) return "month"
  return "year"
}

function sumValues(values: Array<number | null | undefined>): number | null {
  if (values.length === 0) return null
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function filterAlertasByRange(alertas: Alerta[], filters: AnalyticsFilterState): Alerta[] {
  const range = dateRange(filters)
  const start = new Date(`${range.start}T00:00:00`).getTime()
  const end = new Date(`${range.end}T23:59:59`).getTime()
  return alertas.filter((alerta) => {
    const timestamp = new Date(alerta.fechaCreacion).getTime()
    return Number.isNaN(timestamp) ? true : timestamp >= start && timestamp <= end
  })
}

function countCompletedMantenimientos(items: MantenimientoProgramado[]): number {
  return items.filter((item) => item.estado === "completado").length
}

export default function AnaliticaPage() {
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilterState>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilterState>(DEFAULT_FILTERS)

  const range = dateRange(appliedFilters)
  const { data: panel, isLoading: panelLoading, isError: panelError, refetch: refetchPanel } = usePanelEmpresa(appliedFilters.empresaId)
  const effectiveEmpresaId = appliedFilters.empresaId ?? panel?.empresaId ?? null
  const { data: empresas = [], isLoading: empresasLoading } = useEmpresas()
  const { data: instalaciones = [], isLoading: instalacionesLoading } = useInstalaciones()
  const primaryInstalacionId = appliedFilters.instalacionId ?? instalaciones[0]?.id

  const actividadesQuery = useAnaliticaActividades({
    instalacionId: primaryInstalacionId,
    periodo: periodForActivities(appliedFilters),
  })
  const tendenciaQuery = useAnaliticaTendencia({
    instalacionId: primaryInstalacionId,
    fechaInicio: range.start,
    fechaFin: range.end,
  })
  const bateriaQuery = useAnaliticaBateria(primaryInstalacionId ?? null)
  const autonomiaQuery = useAnaliticaAutonomia(primaryInstalacionId ?? null)
  const comparativaQuery = useAnaliticaComparativa(effectiveEmpresaId)
  const alertasQuery = useAlertas({
    instalacion: appliedFilters.instalacionId,
  })
  const mantenimientosQuery = useMantenimientos({
    instalacion: appliedFilters.instalacionId,
    desde: range.start,
    hasta: range.end,
  })

  const alertasPeriodo = useMemo(
    () => filterAlertasByRange(alertasQuery.data ?? [], appliedFilters),
    [alertasQuery.data, appliedFilters]
  )

  const kpis: AnalyticsKpis = useMemo(() => {
    const actividades = actividadesQuery.data ?? []
    const hasActivities = actividades.length > 0
    const instalacionesActivas = panel?.instalacionesActivas ?? 0
    const totalInstalaciones = panel?.instalaciones.length ?? 0
    return {
      generacionTotal: hasActivities ? sumValues(actividades.map((item) => item.solar)) : null,
      consumoTotal: hasActivities ? sumValues(actividades.map((item) => item.consumoTotal)) : null,
      ahorroEstimado: panel?.ahorroEstimado ?? null,
      autonomiaPromedio: autonomiaQuery.data?.autonomiaHoras ?? null,
      disponibilidad: totalInstalaciones > 0 ? (instalacionesActivas / totalInstalaciones) * 100 : null,
      alertasPeriodo: alertasPeriodo.length,
      mantenimientosCompletados: mantenimientosQuery.data ? countCompletedMantenimientos(mantenimientosQuery.data) : null,
      cumplimientoSla: null,
    }
  }, [
    actividadesQuery.data,
    alertasPeriodo.length,
    autonomiaQuery.data,
    mantenimientosQuery.data,
    panel,
  ])

  const refetchAll = () => {
    void refetchPanel()
    void actividadesQuery.refetch()
    void tendenciaQuery.refetch()
    void bateriaQuery.refetch()
    void autonomiaQuery.refetch()
    void comparativaQuery.refetch()
    void alertasQuery.refetch()
    void mantenimientosQuery.refetch()
  }

  const handleClear = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
  }

  const baseLoading = panelLoading || instalacionesLoading || empresasLoading

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analítica"
        description="Indicadores energéticos, comparativas, tendencias y desempeño operativo."
        actions={
          <>
            <button
              type="button"
              onClick={refetchAll}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)]"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar vista
            </button>
            <Link
              to="/reportes"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)]"
            >
              <FileText className="h-3.5 w-3.5" />
              Ir a reportes
            </Link>
          </>
        }
      />

      <AnalyticsFilters
        value={draftFilters}
        empresas={empresas}
        instalaciones={instalaciones}
        loading={baseLoading}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters(draftFilters)}
        onClear={handleClear}
      />

      <AnalyticsKpiCards
        kpis={kpis}
        loading={baseLoading || actividadesQuery.isLoading || autonomiaQuery.isLoading}
        error={panelError || actividadesQuery.isError}
        onRetry={refetchAll}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <EnergyTrendChart
          data={tendenciaQuery.data ?? []}
          source={appliedFilters.fuente}
          loading={tendenciaQuery.isLoading}
          error={tendenciaQuery.isError}
          onRetry={() => void tendenciaQuery.refetch()}
        />
        <InsightPanel
          alertas={alertasPeriodo}
          comparativa={comparativaQuery.data ?? []}
          bateria={bateriaQuery.data}
          autonomia={autonomiaQuery.data}
          instalaciones={instalaciones}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ConsumptionPeriodChart
          data={actividadesQuery.data ?? []}
          loading={actividadesQuery.isLoading}
          error={actividadesQuery.isError}
          onRetry={() => void actividadesQuery.refetch()}
        />
        <BatteryPerformanceChart
          tendencia={tendenciaQuery.data ?? []}
          bateria={bateriaQuery.data}
          autonomia={autonomiaQuery.data}
          loading={tendenciaQuery.isLoading || bateriaQuery.isLoading || autonomiaQuery.isLoading}
          error={tendenciaQuery.isError || bateriaQuery.isError || autonomiaQuery.isError}
          onRetry={() => {
            void tendenciaQuery.refetch()
            void bateriaQuery.refetch()
            void autonomiaQuery.refetch()
          }}
        />
        <AlertsSeverityChart
          alertas={alertasPeriodo}
          loading={alertasQuery.isLoading}
          error={alertasQuery.isError}
          onRetry={() => void alertasQuery.refetch()}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <InstallationComparisonChart
            data={comparativaQuery.data ?? []}
            loading={comparativaQuery.isLoading}
            error={comparativaQuery.isError}
            onRetry={() => void comparativaQuery.refetch()}
          />
        </div>
        <div className="xl:col-span-3">
          <InstallationBenchmarkTable
            comparativa={comparativaQuery.data ?? []}
            instalaciones={instalaciones}
            loading={comparativaQuery.isLoading || instalacionesLoading}
          />
        </div>
      </section>
    </div>
  )
}
