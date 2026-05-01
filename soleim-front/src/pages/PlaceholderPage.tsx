import { Construction, Layers } from "lucide-react"
import { EmptyState } from "@/components/feedback/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"

interface PlaceholderPageProps {
  title?: string
  area?: string
}

export default function PlaceholderPage({ title = "Próximamente", area = "Próximas fases" }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={area}
        title={title}
        description="Esta vista forma parte de la siguiente fase del rediseño."
      />
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <EmptyState
          title="Base preparada"
          description="La ruta está protegida, visible en navegación y lista para conectar componentes reales sin dejar pantallas en blanco."
          icon={Construction}
          action={
            <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <Layers className="h-3.5 w-3.5" />
              Alcance reservado para Fase 2
            </span>
          }
        />
      </div>
    </div>
  )
}
