import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/cn"
import { OrdenKanbanCard } from "./OrdenKanbanCard"
import type { Orden } from "@/types/domain"
import type { EstadoOrden } from "@/types/enums"

interface OrdenKanbanColumnProps {
  estado: EstadoOrden
  label: string
  accentColor: string
  ordenes: Orden[]
  onOpenOrden: (id: number) => void
}

export function OrdenKanbanColumn({
  estado,
  label,
  accentColor,
  ordenes,
  onOpenOrden,
}: OrdenKanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `col-${estado}`,
    data: { estadoDestino: estado },
  })

  return (
    <div className="flex w-80 flex-shrink-0 flex-col">
      <div
        className="mb-2 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] border-b-2 bg-[var(--color-surface)] px-3 py-2 shadow-sm"
        style={{ borderBottomColor: accentColor }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--color-text-primary)]">
            {label}
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-text-secondary)]">
          {ordenes.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex max-h-[620px] min-h-[420px] flex-1 flex-col gap-2 overflow-y-auto rounded-[var(--radius-md)] border-2 border-dashed bg-[var(--color-neutral-50)]/60 p-2 transition-colors",
          isOver
            ? "border-[var(--color-primary-400)] bg-[var(--color-primary-50)]"
            : "border-[var(--color-border)]"
        )}
      >
        {ordenes.length === 0 ? (
          <p className="my-6 text-center text-xs text-[var(--color-text-muted)]">
            Sin órdenes
          </p>
        ) : (
          ordenes.map((orden) => (
            <OrdenKanbanCard
              key={orden.id}
              orden={orden}
              onClick={() => onOpenOrden(orden.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
