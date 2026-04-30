import { cn } from "@/lib/cn"

interface ContractPlanBadgeProps {
  nivel: string | null | undefined
  className?: string
}

const styles: Record<string, string> = {
  basico: "border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
  básico: "border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
  estandar: "border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
  estándar: "border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
  premium: "border-[var(--color-sla-100)] bg-[var(--color-sla-50)] text-[var(--color-sla-700)]",
}

const labels: Record<string, string> = {
  basico: "Básico",
  básico: "Básico",
  estandar: "Estándar",
  estándar: "Estándar",
  premium: "Premium",
}

export function ContractPlanBadge({ nivel, className }: ContractPlanBadgeProps) {
  const key = (nivel ?? "").toLowerCase()

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        styles[key] ?? styles.estandar,
        className
      )}
    >
      {labels[key] ?? nivel ?? "N/D"}
    </span>
  )
}
