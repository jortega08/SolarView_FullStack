import { ExternalLink, Eye, XCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { formatDate } from "@/lib/format"
import type { MantenimientoProgramado } from "@/types/domain"
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge"
import { TIPO_MANTENIMIENTO_LABEL, canCancelMantenimiento } from "./maintenanceUtils"

interface MaintenanceTableProps {
  mantenimientos: MantenimientoProgramado[]
  loading?: boolean
  onView: (mantenimiento: MantenimientoProgramado) => void
  onCancel: (mantenimiento: MantenimientoProgramado) => void
  cancellingId?: number | null
}

export function MaintenanceTable({
  mantenimientos,
  loading,
  onView,
  onCancel,
  cancellingId,
}: MaintenanceTableProps) {
  const columns: DataTableColumn<MantenimientoProgramado>[] = [
    {
      id: "estado",
      header: "Estado",
      cell: (m) => <MaintenanceStatusBadge mantenimiento={m} />,
    },
    {
      id: "fecha",
      header: "Fecha",
      cell: (m) => (
        <span className="tabular text-xs text-[var(--color-text-primary)]">
          {formatDate(m.fechaProgramada)}
        </span>
      ),
    },
    {
      id: "instalacion",
      header: "Instalación",
      cell: (m) => (
        <Link
          to={`/instalaciones/${m.instalacionId}`}
          className="text-xs font-semibold text-[var(--color-primary-700)] hover:underline"
        >
          {m.instalacionNombre || "N/D"}
        </Link>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: (m) => (
        <div className="min-w-44">
          <p className="text-xs font-medium text-[var(--color-text-primary)]">
            {m.planNombre ?? "Sin plan"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {TIPO_MANTENIMIENTO_LABEL[m.tipo]}
          </p>
        </div>
      ),
    },
    {
      id: "tipo",
      header: "Tipo",
      cell: (m) => (
        <span className="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-700)]">
          {TIPO_MANTENIMIENTO_LABEL[m.tipo]}
        </span>
      ),
    },
    {
      id: "orden",
      header: "Orden relacionada",
      cell: (m) =>
        m.ordenCodigo ? (
          <Link
            to="/ordenes"
            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[var(--color-primary-700)] hover:underline"
          >
            {m.ordenCodigo}
            <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">Sin orden</span>
        ),
    },
    {
      id: "notas",
      header: "Notas",
      cell: (m) => (
        <span className="block max-w-64 truncate text-xs text-[var(--color-text-secondary)]">
          {m.notas?.trim() || "Sin notas"}
        </span>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: (m) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onView(m)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)]"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canCancelMantenimiento(m) && (
            <button
              type="button"
              disabled={cancellingId === m.id}
              onClick={() => onCancel(m)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)] disabled:opacity-50"
              title="Cancelar mantenimiento"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ]

  return (
    <DataTable
      data={mantenimientos}
      columns={columns}
      loading={loading}
      getRowKey={(m) => m.id}
      emptyTitle="Sin mantenimientos"
      emptyDescription="No hay mantenimientos que coincidan con los filtros actuales."
    />
  )
}
