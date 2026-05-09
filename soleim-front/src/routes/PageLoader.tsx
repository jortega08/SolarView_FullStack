import { useEffect, useState } from "react"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"

/**
 * Skeleton genérico que se muestra mientras React carga un chunk lazy.
 *
 * Se aplica un retraso de 150 ms antes de aparecer: si el chunk ya está en
 * caché (o la red es rápida), el usuario nunca llega a ver el spinner y
 * se evita el destello blanco de "una pantalla en blanco y luego contenido".
 */
export function PageLoader() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(id)
  }, [])

  if (!visible) return null

  return (
    <div className="p-5 space-y-4 animate-in fade-in duration-200">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
