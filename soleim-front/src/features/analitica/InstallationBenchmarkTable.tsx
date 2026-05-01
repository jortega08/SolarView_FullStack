import { Activity, Minus, TrendingUp } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { RiskBadge } from "@/components/status/RiskBadge"
import type { ComparativaInstalacion, InstalacionResumen } from "@/types/domain"

interface InstallationBenchmarkTableProps {
  comparativa: ComparativaInstalacion[]
  instalaciones: InstalacionResumen[]
  loading?: boolean
}

interface BenchmarkRow {
  id: number
  nombre: string
  eficiencia: number | null
  generacion: number | null
  consumo: number | null
  alertas: number | null
  disponibilidad: number | null
  costo: number | null
  riesgo: "bajo" | "medio" | "alto" | null
  tendencia: "sube" | "baja" | "sin_dato"
}

function formatNumber(value: number | null, suffix = ""): string {
  if (value == null) return "No disponible"
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value)}${suffix}`
}

function formatCurrency(value: number | null): string {
  if (value == null) return "No disponible"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function deriveRisk(alertas: number | null, fallback: BenchmarkRow["riesgo"]): BenchmarkRow["riesgo"] {
  if (fallback) return fallback
  if ((alertas ?? 0) >= 10) return "alto"
  if ((alertas ?? 0) >= 4) return "medio"
  return "bajo"
}

export function InstallationBenchmarkTable({
  comparativa,
  instalaciones,
  loading,
}: InstallationBenchmarkTableProps) {
  const instalacionesById = new Map(instalaciones.map((instalacion) => [instalacion.id, instalacion]))
  const rows: BenchmarkRow[] = comparativa.map((item) => {
    const instalacion = instalacionesById.get(item.instalacionId)
    return {
      id: item.instalacionId,
      nombre: item.instalacionNombre,
      eficiencia: item.solarRatio == null ? null : item.solarRatio * 100,
      generacion: null,
      consumo: null,
      alertas: item.alertasActivas,
      disponibilidad: instalacion?.estado === "activa" ? 100 : null,
      costo: item.costoTotal,
      riesgo: deriveRisk(item.alertasActivas, instalacion?.riesgo ?? null),
      tendencia: "sin_dato",
    }
  })

  const columns: DataTableColumn<BenchmarkRow>[] = [
    {
      id: "instalacion",
      header: "Instalación",
      cell: (row) => (
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{row.nombre}</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">ID {row.id}</p>
        </div>
      ),
    },
    {
      id: "generacion",
      header: "Generación",
      cell: (row) => <span className="tabular">{formatNumber(row.generacion, " kWh")}</span>,
    },
    {
      id: "consumo",
      header: "Consumo",
      cell: (row) => <span className="tabular">{formatNumber(row.consumo, " kWh")}</span>,
    },
    {
      id: "eficiencia",
      header: "Eficiencia",
      cell: (row) => <span className="tabular font-semibold">{formatNumber(row.eficiencia, "%")}</span>,
    },
    {
      id: "alertas",
      header: "Alertas",
      cell: (row) => (
        <span className="tabular font-semibold text-[var(--color-danger-600)]">
          {row.alertas ?? "No disponible"}
        </span>
      ),
    },
    {
      id: "disponibilidad",
      header: "Disponibilidad",
      cell: (row) => <span className="tabular">{formatNumber(row.disponibilidad, "%")}</span>,
    },
    {
      id: "costo",
      header: "Costo",
      cell: (row) => <span className="tabular">{formatCurrency(row.costo)}</span>,
    },
    {
      id: "riesgo",
      header: "Riesgo",
      cell: (row) => <RiskBadge riesgo={row.riesgo} />,
    },
    {
      id: "tendencia",
      header: "Tendencia",
      cell: (row) =>
        row.tendencia === "sin_dato" ? (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Minus className="h-3 w-3" />
            Sin dato
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-energy-700)]">
            <TrendingUp className="h-3 w-3" />
            Mejora
          </span>
        ),
    },
  ]

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Activity className="h-4 w-4 text-[var(--color-primary-600)]" />
            Benchmark de instalaciones
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            Campos no expuestos por backend se muestran como no disponibles.
          </p>
        </div>
      </div>
      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={loading}
        emptyTitle="Sin benchmark disponible"
        emptyDescription="La comparativa requiere empresa y consumos agregados recientes."
        className="rounded-none border-0 shadow-none"
      />
    </section>
  )
}
