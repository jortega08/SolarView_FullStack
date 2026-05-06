import { useState, useEffect, useRef } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import {
  Home, AlertTriangle, FileDown, Settings,
  LogOut, Users, MapPin,
  Bell, ChevronDown, User, CheckCircle,
  Menu, Sun, Moon, Building2,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import useDarkMode from "../hooks/useDarkMode"
import api from "../services/api"

/* ── Configuración de navegación ──────────────────────────────────────────── */
const navGroups = [
  {
    label: "Principal",
    items: [
      { to: "/", icon: Home, label: "Panel", end: true },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { to: "/alertas",  icon: AlertTriangle, label: "Alertas", badge: true },
      { to: "/reportes", icon: FileDown,       label: "Reportes" },
    ],
  },
  {
    label: "Administración",
    items: [
      { to: "/users",         icon: Users,    label: "Usuarios" },
      { to: "/domicilios",    icon: MapPin,   label: "Domicilios" },
      { to: "/mi-empresa",    icon: Building2,label: "Mi empresa", requiresPrestador: true },
      { to: "/equipo",        icon: Users,    label: "Equipo", requiresPrestador: true },
      { to: "/configuracion", icon: Settings, label: "Configuración" },
    ],
  },
]

/* Mapeo de rutas → label para el breadcrumb */
const ROUTE_LABELS = {
  "/":              "Panel",
  "/alertas":       "Alertas",
  "/reportes":      "Reportes",
  "/configuracion": "Configuración",
  "/users":         "Usuarios",
  "/domicilios":    "Domicilios",
  "/mi-empresa":    "Mi empresa",
  "/equipo":        "Equipo",
  "/perfil":        "Mi Perfil",
}

const SEVERIDAD_COLOR = {
  critica: "#dc2626",
  alta:    "#ea580c",
  media:   "#d97706",
  baja:    "#65a30d",
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000)
  if (diff < 1)    return "Ahora"
  if (diff < 60)   return `Hace ${diff}m`
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
  return `Hace ${Math.floor(diff / 1440)}d`
}

/* ── Marca SOLEIM ─────────────────────────────────────────────────────────── */
function SoleinMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="SOLEIM">
      <rect width="40" height="40" rx="10" fill="#1d4ed8"/>
      <circle cx="20" cy="20" r="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      <path d="M22.5 9.5 L14 21.5 L19.5 21.5 L17.5 30.5 L26 18 L20.5 18 Z" fill="white"/>
    </svg>
  )
}

/* ── Topbar ───────────────────────────────────────────────────────────────── */
function Topbar({ user, alertBadge, recentAlerts, onLogout, onToggleSidebar, isDark, onToggleDark }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [bellOpen,    setBellOpen]    = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const bellRef    = useRef(null)
  const profileRef = useRef(null)

  /* Breadcrumb label */
  const currentLabel = (() => {
    const path = location.pathname
    if (ROUTE_LABELS[path]) return ROUTE_LABELS[path]
    if (path.startsWith("/instalacion/")) return "Detalle de instalación"
    return ""
  })()

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=1d4ed8&color=ffffff&bold=true`
    : `https://ui-avatars.com/api/?name=U&background=1d4ed8&color=ffffff&bold=true`

  /* Cerrar dropdowns al hacer click fuera */
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current    && !bellRef.current.contains(e.target))    setBellOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  /* Cerrar con Escape */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { setBellOpen(false); setProfileOpen(false) }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const btnBase = {
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "transparent", border: "1px solid transparent",
    borderRadius: "50%", cursor: "pointer", transition: "all .15s",
    color: "var(--solein-text-muted)",
  }

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      height: 60,
      background: "var(--solein-bg)",
      borderBottom: "1px solid var(--solein-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px 0 16px",
      gap: 6,
    }}>

      {/* ── Lado izquierdo: hamburger + breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          title="Menú de navegación"
          style={{
            ...btnBase,
            width: 36, height: 36,
            borderRadius: "var(--radius-sm)",
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--solein-white)"; e.currentTarget.style.borderColor = "var(--solein-border)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" }}
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        {currentLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--solein-text-muted)", userSelect: "none" }}>Solein</span>
            <span style={{ fontSize: 11, color: "var(--solein-border)", userSelect: "none" }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--solein-navy)" }}>
              {currentLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Lado derecho: tema + campana + perfil ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

        {/* Toggle tema (sol / luna) */}
        <button
          onClick={onToggleDark}
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          style={{
            ...btnBase,
            width: 36, height: 36,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--solein-white)"; e.currentTarget.style.borderColor = "var(--solein-border)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" }}
        >
          {isDark
            ? <Sun  size={17} color="var(--solein-gold)" />
            : <Moon size={17} />
          }
        </button>

        {/* ── Campana ── */}
        <div ref={bellRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setBellOpen(v => !v); setProfileOpen(false) }}
            title="Notificaciones"
            style={{
              ...btnBase,
              width: 36, height: 36,
              background: bellOpen ? "var(--solein-white)" : "transparent",
              borderColor: bellOpen ? "var(--solein-border)" : "transparent",
            }}
            onMouseEnter={e => { if (!bellOpen) { e.currentTarget.style.background = "var(--solein-white)"; e.currentTarget.style.borderColor = "var(--solein-border)" } }}
            onMouseLeave={e => { if (!bellOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" } }}
          >
            <Bell size={17} />
            {alertBadge > 0 && (
              <span style={{
                position: "absolute", top: 7, right: 7,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--solein-red)",
                border: "2px solid var(--solein-bg)",
              }} />
            )}
          </button>

          {/* Dropdown campana */}
          {bellOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 320,
              background: "var(--solein-white)",
              border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
              zIndex: 300,
            }}>
              {/* Header */}
              <div style={{
                padding: "13px 16px 11px",
                borderBottom: "1px solid var(--solein-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--solein-navy)" }}>
                  Notificaciones
                </span>
                {alertBadge > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: "var(--solein-red)", color: "#fff",
                    borderRadius: 20, padding: "1px 8px",
                  }}>
                    {alertBadge} activa{alertBadge !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Lista de alertas */}
              {recentAlerts.length === 0 ? (
                <div style={{
                  padding: "28px 16px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  color: "var(--solein-text-muted)",
                }}>
                  <CheckCircle size={28} color="var(--solein-green)" strokeWidth={1.5} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Sin alertas activas</p>
                  <p style={{ margin: 0, fontSize: 12 }}>Todo opera correctamente</p>
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: 260, overflowY: "auto", background: "var(--solein-white)" }}>
                    {recentAlerts.map((a, i) => (
                      <div
                        key={a.idalerta}
                        style={{
                          padding: "11px 16px",
                          borderBottom: i < recentAlerts.length - 1 ? "1px solid var(--solein-border)" : "none",
                          display: "flex", gap: 10, alignItems: "flex-start",
                          cursor: "pointer", transition: "background .15s",
                          background: "var(--solein-white)",
                        }}
                        onClick={() => { setBellOpen(false); navigate("/alertas") }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--solein-bg)"}
                        onMouseLeave={e => e.currentTarget.style.background = "var(--solein-white)"}
                      >
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: SEVERIDAD_COLOR[a.severidad] || "#94a3b8",
                          flexShrink: 0, marginTop: 5,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 12.5, color: "var(--solein-text)",
                            margin: "0 0 2px", lineHeight: 1.45,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {a.mensaje}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--solein-text-muted)", margin: 0 }}>
                            {timeAgo(a.fecha)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 12px", borderTop: "1px solid var(--solein-border)" }}>
                    <button
                      onClick={() => { setBellOpen(false); navigate("/alertas") }}
                      style={{
                        width: "100%", padding: "8px", fontSize: 12, fontWeight: 600,
                        background: "var(--solein-bg)", color: "var(--solein-teal)",
                        border: "1px solid var(--solein-border)", borderRadius: "var(--radius-md)",
                        cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--solein-teal-bg)"; e.currentTarget.style.borderColor = "var(--solein-teal)" }}
                      onMouseLeave={e => { e.currentTarget.style.background = "var(--solein-bg)"; e.currentTarget.style.borderColor = "var(--solein-border)" }}
                    >
                      Ver todas las alertas →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Perfil ── */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setProfileOpen(v => !v); setBellOpen(false) }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 10px 5px 5px",
              borderRadius: 40,
              background: profileOpen ? "var(--solein-white)" : "transparent",
              border: `1px solid ${profileOpen ? "var(--solein-border)" : "transparent"}`,
              cursor: "pointer", transition: "all .15s",
            }}
            onMouseEnter={e => { if (!profileOpen) { e.currentTarget.style.background = "var(--solein-white)"; e.currentTarget.style.borderColor = "var(--solein-border)" } }}
            onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" } }}
          >
            <img
              src={avatarUrl}
              alt={user?.nombre}
              style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid var(--solein-gold)", flexShrink: 0 }}
            />
            <div style={{ textAlign: "left", lineHeight: 1.25 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--solein-text)", margin: 0, whiteSpace: "nowrap" }}>
                {user?.nombre
                  ? user.nombre.split(' ').slice(0, 2).join(' ')
                  : "Usuario"}
              </p>
              <p style={{ fontSize: 11, color: "var(--solein-text-muted)", margin: 0, whiteSpace: "nowrap" }}>
                {user?.email || ""}
              </p>
            </div>
            <ChevronDown
              size={14}
              color="var(--solein-text-muted)"
              style={{ transition: "transform .2s", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
            />
          </button>

          {/* Dropdown perfil */}
          {profileOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 220,
              background: "var(--solein-white)",
              border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
              zIndex: 300,
            }}>
              {/* Cabecera usuario */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--solein-border)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--solein-navy)", margin: "0 0 2px" }}>
                  {user?.nombre}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--solein-text-muted)", margin: 0 }}>
                  {user?.email}
                </p>
              </div>

              {/* Links */}
              <div style={{ padding: "6px" }}>
                {[
                  { label: "Mi perfil",     icon: User,     to: "/perfil" },
                  { label: "Configuración", icon: Settings, to: "/configuracion" },
                ].map(item => (
                  <button
                    key={item.to}
                    onClick={() => { setProfileOpen(false); navigate(item.to) }}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      width: "100%", padding: "9px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "transparent", border: "none",
                      cursor: "pointer", color: "var(--solein-text)",
                      fontSize: 13, fontFamily: "inherit", textAlign: "left",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--solein-bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <item.icon size={15} color="var(--solein-text-muted)" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Cerrar sesión */}
              <div style={{ padding: "6px", borderTop: "1px solid var(--solein-border)" }}>
                <button
                  onClick={() => { setProfileOpen(false); onLogout() }}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    width: "100%", padding: "9px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent", border: "none",
                    cursor: "pointer", color: "var(--solein-red)",
                    fontSize: 13, fontFamily: "inherit", textAlign: "left",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/* ── Layout principal ─────────────────────────────────────────────────────── */
const W_OPEN     = 220
const W_CLOSED   = 64
const BREAKPOINT = 768

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [isDark, setIsDark] = useDarkMode()

  const [collapsed,    setCollapsed]    = useState(() => localStorage.getItem("solein_sidebar") === "1")
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < BREAKPOINT)
  const [alertBadge,   setAlertBadge]   = useState(0)
  const [recentAlerts, setRecentAlerts] = useState([])

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < BREAKPOINT)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Auto-logout cuando cualquier llamada API retorna 401
  useEffect(() => {
    const handleSessionExpired = () => {
      logout()
      toast?.("Tu sesión ha expirado. Por favor inicia sesión nuevamente.", "warning", 6000)
      navigate("/login")
    }
    window.addEventListener("solein:session-expired", handleSessionExpired)
    return () => window.removeEventListener("solein:session-expired", handleSessionExpired)
  }, [logout, navigate, toast])

  // Polling de alertas activas para badge + dropdown
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await api.getAlertas()
        const list = Array.isArray(data) ? data : data.results ?? []
        const active = list.filter(a => a.estado === "activa")
        setAlertBadge(active.length)
        setRecentAlerts(active.slice(0, 5))
      } catch { /* silencioso */ }
    }
    fetchAlerts()
    const iv = setInterval(fetchAlerts, 60000)
    return () => clearInterval(iv)
  }, [])

  const isCollapsed = isMobile || collapsed

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("solein_sidebar", next ? "1" : "0")
  }

  const handleLogout = () => { logout(); navigate("/login") }

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=1d4ed8&color=ffffff&bold=true`
    : `https://ui-avatars.com/api/?name=U&background=1d4ed8&color=ffffff&bold=true`

  const W = isCollapsed ? W_CLOSED : W_OPEN

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--solein-bg)", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{
        width: W, minWidth: W,
        background: "#0f172a",   /* SOLEIM dark — no cambia con dark mode */
        display: "flex", flexDirection: "column",
        position: "fixed", height: "100vh",
        zIndex: 200,
        transition: "width .25s ease, min-width .25s ease",
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>

        {/* Logo — sin botón toggle (se movió al topbar) */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          padding: isCollapsed ? "20px 0" : "20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          minHeight: 72, transition: "padding .25s",
        }}>
          <NavLink
            to="/"
            title="Ir al Panel principal"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}
          >
            <div style={{ flexShrink: 0 }}><SoleinMark size={32} /></div>
            {!isCollapsed && (
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>SOLEIM</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 600, margin: "2px 0 0", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Control Solar B2B
                </p>
              </div>
            )}
          </NavLink>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, display: "flex", flexDirection: "column", gap: 0,
          padding: "8px 8px", overflowY: "auto", overflowX: "hidden",
        }}>
          {navGroups.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              {!isCollapsed && (
                <span style={{
                  display: "block", fontSize: 10, fontWeight: 700,
                  color: "#475569", textTransform: "uppercase", letterSpacing: ".08em",
                  padding: gi === 0 ? "8px 12px 4px" : "16px 12px 4px",
                }}>
                  {group.label}
                </span>
              )}
              {isCollapsed && gi > 0 && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 12px" }} />
              )}
              {group.items
                .filter(item => !item.requiresPrestador || user?.prestador_id || user?.es_admin_prestador)
                .map(({ to, icon: Icon, label, end, badge }) => {
                const badgeCount = badge ? alertBadge : 0
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={isCollapsed ? label : undefined}
                    style={({ isActive }) => ({
                      display: "flex", alignItems: "center",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      gap: 10,
                      padding: isCollapsed ? "10px 0" : "9px 12px",
                      borderRadius: 10,
                      color: isActive ? "#ffffff" : "#94a3b8",
                      background: isActive ? "#1d4ed8" : "transparent",
                      textDecoration: "none",
                      fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                      transition: "all .18s",
                      whiteSpace: "nowrap", overflow: "hidden", position: "relative",
                    })}
                    onMouseEnter={e => {
                      if (e.currentTarget.getAttribute("aria-current") !== "page") {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)"
                        e.currentTarget.style.color = "#fff"
                      }
                    }}
                    onMouseLeave={e => {
                      const active = e.currentTarget.getAttribute("aria-current") === "page"
                      e.currentTarget.style.background = active ? "#1d4ed8" : "transparent"
                      e.currentTarget.style.color = active ? "#ffffff" : "#94a3b8"
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Icon size={17} />
                      {isCollapsed && badgeCount > 0 && (
                        <span style={{
                          position: "absolute", top: -4, right: -4,
                          width: 8, height: 8, borderRadius: "50%",
                          background: "var(--solein-red)",
                          border: "1.5px solid #0f172a",
                        }} />
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span style={{ flex: 1 }}>{label}</span>
                        {badgeCount > 0 && (
                          <span style={{
                            background: "var(--solein-red)", color: "#fff",
                            borderRadius: 20, padding: "1px 6px",
                            fontSize: 10, fontWeight: 700, minWidth: 18,
                            textAlign: "center", lineHeight: "16px", flexShrink: 0,
                          }}>
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer sidebar: avatar compacto */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 8px",
        }}>
          <NavLink
            to="/perfil"
            title={isCollapsed ? user?.nombre || "Mi perfil" : undefined}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: isCollapsed ? "8px 0" : "8px 10px",
                borderRadius: 10, cursor: "pointer", transition: "background .18s",
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#243352"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <img
                src={avatarUrl}
                alt={user?.nombre}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--solein-gold)", flexShrink: 0 }}
              />
              {!isCollapsed && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <p style={{ color: "#fff", fontSize: 12.5, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.nombre || "Usuario"}
                  </p>
                  <p style={{ color: "#64748b", fontSize: 11, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.email || ""}
                  </p>
                </div>
              )}
            </div>
          </NavLink>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        marginLeft: W,
        minHeight: "100vh",
        background: "var(--solein-bg)",
        transition: "margin-left .25s ease",
        minWidth: 0,
        width: `calc(100% - ${W}px)`,
        display: "flex",
        flexDirection: "column",
      }}>
        <Topbar
          user={user}
          alertBadge={alertBadge}
          recentAlerts={recentAlerts}
          onLogout={handleLogout}
          onToggleSidebar={toggle}
          isDark={isDark}
          onToggleDark={() => setIsDark(v => !v)}
        />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
