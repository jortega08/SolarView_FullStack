import { CheckCircle2, ClipboardList, Circle } from "lucide-react"
import { Link } from "react-router-dom"
import { Sheet } from "@/components/overlays/Sheet"
import { SeverityBadge } from "@/components/status/SeverityBadge"
import { cn } from "@/lib/cn"
import { formatDateTime, formatDuration } from "@/lib/format"
import { formatSlaRestante } from "./alertasUtils"
import type { AlertaEnriquecida } from "./types"

interface AlertasDetalleSheetProps {
  alerta: AlertaEnriquecida | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolver: (id: number) => void
  onCrearOrden: (alerta: AlertaEnriquecida) => void
  resolviendo: boolean
}

export function AlertasDetalleSheet({
  alerta,
  open,
  onOpenChange,
  onResolver,
  onCrearOrden,
  resolviendo,
}: AlertasDetalleSheetProps) {
  if (!alerta) return null

  const slaLabel = formatSlaRestante(alerta.slaRestanteMinutos)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={alerta.tipoAlertaNombre || "Detalle de alerta"}
      description={alerta.instalacionNombre}
      footer={
        <div className="flex gap-2">
          <button
            disabled={resolviendo || alerta.estado !== "activa"}
            onClick={() => { onResolver(alerta.id); onOpenChange(false) }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-energy-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-energy-700)] disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            Resolver alerta
          </button>
          <button
            onClick={() => { onCrearOrden(alerta); onOpenChange(false) }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)]"
          >
            <ClipboardList className="h-4 w-4" />
            Crear orden
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Badges de estado */}
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severidad={alerta.severidad} />
          <EstadoBadge estado={alerta.estado} />
          <SlaBadgeInline alerta={alerta} label={slaLabel} />
        </div>

        {/* Identificador */}
        <p className="text-xs font-mono text-[var(--color-text-muted)]">
          #AL-{String(alerta.id).padStart(10, "0")}
        </p>

        {/* Datos generales */}
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Datos generales
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[var(--radius-md)] bg-[var(--color-neutral-50)] p-3 text-xs">
            <DetailItem label="Instalación">
              <Link
                to={`/instalaciones/${alerta.instalacionId}`}
                className="text-[var(--color-primary-700)] hover:underline"
              >
                {alerta.instalacionNombre}
              </Link>
            </DetailItem>
            <DetailItem label="Tipo">{alerta.tipoAlertaNombre || "—"}</DetailItem>
            <DetailItem label="Detectada">{formatDateTime(alerta.fechaCreacion)}</DetailItem>
            <DetailItem label="Objetivo SLA">{formatDuration(alerta.slaTargetMinutos)}</DetailItem>
            <DetailItem label="Tiempo transcurrido">
              {formatDuration(alerta.slaElapsedMinutos)}
            </DetailItem>
            <DetailItem label="SLA restante">
              <span
                className={cn(
                  "font-medium",
                  alerta.slaEstado === "incumplida"
                    ? "text-[var(--color-danger-600)]"
                    : alerta.slaEstado === "en_riesgo"
                    ? "text-[var(--color-warning-600)]"
                    : "text-[var(--color-energy-600)]",
                )}
              >
                {slaLabel}
              </span>
            </DetailItem>
            <DetailItem label="Estado SLA">
              <SlaEstadoText estado={alerta.slaEstado} />
            </DetailItem>
            <DetailItem label="Asignado a">
              <span className="text-[var(--color-text-muted)]">No disponible</span>
            </DetailItem>
          </div>
        </section>

        {/* Descripción */}
        <section>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Descripción
          </h4>
          <p className="whitespace-pre-line text-sm text-[var(--color-text-primary)]">
            {alerta.descripcion}
          </p>
        </section>

        {/* Causa probable */}
        {alerta.causaProbable && (
          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Probable causa
            </h4>
            <p className="whitespace-pre-line text-sm text-[var(--color-text-primary)]">
              {alerta.causaProbable}
            </p>
          </section>
        )}

        {/* Historial de eventos */}
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Historial de eventos
          </h4>
          <div className="space-y-3 border-l-2 border-[var(--color-border)] pl-4">
            <TimelineEvent
              label="Alerta creada"
              fecha={alerta.fechaCreacion}
              color="var(--color-danger-500)"
            />
            {alerta.fechaResolucion && (
              <TimelineEvent
                label="Alerta resuelta"
                fecha={alerta.fechaResolucion}
                color="var(--color-energy-500)"
              />
            )}
          </div>
        </section>
      </div>
    </Sheet>
  )
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-0.5 font-medium text-[var(--color-text-primary)]">{children}</dd>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    activa: "bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)]",
    resuelta: "bg-[var(--color-energy-50)] text-[var(--color-energy-700)] border-[var(--color-energy-200)]",
    cancelada: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] border-[var(--color-neutral-200)]",
  }
  return (
    <span
      className={cn(
        "rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium capitalize",
        map[estado] ?? map.cancelada,
      )}
    >
      {estado}
    </span>
  )
}

function SlaBadgeInline({ alerta, label }: { alerta: AlertaEnriquecida; label: string }) {
  if (alerta.estado !== "activa") return null
  const colorMap = {
    dentro: "bg-[var(--color-energy-50)] text-[var(--color-energy-700)] border-[var(--color-energy-200)]",
    en_riesgo: "bg-[var(--color-warning-50)] text-[var(--color-warning-600)] border-[var(--color-warning-200)]",
    incumplida: "bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)]",
  }
  return (
    <span
      className={cn(
        "rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium",
        colorMap[alerta.slaEstado],
      )}
    >
      {label}
    </span>
  )
}

function SlaEstadoText({ estado }: { estado: AlertaEnriquecida["slaEstado"] }) {
  const map = {
    dentro: { label: "Dentro del SLA", color: "text-[var(--color-energy-600)]" },
    en_riesgo: { label: "En riesgo", color: "text-[var(--color-warning-600)]" },
    incumplida: { label: "Incumplida", color: "text-[var(--color-danger-600)]" },
  }
  const { label, color } = map[estado]
  return <span className={cn("font-medium", color)}>{label}</span>
}

function TimelineEvent({ label, fecha, color }: { label: string; fecha: string; color: string }) {
  return (
    <div className="relative flex items-start gap-3">
      <Circle
        className="absolute -left-[18px] top-0.5 h-3 w-3 flex-shrink-0"
        style={{ fill: color, color }}
      />
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{formatDateTime(fecha)}</p>
      </div>
    </div>
  )
}
