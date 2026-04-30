import { CheckCircle2, ClipboardCheck } from "lucide-react"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { PlanChecklistItem } from "@/types/domain"

interface PreventiveChecklistProps {
  checklist: PlanChecklistItem[]
  compact?: boolean
}

export function PreventiveChecklist({ checklist, compact }: PreventiveChecklistProps) {
  if (checklist.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Sin checklist definido"
        description="El backend no devuelve ítems de verificación para este plan."
        className={compact ? "py-6" : undefined}
      />
    )
  }

  return (
    <div className="space-y-2">
      {checklist.map((item, index) => (
        <div
          key={`${item.titulo}-${index}`}
          className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        >
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-neutral-50)]">
            <CheckCircle2 className="h-3 w-3 text-[var(--color-neutral-400)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--color-text-primary)]">
              {item.titulo}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              Sin estado de cumplimiento registrado
            </p>
          </div>
          {item.requerido === true && (
            <span className="rounded-full bg-[var(--color-solar-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-solar-700)]">
              Requerido
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
