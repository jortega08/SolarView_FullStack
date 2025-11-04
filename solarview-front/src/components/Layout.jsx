import { Link, useLocation } from "react-router-dom"
import { Home, Users, MapPin, Bell, BarChart3, Calendar, FileText, MessageSquare, Award, LogOut } from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Usuarios' },
    { path: '/domicilios', icon: MapPin, label: 'Domicilios' },
    { path: '/alertas', icon: Bell, label: 'Alertas' },
  ]

  const bottomItems = [
    { icon: BarChart3, label: 'Estadísticas' },
    { icon: Calendar, label: 'Calendario' },
    { icon: FileText, label: 'Documentos' },
    { icon: MessageSquare, label: 'Mensajes' },
    { icon: Award, label: 'Logros' },
    { icon: LogOut, label: 'Salir' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        backgroundColor: '#1e293b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 1000
      }}>
        {/* Header con perfil */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #3b82f6',
              flexShrink: 0,
              backgroundColor: '#334155'
            }}>
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" 
                alt="User"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ 
              minWidth: 0,
              flex: 1
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '16px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Admin
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '13px',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Administrador
              </p>
            </div>
          </div>
        </div>

        {/* Navegación principal */}
        <nav style={{
          flex: 1,
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link 
                key={item.path} 
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  color: active ? 'white' : '#94a3b8',
                  backgroundColor: active ? '#3b82f6' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontSize: '15px',
                  fontWeight: active ? '500' : '400',
                  borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#94a3b8'
                  }
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer con iconos */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {bottomItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  title={item.label}
                  onClick={() => console.log(`Clicked: ${item.label}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#94a3b8'
                  }}
                >
                  <Icon size={20} />
                </button>
              )
            })}
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            v1.2.4
          </div>
        </div>
      </aside>

      {/* Contenido principal - aquí se renderiza el children */}
      <main style={{
        flex: 1,
        marginLeft: '280px',
        width: 'calc(100% - 280px)',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        {children}
      </main>
    </div>
  )
}