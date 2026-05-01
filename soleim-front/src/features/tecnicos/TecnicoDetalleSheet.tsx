import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { ClipboardList, Mail, Phone, User } from "lucide-react"
import { Sheet } from "@/components/overlays/Sheet"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { OrdenEstadoBadge } from "@/components/status/OrdenEstadoBadge"
import { PriorityBadge } from "@/components/status/PriorityBadge"
import { formatDate } from "@/lib/format"
import { useOrdenes } from "@/hooks/useOrdenes"
import type { Orden, Tecnico } from "@/types/domain"
import { AvailabilityBadge } from "./AvailabilityBadge"
import { TechnicianLoadBar } from "./TechnicianLoadBar"

interface TecnicoDetalleSheetProps {
  tecnico: Tecnico | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ACTIVE_STATES = new Set(["abierta", "asignada", "en_progreso"])

export function TecnicoDetalleSheet({
  tecnico,
  open,
  onOpenChange,
}: TecnicoDetalleSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={tecnico?.nombre ?? "Técnico"}
      description="Perfil, disponibilidad y carga operativa"
      className="max-w-2xl"
    >
      {tecnico && <TecnicoDetalleContent tecnico={tecnico} onClose={() => onOpenChange(false)} />}
    </Sheet>
  )
}

function TecnicoDetalleContent({ tecnico, onClose }: { tecnico: Tecnico; onClose: () => void }) {
  const { data: ordenes = [], isLoading } = useOrdenes({
    asignado_a: tecnico.usuarioId ?? undefined,
    enabled: tecnico.usuarioId != null,
  })

  const ordenesActivas = ordenes.filter((orden) => ACTIVE_STATES.has(orden.estado))

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
          <User className="h-6 w-6 text-[var(--color-primary-700)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {tecnico.nombre}
            </h3>
            <AvailabilityBadge disponible={tecnico.disponible} />
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {tecnico.empresaNombre ?? "Sin empresa"} - {tecnico.zona ?? "Sin zona"}
          </p>
          <div className="mt-3 max-w-sm">
            <TechnicianLoadBar carga={tecnico.cargaTrabajo} />
          </div>
        </div>
      </div>

      <section className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-3 sm:grid-cols-2">
        <Detail label="Email">
          {tecnico.email ? (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              {tecnico.email}
            </span>
          ) : (
            "N/D"
          )}
        </Detail>
        <Detail label="Teléfono">
          {tecnico.telefono ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              {tecnico.telefono}
            </span>
          ) : (
            "N/D"
          )}
        </Detail>
        <Detail label="Cédula">{tecnico.cedula ?? "N/D"}</Detail>
        <Detail label="Empresa">{tecnico.empresaNombre ?? "N/D"}</Detail>
        <Detail label="Licencia vence">
          {tecnico.licenciaVence ? formatDate(tecnico.licenciaVence) : "N/D"}
        </Detail>
        <Detail label="Carga actual">
          {tecnico.cargaTrabajo == null ? "No expuesta" : `${tecnico.cargaTrabajo} órdenes`}
        </Detail>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <BadgeGroup title="Especialidades" items={tecnico.especialidades} empty="Sin especialidades" />
        <BadgeGroup title="Zonas de cobertura" items={tecnico.zonas} empty="Sin zonas" muted />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Notas
        </h3>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="whitespace-pre-line text-sm text-[var(--color-text-secondary)]">
            {tecnico.notas?.trim() || "Sin notas registradas."}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Órdenes activas
          </h3>
          <Link
            to="/ordenes"
            onClick={onClose}
            className="text-xs font-medium text-[var(--color-primary-700)] hover:underline"
          >
            Ver tablero
          </Link>
        </div>
        {!tecnico.usuarioId ? (
          <EmptyState
            icon={ClipboardList}
            title="Órdenes no disponibles"
            description="El perfil no expone el id de usuario requerido para consultar órdenes asignadas."
            className="py-6"
          />
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : ordenesActivas.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Sin órdenes activas"
            description="El backend no devolvió órdenes activas asignadas a este técnico."
            className="py-6"
          />
        ) : (
          <div className="space-y-2">
            {ordenesActivas.map((orden) => (
              <OrdenActivaCard key={orden.id} orden={orden} onClose={onClose} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function OrdenActivaCard({ orden, onClose }: { orden: Orden; onClose: () => void }) {
  return (
    <Link
      to="/ordenes"
      onClick={onClose}
      className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 hover:bg-[var(--color-neutral-50)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-[var(--color-text-muted)]">{orden.codigo}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {orden.titulo}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
            {orden.instalacionNombre || "Sin instalación"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <OrdenEstadoBadge estado={orden.estado} />
          <PriorityBadge prioridad={orden.prioridad} />
        </div>
      </div>
    </Link>
  )
}

function BadgeGroup({
  title,
  items,
  empty,
  muted,
}: {
  title: string
  items: string[]
  empty: string
  muted?: boolean
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className={
                muted
                  ? "rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-700)]"
                  : "rounded-full border border-[var(--color-primary-100)] bg-[var(--color-primary-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-700)]"
              }
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">{empty}</span>
        )}
      </div>
    </div>
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
