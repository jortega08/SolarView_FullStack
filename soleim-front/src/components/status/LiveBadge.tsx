import { cn } from "@/lib/cn"
import type { ConexionWS } from "@/types/enums"

interface LiveBadgeProps {
  status?: ConexionWS
  className?: string
}

const config: Record<ConexionWS, { dot: string; label: string; text: string }> = {
  en_vivo: {
    dot: "bg-[var(--color-energy-500)] animate-pulse",
    label: "En vivo",
    text: "text-[var(--color-energy-700)]",
  },
  conectando: {
    dot: "bg-[var(--color-solar-400)] animate-pulse",
    label: "Conectando",
    text: "text-[var(--color-solar-700)]",
  },
  reintentando: {
    dot: "bg-[var(--color-solar-400)] animate-pulse",
    label: "Reintentando",
    text: "text-[var(--color-solar-700)]",
  },
  desconectado: {
    dot: "bg-[var(--color-neutral-400)]",
    label: "Desconectado",
    text: "text-[var(--color-neutral-500)]",
  },
  error: {
    dot: "bg-[var(--color-danger-500)]",
    label: "Error",
    text: "text-[var(--color-danger-600)]",
  },
}

export function LiveBadge({ status = "en_vivo", className }: LiveBadgeProps) {
  const c = config[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", c.text, className)}>
      <span className={cn("w-2 h-2 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}
