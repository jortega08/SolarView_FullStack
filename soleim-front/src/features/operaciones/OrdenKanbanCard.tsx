import { useDraggable } from "@dnd-kit/core"
import type { ReactNode } from "react"
import { ChevronRight, Clock3, GripVertical, MapPin, UserRound } from "lucide-react"
import { cn } from "@/lib/cn"
import { PriorityBadge } from "@/components/status/PriorityBadge"
import { OrdenEstadoBadge } from "@/components/status/OrdenEstadoBadge"
import { formatDateTime, formatRelativeTime } from "@/lib/format"
import type { Orden } from "@/types/domain"

interface OrdenKanbanCardProps {
  orden: Orden
  onClick: () => void
}

export function OrdenKanbanCard({ orden, onClick }: OrdenKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `orden-${orden.id}`,
    data: { ordenId: orden.id, estadoActual: orden.estado },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm transition",
        isDragging
          ? "z-50 opacity-80 shadow-[var(--shadow-card-hover)]"
          : "hover:border-[var(--color-primary-200)] hover:shadow-[var(--shadow-card-hover)]"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold text-[var(--color-text-muted)]">
            {orden.codigo}
          </p>
          <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
            {orden.titulo}
          </h4>
        </div>
        <button
          {...attributes}
          {...listeners}
          aria-label="Mover orden"
          className="flex h-8 w-8 flex-shrink-0 cursor-grab items-center justify-center rounded-[var(--radius-sm)] border border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-neutral-50)] active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <PriorityBadge prioridad={orden.prioridad} />
        <OrdenEstadoBadge estado={orden.estado} />
        {orden.slaVencido && (
          <span className="inline-flex items-center rounded-full border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-2 py-0.5 text-xs font-semibold text-[var(--color-danger-700)]">
            SLA vencido
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
        <MetaRow icon={<MapPin className="h-3.5 w-3.5" />}>
          <span className="truncate">{orden.instalacionNombre || "Sin instalación"}</span>
        </MetaRow>
        <MetaRow icon={<UserRound className="h-3.5 w-3.5" />}>
          <span className="truncate">{orden.tecnicoNombre ?? "Sin técnico asignado"}</span>
        </MetaRow>
        <MetaRow icon={<Clock3 className="h-3.5 w-3.5" />}>
          <span
            className={cn(
              "tabular-nums",
              orden.slaVencido && "font-semibold text-[var(--color-danger-600)]"
            )}
          >
            {orden.fechaVencimiento
              ? `Vence ${formatDateTime(orden.fechaVencimiento)}`
              : formatRelativeTime(orden.fechaCreacion)}
          </span>
        </MetaRow>
      </div>

      {orden.descripcion && (
        <p className="mt-3 line-clamp-2 rounded-[var(--radius-sm)] bg-[var(--color-neutral-50)] px-2 py-1.5 text-xs leading-5 text-[var(--color-text-secondary)]">
          {orden.descripcion}
        </p>
      )}

      <button
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
        className="mt-3 flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-2.5 py-2 text-xs font-semibold text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]"
      >
        Ver detalle
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </article>
  )
}

interface MetaRowProps {
  icon: ReactNode
  children: ReactNode
}

function MetaRow({ icon, children }: MetaRowProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="flex-shrink-0 text-[var(--color-text-muted)]">{icon}</span>
      {children}
    </div>
  )
}
