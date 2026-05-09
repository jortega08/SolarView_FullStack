import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Zap, Radio, Bell, ClipboardList,
  Wrench, Users, UserCog, BarChart2, FileText, Settings, DollarSign,
  ChevronLeft, ChevronRight, LogOut, Building2,
} from "lucide-react"

/** Marca "S" de Soleim — dos arcos (dorado + teal) con puntos en los extremos */
function SoleimMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.2)}
      viewBox="0 0 28 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Arco superior — dorado */}
      <path
        d="M6 11 C6 5.5 10 3 15 3 C20 3 23 6 23 11 C23 15.5 20 17 15 17"
        stroke="#E0B63D"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="23" cy="11" r="2.8" fill="#E0B63D" />

      {/* Arco inferior — teal */}
      <path
        d="M22 23 C22 28.5 18 31 13 31 C8 31 5 28 5 23 C5 18.5 8 17 13 17"
        stroke="#3F687A"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="5" cy="23" r="2.8" fill="#3F687A" />
    </svg>
  )
}
import { cn } from "@/lib/cn"
import { useAuth } from "@/contexts/useAuth"
import { useI18n } from "@/contexts/I18nContext"
import { usePermissions } from "@/hooks/usePermissions"
import { useNoLeidasCount } from "@/hooks/useNotificaciones"
import { useAlertas } from "@/hooks/useAlertas"
import { LiveBadge } from "@/components/status/LiveBadge"
import { useState, useEffect, useCallback } from "react"
import { preloadRoutes } from "@/routes"

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
}

function useSidebarItems() {
  const { data: notiCount } = useNoLeidasCount()
  const { data: alertas } = useAlertas({ estado: "activa" })
  const { t } = useI18n()
  const { nav } = usePermissions()

  const all = [
    { to: "/",                   label: t("nav.dashboard"),     icon: <LayoutDashboard className="w-4 h-4" /> },
    nav.verInstalaciones  && { to: "/instalaciones",            label: t("nav.installations"), icon: <Zap className="w-4 h-4" /> },
    nav.verTelemetria     && { to: "/telemetria",               label: t("nav.telemetry"),     icon: <Radio className="w-4 h-4" /> },
    nav.verAlertas        && { to: "/alertas",                  label: t("nav.alerts"),        icon: <Bell className="w-4 h-4" />, badge: alertas?.length },
    nav.verOrdenes        && { to: "/ordenes",                  label: t("nav.orders"),        icon: <ClipboardList className="w-4 h-4" /> },
    nav.verMantenimiento  && { to: "/mantenimiento",            label: t("nav.maintenance"),   icon: <Wrench className="w-4 h-4" /> },
                             { to: "/perfil-profesional",       label: t("nav.profile"),       icon: <UserCog className="w-4 h-4" /> },
    nav.verTecnicos       && { to: "/tecnicos",                 label: t("nav.technicians"),   icon: <Users className="w-4 h-4" /> },
    nav.verAnalitica      && { to: "/analitica",                label: t("nav.analytics"),     icon: <BarChart2 className="w-4 h-4" /> },
    nav.verReportes       && { to: "/reportes",                 label: t("nav.reports"),       icon: <FileText className="w-4 h-4" /> },
                             { to: "/notificaciones",           label: t("nav.notifications"), icon: <Bell className="w-4 h-4" />, badge: notiCount && notiCount > 0 ? notiCount : undefined },
    nav.verTarifas        && { to: "/tarifas",                  label: "Tarifas",              icon: <DollarSign className="w-4 h-4" /> },
    nav.verMiEmpresa      && { to: "/mi-empresa",               label: "Mi empresa",           icon: <Building2 className="w-4 h-4" /> },
    nav.verEquipo         && { to: "/equipo",                   label: "Equipo",               icon: <Users className="w-4 h-4" /> },
    nav.verConfiguracion  && { to: "/configuracion",            label: t("nav.settings"),      icon: <Settings className="w-4 h-4" /> },
  ]
  return all.filter(Boolean) as NavItem[]
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const items = useSidebarItems()

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-current-width",
      collapsed ? "64px" : "232px",
    )
  }, [collapsed])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  /**
   * Preload del chunk JS de la página destino cuando el cursor entra al enlace.
   * React.lazy cachea el resultado: llamarlo varias veces no genera peticiones
   * extra — el browser descarga el chunk una sola vez.
   */
  const handleMouseEnter = useCallback((to: string) => {
    preloadRoutes[to]?.()
  }, [])

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-30 flex flex-col bg-[var(--sidebar-bg)] transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-[232px]",
      )}
    >
      {/* Logo → navega al dashboard */}
      <Link
        to="/"
        onMouseEnter={() => handleMouseEnter("/")}
        className="flex items-center gap-2.5 px-4 h-[var(--header-height)] border-b border-[var(--sidebar-border)] flex-shrink-0 hover:opacity-90 transition-opacity"
      >
        {/* Marca "S" — visible colapsado y expandido */}
        <span className="flex-shrink-0">
          <SoleimMark size={collapsed ? 26 : 28} />
        </span>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-[17px] tracking-tight">Soleim</span>
            <span className="text-[var(--sidebar-text)] text-[9px] font-medium tracking-widest uppercase">
              Control Energético
            </span>
          </div>
        )}
      </Link>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 py-3 px-2 space-y-0.5",
          collapsed ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
        )}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onMouseEnter={() => handleMouseEnter(item.to)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors relative group",
                isActive
                  ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-white",
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge != null && item.badge > 0 && (
              <span className="ml-auto bg-[var(--color-danger-500)] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--sidebar-tooltip-bg)] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] p-2 space-y-2 flex-shrink-0">
        <div className="px-3 py-2">
          <LiveBadge className="text-[var(--sidebar-text)]" />
        </div>
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--sidebar-item-hover)]">
            <p className="text-xs font-medium text-white truncate">{user.nombre}</p>
            <p className="text-xs text-[var(--sidebar-text)] truncate capitalize">{user.rol}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-[var(--radius-md)] text-sm text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full py-1.5 text-[var(--sidebar-text)] hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
