import { NavLink, useNavigate } from "react-router-dom"
import { Home, AlertTriangle, FileDown, Settings, LogOut, Users, Building2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import "../styles/Sidebar.css"

const navItems = [
  { to: "/",             icon: Home,           label: "Panel",        end: true },
  { to: "/alertas",      icon: AlertTriangle,  label: "Alertas" },
  { to: "/reportes",     icon: FileDown,       label: "Reportes" },
  { to: "/users",        icon: Users,          label: "Usuarios" },
  { to: "/mi-empresa",   icon: Building2,      label: "Mi empresa", requiresPrestador: true },
  { to: "/equipo",       icon: Users,          label: "Equipo", requiresPrestador: true },
  { to: "/configuracion",icon: Settings,       label: "Configuración" },
]

const Sidebar = () => {
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
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-avatar">
          <img src={avatarUrl} alt={user?.nombre || "Usuario"} />
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems
          .filter(item => !item.requiresPrestador || user?.prestador_id || user?.es_admin_prestador)
          .map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            title={label}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={20} />
        </button>
        <span className="version">2</span>
      </div>
    </div>
  )
}

export default Sidebar
