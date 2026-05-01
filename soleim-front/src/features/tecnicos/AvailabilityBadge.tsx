import { cn } from "@/lib/cn"

interface AvailabilityBadgeProps {
  disponible: boolean
  className?: string
}

export function AvailabilityBadge({ disponible, className }: AvailabilityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        disponible
          ? "border-[var(--color-energy-200)] bg-[var(--color-energy-50)] text-[var(--color-energy-700)]"
          : "border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          disponible ? "bg-[var(--color-energy-500)] animate-pulse" : "bg-[var(--color-warning-500)]"
        )}
      />
      {disponible ? "Disponible" : "No disponible"}
    </span>
  )
}
