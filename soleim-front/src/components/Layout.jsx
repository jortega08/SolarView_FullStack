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

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=1a1d3f&color=fff`
    : "https://ui-avatars.com/api/?name=U&background=1a1d3f&color=fff"

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 72,
        backgroundColor: "#1e293b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "fixed",
        height: "100vh",
        zIndex: 100,
        padding: "20px 0",
      }}>
        {/* Avatar */}
        <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", marginBottom: 28, flexShrink: 0 }}>
          <img src={avatarUrl} alt={user?.nombre || "U"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, width: "100%", padding: "0 12px" }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: 12,
                color: isActive ? "#fff" : "#94a3b8",
                backgroundColor: isActive ? "#f87171" : "transparent",
                textDecoration: "none",
                transition: "all .2s",
                margin: "0 auto",
              })}
              onMouseEnter={e => { if (!e.currentTarget.classList.contains("active")) e.currentTarget.style.backgroundColor = "#334155"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={e => { const a = e.currentTarget.getAttribute("aria-current") === "page"; e.currentTarget.style.backgroundColor = a ? "#f87171" : "transparent"; e.currentTarget.style.color = a ? "#fff" : "#94a3b8" }}
            >
              <Icon size={20} />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button
            title="Cerrar sesión"
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 48, height: 48, borderRadius: 12,
              background: "transparent", border: "none",
              color: "#94a3b8", cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#334155"; e.currentTarget.style.color = "#fff" }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8" }}
          >
            <LogOut size={20} />
          </button>
          <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>v2</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 72, minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
        {children}
      </main>
    </div>
  )
}
