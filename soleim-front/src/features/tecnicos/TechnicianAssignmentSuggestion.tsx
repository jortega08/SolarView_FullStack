import { ArrowRight, Wand2 } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { Tecnico } from "@/types/domain"
import { AvailabilityBadge } from "./AvailabilityBadge"
import { TechnicianLoadBar } from "./TechnicianLoadBar"

interface TechnicianAssignmentSuggestionProps {
  tecnicos: Tecnico[]
  requiredSpecialty: string
  zone: string
  onView: (tecnico: Tecnico) => void
}

function matchesValue(values: string[], expected: string) {
  const q = expected.trim().toLowerCase()
  if (!q) return true
  return values.some((value) => value.toLowerCase().includes(q))
}

export function TechnicianAssignmentSuggestion({
  tecnicos,
  requiredSpecialty,
  zone,
  onView,
}: TechnicianAssignmentSuggestionProps) {
  if (!requiredSpecialty || !zone) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <EmptyState
          icon={Wand2}
          title="Sin información suficiente para sugerir"
          description="Selecciona una especialidad y una zona para evaluar compatibilidad."
          className="py-6"
        />
      </section>
    )
  }

  const suggested = tecnicos
    .filter((t) => t.disponible)
    .filter((t) => matchesValue(t.especialidades, requiredSpecialty))
    .filter((t) => matchesValue(t.zonas, zone))
    .sort((a, b) => (a.cargaTrabajo ?? 999) - (b.cargaTrabajo ?? 999))[0]

  if (!suggested) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <EmptyState
          icon={Wand2}
          title="Sin técnico compatible"
          description="No hay perfiles disponibles que coincidan con la especialidad y zona seleccionadas."
          className="py-6"
        />
      </section>
    )
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-800)]">
            <Wand2 className="h-4 w-4" />
            Sugerencia de asignación
          </h3>
          <p className="text-xs text-[var(--color-primary-700)]">
            Compatible por especialidad, zona, disponibilidad y menor carga.
          </p>
        </div>
        <AvailabilityBadge disponible={suggested.disponible} />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-primary-100)] bg-white p-3">
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            Requerimiento
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {requiredSpecialty} - {zone}
          </p>
        </div>
        <ArrowRight className="hidden h-4 w-4 text-[var(--color-primary-700)] md:block" />
        <button
          type="button"
          onClick={() => onView(suggested)}
          className="rounded-[var(--radius-md)] border border-[var(--color-primary-100)] bg-white p-3 text-left hover:border-[var(--color-primary-300)]"
        >
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {suggested.nombre}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {suggested.especialidad ?? "Sin especialidad"} - {suggested.zona ?? "Sin zona"}
          </p>
          <div className="mt-2">
            <TechnicianLoadBar carga={suggested.cargaTrabajo} compact />
          </div>
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          to="/ordenes"
          className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-primary-700)]"
        >
          Abrir órdenes
        </Link>
      </div>
    </section>
  )
}
