import { Link } from "react-router-dom"
import { Eye, CheckCircle2, ClipboardList } from "lucide-react"
import { cn } from "@/lib/cn"
import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { SeverityBadge } from "@/components/status/SeverityBadge"
import { formatRelativeTime } from "@/lib/format"
import { formatSlaRestante } from "./alertasUtils"
import type { AlertaEnriquecida } from "./types"

interface AlertasPriorityTableProps {
  alertas: AlertaEnriquecida[]
  loading: boolean
  onVerDetalle: (alerta: AlertaEnriquecida) => void
  onResolver: (id: number) => void
  onCrearOrden: (alerta: AlertaEnriquecida) => void
  resolviendo: boolean
}

function SlaBadge({ alerta }: { alerta: AlertaEnriquecida }) {
  if (alerta.estado !== "activa") {
    return <span className="text-xs text-[var(--color-text-muted)]">—</span>
  }

  const { slaEstado, slaRestanteMinutos } = alerta
  const label = formatSlaRestante(slaRestanteMinutos)

  if (slaEstado === "dentro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-energy-200)] bg-[var(--color-energy-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-energy-700)]">
        {label}
      </span>
    )
  }

  if (slaEstado === "en_riesgo") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-warning-600)]">
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-danger-700)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-danger-500)]" />
      {label}
    </span>
  )
}

export function AlertasPriorityTable({
  alertas,
  loading,
  onVerDetalle,
  onResolver,
  onCrearOrden,
  resolviendo,
}: AlertasPriorityTableProps) {
  const columns: DataTableColumn<AlertaEnriquecida>[] = [
    {
      id: "severidad",
      header: "Severidad",
      headerClassName: "w-28",
      cell: (a) => <SeverityBadge severidad={a.severidad} />,
    },
    {
      id: "descripcion",
      header: "Alerta",
      cell: (a) => (
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm text-[var(--color-text-primary)]">{a.descripcion}</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{a.tipoAlertaNombre}</p>
        </div>
      ),
    },
    {
      id: "instalacion",
      header: "Instalación",
      cell: (a) => (
        <div>
          <Link
            to={`/instalaciones/${a.instalacionId}`}
            className="text-sm font-medium text-[var(--color-primary-700)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {a.instalacionNombre || "—"}
          </Link>
        </div>
      ),
    },
    {
      id: "tipo",
      header: "Tipo",
      headerClassName: "w-32",
      cell: (a) => (
        <span className="text-xs text-[var(--color-text-secondary)]">{a.tipoAlertaNombre || "—"}</span>
      ),
    },
    {
      id: "antiguedad",
      header: "Antigüedad",
      headerClassName: "w-28",
      cell: (a) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {formatRelativeTime(a.fechaCreacion)}
        </span>
      ),
    },
    {
      id: "sla",
      header: "SLA restante",
      headerClassName: "w-40",
      cell: (a) => <SlaBadge alerta={a} />,
    },
    {
      id: "estado",
      header: "Estado",
      headerClassName: "w-24",
      cell: (a) => (
        <span
          className={cn(
            "text-xs font-medium capitalize",
            a.estado === "activa"
              ? "text-[var(--color-danger-600)]"
              : "text-[var(--color-text-muted)]",
          )}
        >
          {a.estado}
        </span>
      ),
    },
    {
      id: "asignado",
      header: "Asignado a",
      headerClassName: "w-28",
      cell: () => (
        <span className="text-xs text-[var(--color-text-muted)]">—</span>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      headerClassName: "w-32",
      cell: (a) => (
        <div className="flex items-center gap-0.5">
          <ActionBtn
            onClick={() => onVerDetalle(a)}
            title="Ver detalle"
            color="primary"
          >
            <Eye className="h-3.5 w-3.5" />
          </ActionBtn>
          <ActionBtn
            onClick={() => onResolver(a.id)}
            disabled={resolviendo || a.estado !== "activa"}
            title="Resolver"
            color="energy"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </ActionBtn>
          <ActionBtn
            onClick={() => onCrearOrden(a)}
            title="Crear orden"
            color="primary"
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </ActionBtn>
        </div>
      ),
    },
  ]

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Cola priorizada</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Ordenada por urgencia SLA y severidad
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-neutral-100)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-secondary)] tabular">
          {alertas.length} alertas
        </span>
      </div>
      <DataTable
        data={alertas}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={loading}
        emptyTitle="Sin alertas para los filtros seleccionados"
        emptyDescription="Ajusta los filtros o vuelve a intentar más tarde."
        className="rounded-none border-0 shadow-none"
        scrollContainerClassName="max-h-[300px] overflow-y-auto"
        stickyHeader
      />
    </div>
  )
}

function ActionBtn({
  onClick,
  disabled,
  title,
  color,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  color: "primary" | "energy" | "danger"
  children: React.ReactNode
}) {
  const colorMap = {
    primary: "text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]",
    energy: "text-[var(--color-energy-700)] hover:bg-[var(--color-energy-50)]",
    danger: "text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)]",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors disabled:opacity-40",
        colorMap[color],
      )}
    >
      {children}
    </button>
  )
}
