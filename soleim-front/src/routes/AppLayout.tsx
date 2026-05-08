import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { useI18n } from "@/contexts/I18nContext"

export function AppLayout() {
  const { pathname } = useLocation()
  const { t } = useI18n()

  const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    "/": { title: t("page.dashboard"), subtitle: t("page.dashboard.sub") },
    "/instalaciones": { title: t("page.installations"), subtitle: t("page.installations.sub") },
    "/telemetria": { title: t("page.telemetry"), subtitle: t("page.telemetry.sub") },
    "/alertas": { title: t("page.alerts"), subtitle: t("page.alerts.sub") },
    "/ordenes": { title: t("page.orders"), subtitle: t("page.orders.sub") },
    "/operaciones": { title: t("page.operations"), subtitle: t("page.operations.sub") },
    "/mantenimiento": { title: t("page.maintenance"), subtitle: t("page.maintenance.sub") },
    "/perfil-profesional": { title: t("page.profile"), subtitle: t("page.profile.sub") },
    "/tecnicos": { title: t("page.technicians"), subtitle: t("page.technicians.sub") },
    "/analitica": { title: t("page.analytics"), subtitle: t("page.analytics.sub") },
    "/reportes": { title: t("page.reports"), subtitle: t("page.reports.sub") },
    "/notificaciones": { title: t("page.notifications"), subtitle: t("page.notifications.sub") },
    "/tarifas": { title: t("page.tariffs"), subtitle: t("page.tariffs.sub") },
    "/mi-empresa": { title: t("page.company"), subtitle: t("page.company.sub") },
    "/equipo": { title: t("page.team"), subtitle: t("page.team.sub") },
    "/configuracion": { title: t("page.settings"), subtitle: t("page.settings.sub") },
  }

  const basePath = "/" + pathname.split("/")[1]
  const meta = PAGE_TITLES[basePath] ?? { title: "SOLEIM" }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-[padding-left] duration-200 ease-in-out"
        style={{ paddingLeft: "var(--sidebar-current-width)" }}
      >
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main
          className="flex-1 overflow-x-hidden"
          style={{ paddingTop: "var(--header-height)" }}
        >
          <div className="p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
