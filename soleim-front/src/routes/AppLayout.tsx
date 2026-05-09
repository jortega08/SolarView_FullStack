import { Outlet, useLocation, useNavigation } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { useI18n } from "@/contexts/I18nContext"
import { cn } from "@/lib/cn"

/**
 * Barra fina de progreso en la parte superior que aparece durante las
 * navegaciones entre rutas. Es mucho menos intrusiva que reemplazar el
 * contenido completo con skeletons y da feedback inmediato al usuario.
 */
function NavigationBar({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden pointer-events-none",
        "transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "h-full bg-[var(--color-primary-500)]",
          "transition-[width] ease-out",
          active ? "duration-[2000ms] w-[85%]" : "duration-300 w-full",
        )}
        style={{ transformOrigin: "left" }}
      />
    </div>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { state: navState } = useNavigation()   // 'idle' | 'loading' | 'submitting'
  const isNavigating = navState === "loading"
  const { t } = useI18n()

  const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    "/":                    { title: t("page.dashboard"),     subtitle: t("page.dashboard.sub") },
    "/instalaciones":       { title: t("page.installations"), subtitle: t("page.installations.sub") },
    "/telemetria":          { title: t("page.telemetry"),     subtitle: t("page.telemetry.sub") },
    "/alertas":             { title: t("page.alerts"),        subtitle: t("page.alerts.sub") },
    "/ordenes":             { title: t("page.orders"),        subtitle: t("page.orders.sub") },
    "/operaciones":         { title: t("page.operations"),    subtitle: t("page.operations.sub") },
    "/mantenimiento":       { title: t("page.maintenance"),   subtitle: t("page.maintenance.sub") },
    "/perfil-profesional":  { title: t("page.profile"),       subtitle: t("page.profile.sub") },
    "/tecnicos":            { title: t("page.technicians"),   subtitle: t("page.technicians.sub") },
    "/analitica":           { title: t("page.analytics"),     subtitle: t("page.analytics.sub") },
    "/reportes":            { title: t("page.reports"),       subtitle: t("page.reports.sub") },
    "/notificaciones":      { title: t("page.notifications"), subtitle: t("page.notifications.sub") },
    "/tarifas":             { title: t("page.tariffs"),       subtitle: t("page.tariffs.sub") },
    "/mi-empresa":          { title: t("page.company"),       subtitle: t("page.company.sub") },
    "/equipo":              { title: t("page.team"),          subtitle: t("page.team.sub") },
    "/configuracion":       { title: t("page.settings"),      subtitle: t("page.settings.sub") },
  }

  const basePath = "/" + pathname.split("/")[1]
  const meta = PAGE_TITLES[basePath] ?? { title: "SOLEIM" }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Barra de progreso de navegación */}
      <NavigationBar active={isNavigating} />

      <Sidebar />

      <div
        className={cn(
          "flex flex-col min-h-screen transition-[padding-left] duration-200 ease-in-out",
          // Atenúa ligeramente el contenido mientras carga la nueva página.
          // No oculta nada: solo da feedback visual de que algo está pasando.
          isNavigating && "opacity-60 pointer-events-none transition-opacity duration-150",
        )}
        style={{ paddingLeft: "var(--sidebar-current-width)" }}
      >
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main
          className="flex-1"
          style={{
            paddingTop: "var(--header-height)",
            // "clip" recorta el desbordamiento horizontal sin crear un nuevo
            // scroll-container, preservando position:sticky en páginas con subnavs.
            overflowX: "clip",
          }}
        >
          <div className="p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
