import { Users } from "lucide-react"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { Tecnico } from "@/types/domain"
import { AvailabilityBadge } from "./AvailabilityBadge"
import { TechnicianLoadBar } from "./TechnicianLoadBar"

interface TechnicianAvailabilityPanelProps {
  tecnicos: Tecnico[]
  onView: (tecnico: Tecnico) => void
}

export function TechnicianAvailabilityPanel({
  tecnicos,
  onView,
}: TechnicianAvailabilityPanelProps) {
  const disponibles = tecnicos
    .filter((t) => t.disponible)
    .sort((a, b) => (a.cargaTrabajo ?? 999) - (b.cargaTrabajo ?? 999))
    .slice(0, 6)

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Técnicos disponibles
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Priorizados por menor carga actual cuando el backend la expone.
        </p>
      </div>
      {disponibles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin técnicos disponibles"
          description="No hay perfiles marcados como disponibles en este momento."
          className="py-8"
        />
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {disponibles.map((tecnico) => (
            <button
              key={tecnico.id}
              type="button"
              onClick={() => onView(tecnico)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--color-neutral-50)]"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-xs font-bold text-[var(--color-primary-700)]">
                {tecnico.nombre
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                      {tecnico.nombre}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      {tecnico.especialidad ?? "Sin especialidad"} - {tecnico.zona ?? "Sin zona"}
                    </p>
                  </div>
                  <AvailabilityBadge disponible={tecnico.disponible} />
                </div>
                <TechnicianLoadBar carga={tecnico.cargaTrabajo} compact />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
