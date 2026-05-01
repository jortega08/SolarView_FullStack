import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/cn"

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message = "Error al cargar los datos", onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-10 px-4 text-center", className)}>
      <div className="w-10 h-10 rounded-full bg-[var(--color-danger-50)] flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5 text-[var(--color-danger-500)]" />
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] underline"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
