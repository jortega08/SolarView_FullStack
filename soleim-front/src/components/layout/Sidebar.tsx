import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Zap, Radio, Bell, ClipboardList,
  Wrench, Users, UserCog, BarChart2, FileText, Settings,
  ChevronLeft, ChevronRight, LogOut
} from "lucide-react"
import { cn } from "@/lib/cn"
import { useAuth } from "@/contexts/useAuth"
import { useI18n } from "@/contexts/I18nContext"
import { useNoLeidasCount } from "@/hooks/useNotificaciones"
import { useAlertas } from "@/hooks/useAlertas"
import { LiveBadge } from "@/components/status/LiveBadge"
import { useState } from "react"

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

  const items: NavItem[] = [
    { to: "/", label: t("nav.dashboard"), icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: "/instalaciones", label: t("nav.installations"), icon: <Zap className="w-4 h-4" /> },
    { to: "/telemetria", label: t("nav.telemetry"), icon: <Radio className="w-4 h-4" /> },
    { to: "/alertas", label: t("nav.alerts"), icon: <Bell className="w-4 h-4" />, badge: alertas?.length },
    { to: "/ordenes", label: t("nav.orders"), icon: <ClipboardList className="w-4 h-4" /> },
    { to: "/mantenimiento", label: t("nav.maintenance"), icon: <Wrench className="w-4 h-4" /> },
    { to: "/perfil-profesional", label: t("nav.profile"), icon: <UserCog className="w-4 h-4" /> },
    { to: "/tecnicos", label: t("nav.technicians"), icon: <Users className="w-4 h-4" /> },
    { to: "/analitica", label: t("nav.analytics"), icon: <BarChart2 className="w-4 h-4" /> },
    { to: "/reportes", label: t("nav.reports"), icon: <FileText className="w-4 h-4" /> },
    {
      to: "/notificaciones",
      label: t("nav.notifications"),
      icon: <Bell className="w-4 h-4" />,
      badge: notiCount && notiCount > 0 ? notiCount : undefined,
    },
    { to: "/configuracion", label: t("nav.settings"), icon: <Settings className="w-4 h-4" /> },
  ]
  return items
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const items = useSidebarItems()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-30 flex flex-col bg-[var(--color-neutral-900)] transition-all duration-200",
        collapsed ? "w-16" : "w-[232px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[var(--header-height)] border-b border-[var(--color-neutral-800)] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">SOLEIM</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors relative group",
                isActive
                  ? "bg-[var(--color-primary-600)] text-white font-medium"
                  : "text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-800)] hover:text-white"
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge != null && item.badge > 0 && (
              <span className="ml-auto bg-[var(--color-danger-500)] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--color-neutral-800)] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--color-neutral-800)] p-2 space-y-2 flex-shrink-0">
        <div className="px-3 py-2">
          <LiveBadge className="text-[var(--color-neutral-400)]" />
        </div>
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-neutral-800)]">
            <p className="text-xs font-medium text-white truncate">{user.nombre}</p>
            <p className="text-xs text-[var(--color-neutral-500)] truncate capitalize">{user.rol}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full rounded-[var(--radius-md)] text-sm text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-800)] hover:text-white transition-colors",
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full py-1.5 text-[var(--color-neutral-500)] hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
