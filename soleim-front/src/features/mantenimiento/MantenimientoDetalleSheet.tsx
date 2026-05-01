import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { ClipboardList, XCircle } from "lucide-react"
import { Sheet } from "@/components/overlays/Sheet"
import { EmptyState } from "@/components/feedback/EmptyState"
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/format"
import { useCancelarMantenimiento } from "@/hooks/useMantenimientos"
import type { MantenimientoProgramado, PlanMantenimiento } from "@/types/domain"
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge"
import { PreventiveChecklist } from "./PreventiveChecklist"
import {
  TIPO_MANTENIMIENTO_LABEL,
  canCancelMantenimiento,
} from "./maintenanceUtils"

interface MantenimientoDetalleSheetProps {
  mantenimiento: MantenimientoProgramado | null
  plan: PlanMantenimiento | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MantenimientoDetalleSheet({
  mantenimiento,
  plan,
  open,
  onOpenChange,
}: MantenimientoDetalleSheetProps) {
  const cancelar = useCancelarMantenimiento()

  if (!mantenimiento) return null

  const puedeCancelar = canCancelMantenimiento(mantenimiento)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={plan?.nombre ?? mantenimiento.planNombre ?? `Mantenimiento #${mantenimiento.id}`}
      description={mantenimiento.instalacionNombre || "Detalle de mantenimiento"}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <MaintenanceStatusBadge mantenimiento={mantenimiento} />
          <span className="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-700)]">
            {TIPO_MANTENIMIENTO_LABEL[mantenimiento.tipo]}
          </span>
        </div>

        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-3 sm:grid-cols-2">
          <Detail label="Instalación">
            <Link
              to={`/instalaciones/${mantenimiento.instalacionId}`}
              className="text-[var(--color-primary-700)] hover:underline"
              onClick={() => onOpenChange(false)}
            >
              {mantenimiento.instalacionNombre || "N/D"}
            </Link>
          </Detail>
          <Detail label="Fecha programada">
            <span className="tabular">{formatDate(mantenimiento.fechaProgramada)}</span>
          </Detail>
          <Detail label="Plan">{mantenimiento.planNombre ?? "Sin plan"}</Detail>
          <Detail label="Orden relacionada">
            {mantenimiento.ordenCodigo ? (
              <span className="font-mono">{mantenimiento.ordenCodigo}</span>
            ) : (
              "Sin orden"
            )}
          </Detail>
          <Detail label="Creado">
            {mantenimiento.creadoAt
              ? `${formatDateTime(mantenimiento.creadoAt)} (${formatRelativeTime(mantenimiento.creadoAt)})`
              : "N/D"}
          </Detail>
          <Detail label="Técnico asignado">
            {mantenimiento.tecnicoNombre ?? "No expuesto"}
          </Detail>
        </div>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Datos del plan
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Información contractual y operativa disponible para esta visita.
            </p>
          </div>
          {plan ? (
            <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:grid-cols-2">
              <Detail label="Tipo de sistema">{plan.tipoSistema.replace("_", " ")}</Detail>
              <Detail label="Frecuencia">
                <span className="tabular">Cada {plan.frecuenciaDias} días</span>
              </Detail>
              <Detail label="Duración estimada">
                <span className="tabular">{plan.duracionEstimadaHoras} h</span>
              </Detail>
              <Detail label="Especialidad requerida">
                {plan.especialidadNombre ?? "Sin especialidad"}
              </Detail>
            </div>
          ) : (
            <EmptyState
              title="Plan no disponible"
              description="El mantenimiento no trae un plan relacionado o no está en el catálogo visible."
              className="py-6"
            />
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Checklist preventivo
          </h3>
          <PreventiveChecklist checklist={plan?.checklist ?? []} compact />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
            Notas
          </h3>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="whitespace-pre-line text-sm text-[var(--color-text-secondary)]">
              {mantenimiento.notas?.trim() || "Sin notas registradas."}
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
          {mantenimiento.ordenCodigo && (
            <Link
              to="/ordenes"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
              onClick={() => onOpenChange(false)}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Ver orden
            </Link>
          )}
          {puedeCancelar && (
            <button
              type="button"
              disabled={cancelar.isPending}
              onClick={() => {
                const motivo = window.prompt("Motivo de cancelación:") ?? ""
                if (!motivo.trim()) return
                cancelar.mutate(
                  { id: mantenimiento.id, motivo },
                  { onSuccess: () => onOpenChange(false) }
                )
              }}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-3 py-2 text-xs font-medium text-[var(--color-danger-700)] hover:bg-[var(--color-danger-100)] disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancelar mantenimiento
            </button>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className="truncate text-xs text-[var(--color-text-primary)]">{children}</p>
    </div>
  )
}
