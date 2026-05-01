import { cn } from "@/lib/cn"

const styles = {
  bajo: "bg-[var(--color-energy-50)] text-[var(--color-energy-700)] border-[var(--color-energy-200)]",
  medio: "bg-[var(--color-solar-50)] text-[var(--color-solar-700)] border-[var(--color-solar-200)]",
  alto: "bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-[var(--color-danger-200)]",
}

interface RiskBadgeProps {
  riesgo: "bajo" | "medio" | "alto" | string | null
  className?: string
}

export function RiskBadge({ riesgo, className }: RiskBadgeProps) {
  if (!riesgo) return null
  const key = riesgo as keyof typeof styles
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize",
        styles[key] ?? styles.bajo,
        className
      )}
    >
      {riesgo.charAt(0).toUpperCase() + riesgo.slice(1)}
    </span>
  )
}
