import { NavLink, useNavigate } from "react-router-dom"
import { Home, AlertTriangle, FileDown, Settings, LogOut, Users } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const navItems = [
  { to: "/",              icon: Home,          label: "Panel",         end: true },
  { to: "/alertas",       icon: AlertTriangle, label: "Alertas" },
  { to: "/reportes",      icon: FileDown,      label: "Reportes" },
  { to: "/users",         icon: Users,         label: "Usuarios" },
  { to: "/configuracion", icon: Settings,      label: "Configuración" },
]

/* Logo SVG de Solein — marca "S circuito" */
function SoleinMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="Solein">
      {/* Curva superior — dorada */}
      <path d="M30 9 C30 9 22 8 16 13.5 C10 19 16 24 20 21.5" stroke="#E0B63D" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      {/* Curva inferior — teal */}
      <path d="M20 21.5 C24 19 30 23.5 25 29 C20 34.5 11 33 11 33" stroke="#3F687A" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      {/* Puntos de circuito */}
      <circle cx="30" cy="9"    r="2.8" fill="#E0B63D"/>
      <circle cx="20" cy="21.5" r="2.8" fill="#9B7720"/>
      <circle cx="11" cy="33"   r="2.8" fill="#3F687A"/>
    </svg>
  )
}

const SIDEBAR_W = 220

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=1E2F45&color=E0B63D&bold=true`
    : `https://ui-avatars.com/api/?name=U&background=1E2F45&color=E0B63D&bold=true`

  const sidebarStyle = {
    width: SIDEBAR_W,
    backgroundColor: "#1E2F45",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    height: "100vh",
    zIndex: 100,
    padding: "0 0 20px 0",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--solein-bg)", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={sidebarStyle}>

        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "22px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          marginBottom: 12,
        }}>
          <SoleinMark size={34} />
          <div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px", lineHeight: 1 }}>Solein</span>
            <p style={{ color: "#E0B63D", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", margin: "3px 0 0", textTransform: "uppercase" }}>
              Monitoreo Energético
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 14px",
                borderRadius: 10,
                color: isActive ? "#1E2F45" : "#94a3b8",
                backgroundColor: isActive ? "#E0B63D" : "transparent",
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                transition: "all .18s",
              })}
              onMouseEnter={e => {
                const active = e.currentTarget.getAttribute("aria-current") === "page"
                if (!active) { e.currentTarget.style.backgroundColor = "#2A3F5A"; e.currentTarget.style.color = "#fff" }
              }}
              onMouseLeave={e => {
                const active = e.currentTarget.getAttribute("aria-current") === "page"
                e.currentTarget.style.backgroundColor = active ? "#E0B63D" : "transparent"
                e.currentTarget.style.color = active ? "#1E2F45" : "#94a3b8"
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "12px 12px 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Avatar + nombre */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 6px 10px" }}>
            <img
              src={avatarUrl}
              alt={user?.nombre || "U"}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #E0B63D", flexShrink: 0 }}
            />
            <div style={{ overflow: "hidden" }}>
              <p style={{ color: "#fff", fontSize: 12.5, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.nombre || "Usuario"}
              </p>
              <p style={{ color: "#64748b", fontSize: 11, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email || ""}
              </p>
            </div>
          </div>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "9px 14px",
              borderRadius: 10, background: "transparent",
              border: "none", color: "#64748b",
              cursor: "pointer", fontSize: 13.5, fontWeight: 500,
              transition: "all .18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#2A3F5A"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#64748b" }}
          >
            <LogOut size={17} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, marginLeft: SIDEBAR_W, minHeight: "100vh", backgroundColor: "var(--solein-bg)" }}>
        {children}
      </main>
    </div>
  )
}
