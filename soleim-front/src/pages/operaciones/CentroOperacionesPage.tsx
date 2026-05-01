import { useState, lazy, Suspense } from "react"
import { Bell, ClipboardList } from "lucide-react"
import { cn } from "@/lib/cn"
import { PageLoader } from "@/routes/PageLoader"

const AlertasPage = lazy(() => import("./AlertasPage"))
const OrdenesPage = lazy(() => import("./OrdenesPage"))

type Tab = "alertas" | "ordenes"

interface CentroOperacionesPageProps {
  defaultTab?: Tab
}

export default function CentroOperacionesPage({
  defaultTab = "alertas",
}: CentroOperacionesPageProps) {
  const [tab, setTab] = useState<Tab>(defaultTab)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        <TabButton
          active={tab === "alertas"}
          onClick={() => setTab("alertas")}
          icon={<Bell className="h-4 w-4" />}
          label="Alertas"
        />
        <TabButton
          active={tab === "ordenes"}
          onClick={() => setTab("ordenes")}
          icon={<ClipboardList className="h-4 w-4" />}
          label="Órdenes"
        />
      </div>

      <Suspense fallback={<PageLoader />}>
        {tab === "alertas" ? <AlertasPage /> : <OrdenesPage />}
      </Suspense>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px",
        active
          ? "border-[var(--color-primary-600)] text-[var(--color-primary-700)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
