import { useState, useMemo } from "react"
import {
  Bell,
  BellOff,
  CheckCheck,
  RefreshCw,
  Mail,
  Smartphone,
  Webhook,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  useNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
} from "@/hooks/useNotificaciones"
import { cn } from "@/lib/cn"
import type { Notificacion } from "@/types/domain"

/* ─── Helpers ──────────────────────────────────────────────────────────── */

type TabId = "todas" | "no_leidas" | "in_app" | "email"

const TABS: { id: TabId; label: string }[] = [
  { id: "todas",     label: "Todas"      },
  { id: "no_leidas", label: "No leídas"  },
  { id: "in_app",    label: "En app"     },
  { id: "email",     label: "Email"      },
]

function tipoIcon(tipo: string | null) {
  switch (tipo) {
    case "email":    return Mail
    case "sms":      return Smartphone
    case "webhook":  return Webhook
    case "push":     return Zap
    case "in_app":
    default:         return MessageSquare
  }
}

function tipoColor(tipo: string | null): string {
  switch (tipo) {
    case "email":   return "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]"
    case "sms":     return "bg-[var(--color-warning-50)] text-[var(--color-warning-600)]"
    case "webhook": return "bg-purple-50 text-purple-600"
    case "push":    return "bg-[var(--color-energy-50)] text-[var(--color-energy-600)]"
    default:        return "bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]"
  }
}

function contentIcon(titulo: string) {
  const lower = titulo.toLowerCase()
  if (lower.includes("error") || lower.includes("falla") || lower.includes("alerta"))
    return { Icon: AlertTriangle, color: "text-[var(--color-danger-500)]" }
  if (lower.includes("asignada") || lower.includes("completada") || lower.includes("resuelta"))
    return { Icon: CheckCircle2, color: "text-[var(--color-success-500)]" }
  return { Icon: Info, color: "text-[var(--color-primary-500)]" }
}

function formatFecha(fecha: string): string {
  if (!fecha) return ""
  try {
    return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es })
  } catch {
    return fecha
  }
}

/* ─── Skeleton ─────────────────────────────────────────────────────────── */

function NotifSkeleton() {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-4 animate-pulse">
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-[var(--color-neutral-100)]" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3.5 w-2/3 rounded bg-[var(--color-neutral-100)]" />
            <div className="h-3 w-full rounded bg-[var(--color-neutral-100)]" />
            <div className="h-3 w-1/4 rounded bg-[var(--color-neutral-100)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Tarjeta de notificación ──────────────────────────────────────────── */

function NotifCard({
  notif,
  onMarcar,
  marking,
}: {
  notif: Notificacion
  onMarcar: (id: number) => void
  marking: boolean
}) {
  const TipoIcon = tipoIcon(notif.tipo)
  const { Icon: ContentIcon, color: contentColor } = contentIcon(notif.titulo)

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-4 transition-colors",
        notif.leida
          ? "bg-[var(--color-surface)]"
          : "bg-[var(--color-primary-50)]/40 hover:bg-[var(--color-primary-50)]/60",
        "hover:bg-[var(--color-neutral-50)] cursor-pointer border-b border-[var(--color-border)] last:border-0"
      )}
      onClick={() => !notif.leida && onMarcar(notif.id)}
    >
      {/* Indicador no leída */}
      {!notif.leida && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[var(--color-primary-500)]" />
      )}

      {/* Ícono de contenido */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-neutral-100)]">
            <ContentIcon className={cn("h-4 w-4", contentColor)} />
          </div>
          {/* Badge de canal */}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px]",
              tipoColor(notif.tipo)
            )}
          >
            <TipoIcon className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              notif.leida
                ? "font-normal text-[var(--color-text-primary)]"
                : "font-semibold text-[var(--color-text-primary)]"
            )}
          >
            {notif.titulo}
          </p>
          <span className="flex-shrink-0 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
            {formatFecha(notif.fechaCreacion)}
          </span>
        </div>
        {notif.mensaje && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
            {notif.mensaje}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
              tipoColor(notif.tipo)
            )}
          >
            <TipoIcon className="h-2.5 w-2.5" />
            {notif.tipo ?? "in_app"}
          </span>
          {notif.leida ? (
            <span className="text-[10px] text-[var(--color-text-muted)]">Leída</span>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMarcar(notif.id) }}
              disabled={marking}
              className="text-[10px] font-medium text-[var(--color-primary-600)] hover:underline disabled:opacity-50"
            >
              Marcar como leída
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Estado vacío ─────────────────────────────────────────────────────── */

function EmptyNotifs({ tab }: { tab: TabId }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-neutral-100)]">
        <BellOff className="h-6 w-6 text-[var(--color-text-muted)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {tab === "no_leidas" ? "Todo al día" : "Sin notificaciones"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {tab === "no_leidas"
            ? "No tienes notificaciones pendientes de leer."
            : "Las notificaciones del sistema aparecerán aquí."}
        </p>
      </div>
    </div>
  )
}

/* ─── Página principal ─────────────────────────────────────────────────── */

export default function NotificacionesPage() {
  const [tab, setTab] = useState<TabId>("todas")

  const { data: notificaciones = [], isLoading, refetch, isRefetching } = useNotificaciones({ limit: 100 })
  const { mutate: marcarLeida, isPending: marcando } = useMarcarLeida()
  const { mutate: marcarTodas, isPending: marcandoTodas } = useMarcarTodasLeidas()

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  const filtered = useMemo(() => {
    switch (tab) {
      case "no_leidas": return notificaciones.filter((n) => !n.leida)
      case "in_app":    return notificaciones.filter((n) => !n.tipo || n.tipo === "in_app")
      case "email":     return notificaciones.filter((n) => n.tipo === "email")
      default:          return notificaciones
    }
  }, [notificaciones, tab])

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        eyebrow="Comunicación"
        title="Notificaciones"
        description="Bandeja de notificaciones del sistema"
        actions={
          <div className="flex items-center gap-2">
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={() => marcarTodas()}
                disabled={marcandoTodas}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-card)] hover:bg-[var(--color-neutral-50)] disabled:opacity-60"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {marcandoTodas ? "Marcando…" : "Marcar todas como leídas"}
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-card)] hover:bg-[var(--color-neutral-50)] disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", (isLoading || isRefetching) && "animate-spin")} />
              Actualizar
            </button>
          </div>
        }
      />

      {/* Panel principal */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">

        {/* Barra de tabs + contador */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4">
          <div className="flex">
            {TABS.map((t) => {
              const count =
                t.id === "no_leidas"
                  ? noLeidas
                  : t.id === "todas"
                  ? notificaciones.length
                  : notificaciones.filter((n) =>
                      t.id === "in_app"
                        ? !n.tipo || n.tipo === "in_app"
                        : n.tipo === t.id
                    ).length

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    tab === t.id
                      ? "border-[var(--color-primary-600)] text-[var(--color-primary-600)]"
                      : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular",
                        tab === t.id
                          ? t.id === "no_leidas"
                            ? "bg-[var(--color-primary-600)] text-white"
                            : "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                          : "bg-[var(--color-neutral-100)] text-[var(--color-text-muted)]"
                      )}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Ícono de campana con badge */}
          <div className="relative pr-1">
            <Bell className="h-4 w-4 text-[var(--color-text-muted)]" />
            {noLeidas > 0 && (
              <span className="absolute -right-0.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-[9px] font-bold text-white">
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <NotifSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyNotifs tab={tab} />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filtered.map((notif) => (
              <NotifCard
                key={notif.id}
                notif={notif}
                onMarcar={marcarLeida}
                marking={marcando}
              />
            ))}
          </div>
        )}

        {/* Footer con total */}
        {!isLoading && notificaciones.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-4 py-2.5 text-xs text-[var(--color-text-muted)] text-center">
            {filtered.length} de {notificaciones.length} notificaciones
            {noLeidas > 0 && (
              <span className="ml-2 font-medium text-[var(--color-primary-600)]">
                · {noLeidas} sin leer
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
