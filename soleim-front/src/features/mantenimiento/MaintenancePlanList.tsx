import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { cn } from "@/lib/cn"
import type { PlanMantenimiento } from "@/types/domain"

interface MaintenancePlanListProps {
  planes: PlanMantenimiento[]
  loading?: boolean
}

export function MaintenancePlanList({ planes, loading }: MaintenancePlanListProps) {
  const columns: DataTableColumn<PlanMantenimiento>[] = [
    {
      id: "nombre",
      header: "Nombre",
      cell: (p) => (
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
          {p.nombre}
        </span>
      ),
    },
    {
      id: "sistema",
      header: "Tipo de sistema",
      cell: (p) => <span className="text-xs capitalize">{p.tipoSistema.replace("_", " ")}</span>,
    },
    {
      id: "frecuencia",
      header: "Frecuencia",
      cell: (p) => <span className="tabular text-xs">Cada {p.frecuenciaDias} días</span>,
    },
    {
      id: "duracion",
      header: "Duración estimada",
      cell: (p) => <span className="tabular text-xs">{p.duracionEstimadaHoras} h</span>,
    },
    {
      id: "especialidad",
      header: "Especialidad requerida",
      cell: (p) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {p.especialidadNombre ?? "Sin especialidad"}
        </span>
      ),
    },
    {
      id: "checklist",
      header: "Checklist",
      cell: (p) => (
        <span className="tabular text-xs text-[var(--color-text-secondary)]">
          {p.checklist.length} ítems
        </span>
      ),
    },
    {
      id: "estado",
      header: "Estado",
      cell: (p) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            p.activo
              ? "border-[var(--color-energy-200)] bg-[var(--color-energy-50)] text-[var(--color-energy-700)]"
              : "border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
          )}
        >
          {p.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ]

  return (
    <section className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Planes de mantenimiento
        </h3>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Plantillas preventivas por tipo de sistema, duración y especialidad requerida.
        </p>
      </div>
      <DataTable
        data={planes}
        columns={columns}
        loading={loading}
        getRowKey={(p) => p.id}
        emptyTitle="Sin planes"
        emptyDescription="No hay planes de mantenimiento configurados."
      />
    </section>
  )
}
