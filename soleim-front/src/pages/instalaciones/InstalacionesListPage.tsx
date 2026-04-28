import { Link } from "react-router-dom"
import { Zap, Eye } from "lucide-react"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { StatusBadge } from "@/components/status/StatusBadge"
import { RiskBadge } from "@/components/status/RiskBadge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { formatPower, formatEnergy, formatPercent } from "@/lib/format"

export default function InstalacionesListPage() {
  const { data: instalaciones, isLoading } = useInstalaciones()

  return (
    <div className="space-y-4">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Todas las instalaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {["Instalación", "Estado", "Tipo", "Batería", "Potencia actual", "Generación hoy", "Riesgo", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium text-[var(--color-text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : instalaciones?.length === 0
                ? (
                  <tr><td colSpan={8} className="py-12"><EmptyState title="Sin instalaciones" icon={Zap} /></td></tr>
                )
                : instalaciones?.map((inst) => (
                  <tr key={inst.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">{inst.nombre}</p>
                      {inst.ciudad && <p className="text-[var(--color-text-muted)]">{inst.ciudad}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge estado={inst.estado} /></td>
                    <td className="px-4 py-3 capitalize text-[var(--color-text-secondary)]">{inst.tipoSistema ?? "—"}</td>
                    <td className="px-4 py-3 tabular">{inst.bateriaSoc != null ? formatPercent(inst.bateriaSoc) : "—"}</td>
                    <td className="px-4 py-3 tabular">{formatPower(inst.potenciaActual)}</td>
                    <td className="px-4 py-3 tabular">{formatEnergy(inst.generacionHoy)}</td>
                    <td className="px-4 py-3"><RiskBadge riesgo={inst.riesgo} /></td>
                    <td className="px-4 py-3">
                      <Link to={`/instalaciones/${inst.id}`} className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-[var(--color-neutral-100)]">
                        <Eye className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
