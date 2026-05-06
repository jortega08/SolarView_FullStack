import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Centro de control", subtitle: "Resumen operativo en tiempo real" },
  "/instalaciones": { title: "Instalaciones", subtitle: "Gestión de instalaciones solares" },
  "/telemetria": { title: "Telemetría", subtitle: "Datos en tiempo real de sensores" },
  "/alertas": { title: "Alertas", subtitle: "Centro de operaciones" },
  "/ordenes": { title: "Órdenes de trabajo", subtitle: "Centro de operaciones" },
  "/operaciones": { title: "Centro de operaciones", subtitle: "Alertas y órdenes de trabajo" },
  "/mantenimiento": { title: "Mantenimiento", subtitle: "Calendario, contratos y planes de servicio" },
  "/perfil-profesional": { title: "Perfil profesional", subtitle: "Hoja de vida y disponibilidad tecnica" },
  "/tecnicos": { title: "Técnicos", subtitle: "Directorio y disponibilidad del equipo técnico" },
  "/analitica": { title: "Analítica", subtitle: "Inteligencia energética y operativa" },
  "/reportes": { title: "Reportes", subtitle: "Exportación y análisis de datos" },
  "/notificaciones": { title: "Notificaciones", subtitle: "Bandeja de notificaciones" },
  "/tarifas": { title: "Tarifas de energía", subtitle: "Valor del kWh por ciudad o instalación" },
  "/mi-empresa": { title: "Mi empresa", subtitle: "Datos del prestador de servicio" },
  "/equipo": { title: "Equipo", subtitle: "Usuarios e invitaciones del prestador" },
  "/configuracion": { title: "Configuración", subtitle: "Ajustes del sistema" },
}

export function AppLayout() {
  const { pathname } = useLocation()

  const basePath = "/" + pathname.split("/")[1]
  const meta = PAGE_TITLES[basePath] ?? { title: "SOLEIM" }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ paddingLeft: "232px" }}
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
