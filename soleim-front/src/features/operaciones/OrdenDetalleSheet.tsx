import { useState, useRef, type ChangeEvent } from "react"
import { Link } from "react-router-dom"
import {
  CheckCircle2,
  Clock,
  FileImage,
  MessageSquare,
  Paperclip,
  PlayCircle,
  Send,
  UserPlus,
  XCircle,
} from "lucide-react"
import { Sheet } from "@/components/overlays/Sheet"
import { OrdenEstadoBadge } from "@/components/status/OrdenEstadoBadge"
import { PriorityBadge } from "@/components/status/PriorityBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { formatDateTime, formatRelativeTime } from "@/lib/format"
import {
  useOrden,
  useComentariosOrden,
  useAgregarComentario,
  useEvidenciasOrden,
  useSubirEvidencia,
  useTransicionarOrden,
  useAsignarOrden,
} from "@/hooks/useOrdenes"
import { useTecnicos } from "@/hooks/useTecnicos"
import type { EstadoOrden } from "@/types/enums"

interface OrdenDetalleSheetProps {
  ordenId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrdenDetalleSheet({ ordenId, open, onOpenChange }: OrdenDetalleSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={ordenId ? `Orden #${ordenId}` : "Orden"}
      description="Detalle, transiciones de estado, comentarios y evidencias"
      className="max-w-2xl"
    >
      {ordenId && <OrdenDetalleContent ordenId={ordenId} onClose={() => onOpenChange(false)} />}
    </Sheet>
  )
}

function OrdenDetalleContent({ ordenId, onClose }: { ordenId: number; onClose: () => void }) {
  const { data: orden, isLoading } = useOrden(ordenId)
  const transicionar = useTransicionarOrden()

  if (isLoading || !orden) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const acciones = transicionesPara(orden.estado)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-xs text-[var(--color-text-muted)]">{orden.codigo}</p>
        <h3 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
          {orden.titulo}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <OrdenEstadoBadge estado={orden.estado} />
          <PriorityBadge prioridad={orden.prioridad} />
          {orden.slaVencido && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-2 py-0.5 text-xs font-semibold text-[var(--color-danger-700)]">
              <Clock className="h-3 w-3" /> SLA vencido
            </span>
          )}
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-[var(--color-neutral-50)] p-3 text-xs">
        <Detail label="Instalación">
          <Link
            to={`/instalaciones/${orden.instalacionId}`}
            className="text-[var(--color-primary-700)] hover:underline"
            onClick={onClose}
          >
            {orden.instalacionNombre || "—"}
          </Link>
        </Detail>
        <Detail label="Empresa">{orden.empresaNombre ?? "—"}</Detail>
        <Detail label="Tipo">{orden.tipo ?? "—"}</Detail>
        <Detail label="Asignada a">{orden.tecnicoNombre ?? "Sin asignar"}</Detail>
        <Detail label="Creada">{formatDateTime(orden.fechaCreacion)}</Detail>
        <Detail label="Asignada">{formatDateTime(orden.fechaAsignacion)}</Detail>
        <Detail label="Iniciada">{formatDateTime(orden.fechaInicio)}</Detail>
        <Detail label="Completada">{formatDateTime(orden.fechaCompletada)}</Detail>
        <Detail label="SLA objetivo">
          {orden.slaObjetivoHoras ? `${orden.slaObjetivoHoras} h` : "—"}
        </Detail>
        <Detail label="Resolución">
          {orden.tiempoResolucionHoras != null
            ? `${orden.tiempoResolucionHoras.toFixed(1)} h`
            : "—"}
        </Detail>
      </div>

      {orden.descripcion && (
        <div>
          <p className="mb-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Descripción
          </p>
          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-line">
            {orden.descripcion}
          </p>
        </div>
      )}

      {orden.notasResolucion && (
        <div>
          <p className="mb-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Notas de resolución
          </p>
          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-line">
            {orden.notasResolucion}
          </p>
        </div>
      )}

      {/* Asignación */}
      {(orden.estado === "abierta" || orden.estado === "asignada") && (
        <AsignarBloque ordenId={orden.id} />
      )}

      {/* Acciones de transición */}
      {acciones.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
          {acciones.map((a) => (
            <button
              key={a.accion}
              disabled={transicionar.isPending}
              onClick={() => {
                const notas =
                  a.accion === "completar"
                    ? window.prompt("Notas de resolución (opcional):") ?? undefined
                    : undefined
                const motivo =
                  a.accion === "cancelar"
                    ? window.prompt("Motivo de cancelación:") ?? ""
                    : undefined
                if (a.accion === "cancelar" && !motivo) return
                transicionar.mutate({
                  id: orden.id,
                  accion: a.accion,
                  notasResolucion: notas,
                  motivo,
                })
              }}
              className={a.className}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Comentarios */}
      <ComentariosBloque ordenId={orden.id} />

      {/* Evidencias */}
      <EvidenciasBloque ordenId={orden.id} />
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className="truncate text-xs text-[var(--color-text-primary)]">{children}</p>
    </div>
  )
}

function transicionesPara(estado: EstadoOrden) {
  const all: Array<{
    estado: EstadoOrden | EstadoOrden[]
    accion: "iniciar" | "completar" | "cerrar" | "cancelar"
    label: string
    icon: React.ReactNode
    className: string
  }> = [
    {
      estado: "asignada",
      accion: "iniciar",
      label: "Iniciar",
      icon: <PlayCircle className="h-3.5 w-3.5" />,
      className:
        "inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50",
    },
    {
      estado: ["asignada", "en_progreso"],
      accion: "completar",
      label: "Completar",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className:
        "inline-flex items-center gap-1.5 rounded-md bg-[var(--color-energy-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-energy-700)] disabled:opacity-50",
    },
    {
      estado: "completada",
      accion: "cerrar",
      label: "Cerrar",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className:
        "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] disabled:opacity-50",
    },
    {
      estado: ["abierta", "asignada", "en_progreso"],
      accion: "cancelar",
      label: "Cancelar",
      icon: <XCircle className="h-3.5 w-3.5" />,
      className:
        "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger-700)] hover:bg-[var(--color-danger-100)] disabled:opacity-50",
    },
  ]
  return all.filter((a) => {
    if (Array.isArray(a.estado)) return a.estado.includes(estado)
    return a.estado === estado
  })
}

function AsignarBloque({ ordenId }: { ordenId: number }) {
  const { data: tecnicos } = useTecnicos()
  const [tecnicoId, setTecnicoId] = useState<string>("")
  const [sla, setSla] = useState<string>("")
  const asignar = useAsignarOrden()

  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
        <UserPlus className="h-3.5 w-3.5" /> Asignar técnico
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
          className="flex-1 min-w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-1.5 text-xs"
        >
          <option value="">Selecciona un técnico…</option>
          {(tecnicos ?? []).map((t) => (
            <option key={t.id} value={t.usuarioId ?? ""} disabled={!t.usuarioId}>
              {t.nombre}
              {t.especialidad ? ` · ${t.especialidad}` : ""}
              {t.disponible ? "" : " (no disponible)"}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          placeholder="SLA (h)"
          value={sla}
          onChange={(e) => setSla(e.target.value)}
          className="w-24 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-1.5 text-xs"
        />
        <button
          disabled={!tecnicoId || asignar.isPending}
          onClick={() =>
            asignar.mutate({
              id: ordenId,
              tecnicoId: Number(tecnicoId),
              slaObjetivoHoras: sla ? Number(sla) : undefined,
            })
          }
          className="rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50"
        >
          {asignar.isPending ? "Asignando…" : "Asignar"}
        </button>
      </div>
    </div>
  )
}

function ComentariosBloque({ ordenId }: { ordenId: number }) {
  const { data: comentarios, isLoading } = useComentariosOrden(ordenId)
  const agregar = useAgregarComentario(ordenId)
  const [texto, setTexto] = useState("")

  const submit = () => {
    if (!texto.trim()) return
    agregar.mutate(texto.trim(), { onSuccess: () => setTexto("") })
  }

  return (
    <div className="border-t border-[var(--color-border)] pt-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
        <MessageSquare className="h-3.5 w-3.5" /> Comentarios
      </p>

      <div className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : comentarios && comentarios.length > 0 ? (
          comentarios.map((c) => (
            <div
              key={c.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {c.usuarioNombre || "Usuario"}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatRelativeTime(c.fechaCreacion)}
                </p>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-line">
                {c.texto}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">Aún no hay comentarios.</p>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          placeholder="Agrega un comentario, observación o avance…"
          className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-xs"
        />
        <button
          disabled={!texto.trim() || agregar.isPending}
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Enviar
        </button>
      </div>
    </div>
  )
}

function EvidenciasBloque({ ordenId }: { ordenId: number }) {
  const { data: evidencias, isLoading } = useEvidenciasOrden(ordenId)
  const subir = useSubirEvidencia(ordenId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [tipo, setTipo] = useState<"foto" | "firma" | "documento">("foto")
  const [descripcion, setDescripcion] = useState("")

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    subir.mutate(
      { archivo: file, tipo, descripcion },
      {
        onSuccess: () => {
          setDescripcion("")
          if (inputRef.current) inputRef.current.value = ""
        },
      }
    )
  }

  return (
    <div className="border-t border-[var(--color-border)] pt-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
        <Paperclip className="h-3.5 w-3.5" /> Evidencias
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-1.5 text-xs"
        >
          <option value="foto">Foto</option>
          <option value="firma">Firma</option>
          <option value="documento">Documento</option>
        </select>
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)"
          className="flex-1 min-w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-1.5 text-xs"
        />
        <label className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]">
          {subir.isPending ? "Subiendo…" : "Adjuntar archivo"}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={onFile}
            disabled={subir.isPending}
          />
        </label>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : evidencias && evidencias.length > 0 ? (
          evidencias.map((e) => (
            <a
              key={e.id}
              href={e.archivoUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 hover:bg-[var(--color-neutral-50)]"
            >
              <FileImage className="h-4 w-4 text-[var(--color-primary-600)]" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                  {e.descripcion || `${e.tipo} sin descripción`}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {e.subidoPorNombre || "—"} · {formatRelativeTime(e.fechaCreacion)}
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs capitalize text-[var(--color-text-secondary)]">
                {e.tipo}
              </span>
            </a>
          ))
        ) : (
          <EmptyState
            title="Sin evidencias"
            description="Adjunta fotos, firmas o documentos para respaldar la orden."
            className="py-6"
          />
        )}
      </div>
    </div>
  )
}
