import { Bell, User, ChevronDown, Sun, Moon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/useAuth"
import { useI18n } from "@/contexts/I18nContext"
import { useNoLeidasCount } from "@/hooks/useNotificaciones"
import { cn } from "@/lib/cn"
import { useState, useRef, useEffect, useCallback } from "react"

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const { data: notiCount } = useNoLeidasCount()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState<boolean>(
    () => (localStorage.getItem("solein_theme") ?? "light") === "dark"
  )

  // Sincronizar cuando ConfiguracionPage u otro componente cambia el tema
  useEffect(() => {
    const handler = (e: Event) => {
      const theme = (e as CustomEvent<string>).detail
      setIsDark(theme === "dark")
    }
    window.addEventListener("solein:theme-change", handler)
    return () => window.removeEventListener("solein:theme-change", handler)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = isDark ? "light" : "dark"
    localStorage.setItem("solein_theme", next)
    // CORRECTO: el CSS usa [data-theme="dark"], no la clase .dark
    document.documentElement.setAttribute("data-theme", next)
    window.dispatchEvent(new CustomEvent("solein:theme-change", { detail: next }))
    setIsDark(next === "dark")
  }, [isDark])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 h-[var(--header-height)] bg-[var(--color-surface)] border-b border-[var(--color-border)]",
        "flex items-center justify-between px-5 gap-4",
        "left-[232px] transition-all duration-200"
      )}
      style={{ left: "var(--sidebar-current-width, 232px)" }}
    >
      {/* Título */}
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--color-text-secondary)] truncate">{subtitle}</p>}
      </div>

      {/* Acciones centrales */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Derecha */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notificaciones */}
        <Link
          to="/notificaciones"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors"
        >
          <Bell className="w-4.5 h-4.5 text-[var(--color-neutral-500)]" />
          {notiCount != null && notiCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-danger-500)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notiCount > 9 ? "9+" : notiCount}
            </span>
          )}
        </Link>

        {/* Dark / Light toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors"
        >
          {isDark
            ? <Sun className="w-4 h-4 text-[var(--color-neutral-500)]" />
            : <Moon className="w-4 h-4 text-[var(--color-neutral-500)]" />
          }
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            {user && (
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-[var(--color-text-primary)] leading-tight">{user.nombre}</p>
                <p className="text-xs text-[var(--color-text-secondary)] capitalize leading-tight">{user.rol}</p>
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-[var(--color-neutral-400)]" />
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-overlay)] py-1 z-50">
              <Link
                to="/perfil-profesional"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)]"
                onClick={() => setDropOpen(false)}
              >
                {t("header.profile")}
              </Link>
              <Link
                to="/configuracion"
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)]"
                onClick={() => setDropOpen(false)}
              >
                {t("header.settings")}
              </Link>
              <div className="border-t border-[var(--color-border)] my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)]"
              >
                {t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
