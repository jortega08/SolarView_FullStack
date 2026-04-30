import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/cn"
import type { Contrato } from "@/types/domain"
import { ContractPlanBadge } from "./ContractPlanBadge"

interface ContractServicePanelProps {
  contratos: Contrato[]
  loading?: boolean
}

export function ContractServicePanel({ contratos, loading }: ContractServicePanelProps) {
  const columns: DataTableColumn<Contrato>[] = [
    {
      id: "instalacion",
      header: "Instalación",
      cell: (c) => (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {c.instalacionNombre || "N/D"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {c.empresaNombre ?? "Sin empresa"}
          </p>
        </div>
      ),
    },
    {
      id: "nivel",
      header: "Nivel",
      cell: (c) => <ContractPlanBadge nivel={c.nivel} />,
    },
    {
      id: "respuesta",
      header: "Horas respuesta",
      cell: (c) => <span className="tabular text-xs">{c.horasRespuesta} h</span>,
    },
    {
      id: "frecuencia",
      header: "Frecuencia preventiva",
      cell: (c) => <span className="tabular text-xs">Cada {c.frecuenciaPreventivoDias} días</span>,
    },
    {
      id: "inicio",
      header: "Fecha inicio",
      cell: (c) => <span className="tabular text-xs">{formatDate(c.fechaInicio)}</span>,
    },
    {
      id: "fin",
      header: "Fecha fin",
      cell: (c) => <span className="tabular text-xs">{c.fechaFin ? formatDate(c.fechaFin) : "Indefinida"}</span>,
    },
    {
      id: "estado",
      header: "Estado",
      cell: (c) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            c.activo
              ? "border-[var(--color-energy-200)] bg-[var(--color-energy-50)] text-[var(--color-energy-700)]"
              : "border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
          )}
        >
          {c.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ]

  return (
    <section className="space-y-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Contratos de servicio
        </h3>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          SLA operativo, frecuencia preventiva y vigencia por instalación.
        </p>
      </div>
      <DataTable
        data={contratos}
        columns={columns}
        loading={loading}
        getRowKey={(c) => c.id}
        emptyTitle="Sin contratos"
        emptyDescription="No hay contratos de servicio registrados para tu alcance."
      />
    </section>
  )
}
