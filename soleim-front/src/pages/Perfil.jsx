import { useAuth } from "../context/AuthContext"
import { Shield, Mail, User, Calendar, Building2, Key } from "lucide-react"
import usePageTitle from "../hooks/usePageTitle"

const ROL_CONFIG = {
  admin:        { label: "Super Admin",            bg: "var(--solein-navy)",    color: "#fff" },
  admin_empresa:{ label: "Administrador Empresa",  bg: "var(--solein-teal-bg)", color: "var(--solein-teal)" },
  operador:     { label: "Operador",               bg: "var(--solein-gold-bg)", color: "var(--solein-gold-dark)" },
  viewer:       { label: "Visor",                  bg: "var(--solein-bg)",      color: "var(--solein-text-muted)" },
  user:         { label: "Usuario",                bg: "var(--solein-teal-bg)", color: "var(--solein-teal)" },
}

function InfoBlock({ icon: Icon, label, value, accent = false }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: "16px 20px",
      background: "var(--solein-white)",
      border: "1px solid var(--solein-border)",
      borderRadius: "var(--radius-lg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Icon size={14} color="var(--solein-text-muted)" />
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--solein-text-muted)", textTransform: "uppercase", letterSpacing: ".4px" }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: 15,
        fontWeight: 600,
        color: accent ? "var(--solein-teal)" : "var(--solein-navy)",
        wordBreak: "break-all",
      }}>
        {value || "—"}
      </span>
    </div>
  )
}

export default function Perfil() {
  usePageTitle("Mi perfil")
  const { user } = useAuth()
  const rol = ROL_CONFIG[user?.rol] || ROL_CONFIG.user

  const avatarUrl = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=1E2F45&color=E0B63D&bold=true&size=128`
    : `https://ui-avatars.com/api/?name=U&background=1E2F45&color=E0B63D&bold=true&size=128`

  const fechaRegistro = user?.fecha_registro
    ? new Date(user.fecha_registro).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
    : "—"

  return (
    <div style={{ padding: "32px 36px", width: "100%" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--solein-navy)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
          Mi perfil
        </h1>
        <p style={{ fontSize: 13, color: "var(--solein-text-muted)", margin: 0 }}>
          Información de tu cuenta en Solein
        </p>
      </div>

      {/* Layout: card principal a la izquierda, datos a la derecha */}
      <div className="perfil-grid" style={{
        display: "grid",
        gridTemplateColumns: "340px 1fr",
        gap: 20,
        alignItems: "start",
      }}>

        {/* Columna izquierda: card de identidad */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Card principal */}
          <div style={{
            background: "var(--solein-white)",
            border: "1px solid var(--solein-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            {/* Banner */}
            <div style={{
              height: 96,
              background: "linear-gradient(135deg, var(--solein-navy) 0%, #2A3F5A 60%, #3F687A 100%)",
            }} />

            {/* Avatar + info básica */}
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 16 }}>
                <img
                  src={avatarUrl}
                  alt={user?.nombre}
                  style={{
                    width: 80, height: 80,
                    borderRadius: "50%",
                    border: "4px solid var(--solein-white)",
                    marginTop: -40,
                    background: "var(--solein-white)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ paddingBottom: 4 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--solein-navy)", margin: "0 0 6px", letterSpacing: "-0.3px" }}>
                    {user?.nombre || "Usuario"}
                  </h2>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: rol.bg, color: rol.color,
                    borderRadius: 20, padding: "3px 10px",
                    fontSize: 11, fontWeight: 700,
                  }}>
                    <Shield size={11} />
                    {rol.label}
                  </span>
                </div>
              </div>

              {/* Email debajo del avatar */}
              <p style={{ margin: 0, fontSize: 13, color: "var(--solein-text-muted)", wordBreak: "break-all" }}>
                {user?.email || "—"}
              </p>
            </div>
          </div>

          {/* Sesión activa */}
          <div style={{
            background: "var(--solein-white)",
            border: "1px solid var(--solein-border)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--solein-green)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--solein-navy)" }}>Sesión activa</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--solein-text-muted)", margin: "0 0 4px" }}>
              Has iniciado sesión correctamente en Solein.
            </p>
            <p style={{ fontSize: 11, color: "var(--solein-text-muted)", margin: 0 }}>
              La sesión expira automáticamente tras 1 hora de inactividad.
            </p>
          </div>
        </div>

        {/* Columna derecha: bloques de información */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Grid de datos */}
          <div style={{
            background: "var(--solein-white)",
            border: "1px solid var(--solein-border)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--solein-navy)", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
              <User size={15} color="var(--solein-teal)" />
              Datos de la cuenta
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}>
              <InfoBlock icon={User}      label="Nombre completo" value={user?.nombre} />
              <InfoBlock icon={Mail}      label="Correo electrónico" value={user?.email} accent />
              <InfoBlock icon={Shield}    label="Rol" value={rol.label} />
              <InfoBlock icon={Calendar}  label="Miembro desde" value={fechaRegistro} />
              {user?.idusuario && (
                <InfoBlock icon={Building2} label="ID de usuario" value={`#${user.idusuario}`} />
              )}
            </div>
          </div>

          {/* Nota de edición */}
          <div style={{
            background: "var(--solein-bg)",
            border: "1px solid var(--solein-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            fontSize: 12,
            color: "var(--solein-text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <Key size={13} color="var(--solein-gold-dark)" />
            Para modificar tu información contacta al administrador de tu empresa.
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 860px) {
          .perfil-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
