import { Eye, Pencil, Trash2, User } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { formatDate } from "@/lib/format"
import type { Tecnico } from "@/types/domain"
import { AvailabilityBadge } from "./AvailabilityBadge"
import { TechnicianLoadBar } from "./TechnicianLoadBar"

interface TechnicianTableProps {
  tecnicos: Tecnico[]
  loading?: boolean
  onView: (tecnico: Tecnico) => void
  onEdit?: (tecnico: Tecnico) => void
  onDelete?: (tecnico: Tecnico) => void
}

export function TechnicianTable({ tecnicos, loading, onView, onEdit, onDelete }: TechnicianTableProps) {
  const columns: DataTableColumn<Tecnico>[] = [
    {
      id: "tecnico",
      header: "Técnico",
      cell: (t) => (
        <div className="flex min-w-48 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
            <User className="h-4 w-4 text-[var(--color-primary-700)]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
              {t.nombre}
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {t.email ?? t.cedula ?? "Sin email"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "zona",
      header: "Zona",
      cell: (t) => (
        <div className="flex max-w-44 flex-wrap gap-1">
          {t.zonas.length > 0 ? (
            t.zonas.map((zona) => (
              <span
                key={zona}
                className="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-700)]"
              >
                {zona}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">Sin zona</span>
          )}
        </div>
      ),
    },
    {
      id: "especialidades",
      header: "Especialidades",
      cell: (t) => (
        <div className="flex max-w-64 flex-wrap gap-1">
          {t.especialidades.length > 0 ? (
            t.especialidades.map((especialidad) => (
              <span
                key={especialidad}
                className="rounded-full border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-700)]"
              >
                {especialidad}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">Sin especialidad</span>
          )}
        </div>
      ),
    },
    {
      id: "disponibilidad",
      header: "Disponibilidad",
      cell: (t) => <AvailabilityBadge disponible={t.disponible} />,
    },
    {
      id: "carga",
      header: "Carga de trabajo",
      cell: (t) => <TechnicianLoadBar carga={t.cargaTrabajo} compact />,
    },
    {
      id: "empresa",
      header: "Empresa",
      cell: (t) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {t.empresaNombre ?? "N/D"}
        </span>
      ),
    },
    {
      id: "licencia",
      header: "Licencia vence",
      cell: (t) => (
        <span className="tabular text-xs text-[var(--color-text-secondary)]">
          {t.licenciaVence ? formatDate(t.licenciaVence) : "N/D"}
        </span>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: (t) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onView(t)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)]"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(t)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)]"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(t)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
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
      data={tecnicos}
      columns={columns}
      loading={loading}
      getRowKey={(t) => t.id}
      emptyTitle="Sin técnicos"
      emptyDescription="No se encontraron técnicos con los filtros seleccionados."
    />
  )
}
