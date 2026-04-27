import { useState, useEffect, useCallback } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  Home, AlertTriangle, FileDown, Settings,
  LogOut, Users, ChevronLeft, ChevronRight, MapPin
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import api from "../services/api"

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
      { to: "/reportes", icon: FileDown,      label: "Reportes" },
    ],
  },
  {
    label: "Administración",
    items: [
      { to: "/users",         icon: Users,    label: "Usuarios" },
      { to: "/domicilios",    icon: MapPin,   label: "Domicilios" },
      { to: "/configuracion", icon: Settings, label: "Configuración" },
    ],
  },
]

function SoleinMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="Solein">
      <path d="M30 9 C30 9 22 8 16 13.5 C10 19 16 24 20 21.5" stroke="#E0B63D" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <path d="M20 21.5 C24 19 30 23.5 25 29 C20 34.5 11 33 11 33" stroke="#3F687A" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <circle cx="30" cy="9"    r="2.8" fill="#E0B63D"/>
      <circle cx="20" cy="21.5" r="2.8" fill="#9B7720"/>
      <circle cx="11" cy="33"   r="2.8" fill="#3F687A"/>
    </svg>
  )
}

const W_OPEN     = 220
const W_CLOSED   = 64
const BREAKPOINT = 768

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem("solein_sidebar") === "1"
  )
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT)
  const [alertBadge, setAlertBadge] = useState(0)

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

  // Polling de alertas activas para el badge del sidebar
  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const data = await api.getAlertas()
        const list = Array.isArray(data) ? data : data.results ?? []
        setAlertBadge(list.filter(a => a.estado === "activa").length)
      } catch { /* silencioso */ }
    }
    fetchBadge()
    const iv = setInterval(fetchBadge, 60000)
    return () => clearInterval(iv)
  }, [])

  // En móvil siempre colapsado
  const isCollapsed = isMobile || collapsed

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("solein_sidebar", next ? "1" : "0")
  }

  const handleLogout = () => { logout(); navigate("/login") }

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=1E2F45&color=E0B63D&bold=true`
    : `https://ui-avatars.com/api/?name=U&background=1E2F45&color=E0B63D&bold=true`

  const W = isCollapsed ? W_CLOSED : W_OPEN

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--solein-bg)", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: W,
        minWidth: W,
        background: "var(--solein-navy)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        zIndex: 200,
        transition: "width .25s ease, min-width .25s ease",
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>

        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          padding: isCollapsed ? "20px 0" : "20px 16px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          minHeight: 72,
          transition: "padding .25s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
            <div style={{ flexShrink: 0 }}>
              <SoleinMark size={32} />
            </div>
            {!isCollapsed && (
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0, letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>Solein</p>
                <p style={{ color: "var(--solein-gold)", fontSize: 9, fontWeight: 600, margin: "2px 0 0", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Monitoreo Energético
                </p>
              </div>
            )}
          </div>

          {/* Toggle — solo en desktop */}
          {!isMobile && (
            <button
              onClick={toggle}
              title={collapsed ? "Expandir menú" : "Colapsar menú"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24, borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", border: "none",
                color: "#94a3b8", cursor: "pointer", flexShrink: 0,
                transition: "background .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          padding: "8px 8px",
          overflowY: "auto",
          overflowX: "hidden",
        }}>
          {navGroups.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              {/* Etiqueta de grupo — solo visible cuando está expandido */}
              {!isCollapsed && (
                <span style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  padding: gi === 0 ? "8px 12px 4px" : "16px 12px 4px",
                }}>
                  {group.label}
                </span>
              )}
              {/* Línea divisora cuando está colapsado (excepto el primero) */}
              {isCollapsed && gi > 0 && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 12px" }} />
              )}
              {group.items.map(({ to, icon: Icon, label, end, badge }) => {
                const badgeCount = badge ? alertBadge : 0
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={isCollapsed ? label : undefined}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      gap: 10,
                      padding: isCollapsed ? "10px 0" : "9px 12px",
                      borderRadius: 10,
                      color: isActive ? "#1E2F45" : "#94a3b8",
                      background: isActive ? "var(--solein-gold)" : "transparent",
                      textDecoration: "none",
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      transition: "all .18s",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      position: "relative",
                    })}
                    onMouseEnter={e => {
                      if (e.currentTarget.getAttribute("aria-current") !== "page") {
                        e.currentTarget.style.background = "#2A3F5A"
                        e.currentTarget.style.color = "#fff"
                      }
                    }}
                    onMouseLeave={e => {
                      const active = e.currentTarget.getAttribute("aria-current") === "page"
                      e.currentTarget.style.background = active ? "var(--solein-gold)" : "transparent"
                      e.currentTarget.style.color = active ? "#1E2F45" : "#94a3b8"
                    }}
                  >
                    {/* Icono con dot rojo en modo colapsado */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Icon size={17} />
                      {isCollapsed && badgeCount > 0 && (
                        <span style={{
                          position: "absolute", top: -4, right: -4,
                          width: 8, height: 8, borderRadius: "50%",
                          background: "var(--solein-red)",
                          border: "1.5px solid var(--solein-navy)",
                        }} />
                      )}
                    </div>

                    {!isCollapsed && (
                      <>
                        <span style={{ flex: 1 }}>{label}</span>
                        {badgeCount > 0 && (
                          <span style={{
                            background: "var(--solein-red)",
                            color: "#fff",
                            borderRadius: 20,
                            padding: "1px 6px",
                            fontSize: 10,
                            fontWeight: 700,
                            minWidth: 18,
                            textAlign: "center",
                            lineHeight: "16px",
                            flexShrink: 0,
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

        {/* Footer: avatar + logout */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          {/* Avatar + info */}
          <NavLink
            to="/perfil"
            title={isCollapsed ? user?.nombre || "Mi perfil" : undefined}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: isCollapsed ? "8px 0" : "8px 10px",
              borderRadius: 10,
              cursor: "pointer",
              transition: "background .18s",
              justifyContent: isCollapsed ? "center" : "flex-start",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#2A3F5A"}
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

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Cerrar sesión" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: 10,
              width: "100%",
              padding: isCollapsed ? "9px 0" : "9px 12px",
              borderRadius: 10,
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 500,
              transition: "all .18s",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#2A3F5A"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b" }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>
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
      }}>
        {children}
      </main>
    </div>
  )
}
