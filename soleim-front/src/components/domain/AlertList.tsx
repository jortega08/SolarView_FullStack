import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/cn"
import { SeverityBadge } from "@/components/status/SeverityBadge"
import { formatRelativeTime } from "@/lib/format"
import { useResolverAlerta } from "@/hooks/useAlertas"
import type { Alerta } from "@/types/domain"

interface AlertListProps {
  alerts: Alerta[]
  showResolve?: boolean
  className?: string
}

export function AlertList({ alerts, showResolve, className }: AlertListProps) {
  const { mutate: resolver, isPending } = useResolverAlerta()

  if (alerts.length === 0) {
    return (
      <div className={cn("py-4 text-center text-xs text-[var(--color-text-muted)]", className)}>
        Sin alertas activas
      </div>
    )
  }

  return (
    <div className={cn("space-y-0", className)}>
      {alerts.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 py-3 border-b border-[var(--color-border)] last:border-0"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--color-danger-500)]" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                {a.instalacionNombre}
              </span>
              <SeverityBadge severidad={a.severidad} />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">{a.descripcion}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatRelativeTime(a.fechaCreacion)}</p>
          </div>
          {showResolve && (
            <button
              disabled={isPending}
              onClick={() => resolver(a.id)}
              className="text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] flex-shrink-0 disabled:opacity-50"
            >
              Resolver
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
