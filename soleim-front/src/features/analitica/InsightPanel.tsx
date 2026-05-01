import { AlertTriangle, BatteryWarning, Lightbulb, TrendingDown } from "lucide-react"
import { EmptyState } from "@/components/feedback/EmptyState"
import type {
  Alerta,
  Autonomia,
  BateriaSalud,
  ComparativaInstalacion,
  InstalacionResumen,
} from "@/types/domain"

interface InsightPanelProps {
  alertas: Alerta[]
  comparativa: ComparativaInstalacion[]
  bateria: BateriaSalud | null | undefined
  autonomia: Autonomia | null | undefined
  instalaciones: InstalacionResumen[]
}

interface Insight {
  title: string
  description: string
  tone: "danger" | "warning" | "info"
  icon: typeof AlertTriangle
}

const toneStyles = {
  danger: "border-[var(--color-danger-200)] bg-[var(--color-danger-50)] text-[var(--color-danger-700)]",
  warning: "border-[var(--color-solar-200)] bg-[var(--color-solar-50)] text-[var(--color-solar-700)]",
  info: "border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
}

function buildInsights({
  alertas,
  comparativa,
  bateria,
  autonomia,
  instalaciones,
}: InsightPanelProps): Insight[] {
  const insights: Insight[] = []
  const criticalByInstallation = new Map<string, number>()

  for (const alerta of alertas) {
    if (alerta.severidad !== "critica") continue
    const key = alerta.instalacionNombre || "Instalación sin nombre"
    criticalByInstallation.set(key, (criticalByInstallation.get(key) ?? 0) + 1)
  }

  const mostCritical = Array.from(criticalByInstallation.entries()).sort((a, b) => b[1] - a[1])[0]
  if (mostCritical) {
    insights.push({
      title: "Instalación con mayor número de alertas críticas",
      description: `${mostCritical[0]} concentra ${mostCritical[1]} alertas críticas activas.`,
      tone: "danger",
      icon: AlertTriangle,
    })
  }

  if (bateria && bateria.soc < 30) {
    insights.push({
      title: "Batería con autonomía baja",
      description: `La última lectura reporta ${bateria.soc.toFixed(1)}% de carga.`,
      tone: "warning",
      icon: BatteryWarning,
    })
  } else if (autonomia?.autonomiaHoras != null && autonomia.autonomiaHoras < 2) {
    insights.push({
      title: "Batería con autonomía baja",
      description: `La autonomía estimada es de ${autonomia.autonomiaHoras.toFixed(1)} horas.`,
      tone: "warning",
      icon: BatteryWarning,
    })
  }

  const lowSolarRatio = comparativa
    .filter((item) => item.solarRatio != null)
    .sort((a, b) => (a.solarRatio ?? 0) - (b.solarRatio ?? 0))[0]
  if (lowSolarRatio && (lowSolarRatio.solarRatio ?? 0) < 0.45) {
    insights.push({
      title: "Consumo superior a la generación solar",
      description: `${lowSolarRatio.instalacionNombre} cubre solo ${((lowSolarRatio.solarRatio ?? 0) * 100).toFixed(1)}% con fuente solar.`,
      tone: "info",
      icon: TrendingDown,
    })
  }

  const highRisk = instalaciones.find((instalacion) => instalacion.riesgo === "alto")
  if (highRisk) {
    insights.push({
      title: "Instalación con mayor riesgo operativo",
      description: `${highRisk.nombre} está marcada con riesgo alto en el panel operativo.`,
      tone: "danger",
      icon: AlertTriangle,
    })
  }

  return insights.slice(0, 5)
}

export function InsightPanel(props: InsightPanelProps) {
  const insights = buildInsights(props)

  return (
    <aside className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <Lightbulb className="h-4 w-4 text-[var(--color-solar-600)]" />
          Insights calculados
        </h3>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          Reglas simples basadas en datos reales disponibles.
        </p>
      </div>

      <div className="space-y-3 p-4">
        {insights.length === 0 ? (
          <EmptyState
            title="Sin suficientes datos"
            description="Cuando existan alertas, batería o comparativa se mostrarán recomendaciones calculadas."
            icon={Lightbulb}
            className="py-10"
          />
        ) : (
          insights.map((insight) => {
            const Icon = insight.icon
            return (
              <div key={insight.title} className={`rounded-[var(--radius-md)] border p-3 ${toneStyles[insight.tone]}`}>
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">{insight.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{insight.description}</p>
                    <span className="mt-2 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal">
                      Insight calculado
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
