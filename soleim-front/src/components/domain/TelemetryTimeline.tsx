import { Zap, BatteryCharging, Thermometer, Sun } from "lucide-react"
import { cn } from "@/lib/cn"
import { format } from "date-fns"
import type { TelemetriaEvento } from "@/types/domain"

const iconMap: Record<string, React.ReactNode> = {
  generacion: <Zap className="w-3.5 h-3.5 text-[var(--color-energy-500)]" />,
  bateria: <BatteryCharging className="w-3.5 h-3.5 text-[var(--color-primary-500)]" />,
  temperatura: <Thermometer className="w-3.5 h-3.5 text-[var(--color-solar-500)]" />,
  irradiancia: <Sun className="w-3.5 h-3.5 text-[var(--color-solar-600)]" />,
}

interface TelemetryTimelineProps {
  events: TelemetriaEvento[]
  className?: string
}

export function TelemetryTimeline({ events, className }: TelemetryTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("py-6 text-center text-xs text-[var(--color-text-muted)]", className)}>
        Sin datos de telemetría
      </div>
    )
  }

  return (
    <div className={cn("space-y-0 overflow-y-auto max-h-64", className)}>
      {events.map((evt, i) => {
        let ts = ""
        try { ts = format(new Date(evt.timestamp), "HH:mm:ss") } catch { ts = evt.timestamp }
        const icon = iconMap[evt.tipo ?? ""] ?? <Zap className="w-3.5 h-3.5 text-[var(--color-neutral-400)]" />
        return (
          <div key={i} className="flex items-start gap-2.5 py-2 border-b border-[var(--color-border)] last:border-0">
            <span className="mt-0.5 w-6 h-6 rounded-full bg-[var(--color-neutral-50)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                  {evt.descripcion ?? evt.tipo ?? "Lectura"}
                  {evt.valor != null && (
                    <span className="ml-1 font-semibold tabular">
                      {evt.valor} {evt.unidad ?? ""}
                    </span>
                  )}
                </span>
                <span className="text-xs tabular text-[var(--color-text-muted)] flex-shrink-0 font-mono">{ts}</span>
              </div>
              {evt.instalacionNombre && (
                <span className="text-xs text-[var(--color-text-secondary)]">{evt.instalacionNombre}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
