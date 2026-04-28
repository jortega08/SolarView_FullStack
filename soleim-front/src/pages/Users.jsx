import { useState, useEffect } from "react"
import { UserPlus, Trash2, X, Users as UsersIcon, Shield, User } from "lucide-react"
import api from "../services/api"
import { useToast, useConfirm } from "../context/ToastContext"
import usePageTitle from "../hooks/usePageTitle"

const ROL_CONFIG = {
  admin: { label: "Administrador", bg: "var(--btn-navy-bg)", color: "#fff" },
  user:  { label: "Usuario",       bg: "var(--solein-teal-bg)", color: "var(--solein-teal)" },
}

function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5,6].map(i => (
        <td key={i}><div style={{ height: 14, background: "var(--solein-border)", borderRadius: 4, width: i === 1 ? 32 : "80%" }} /></td>
      ))}
    </tr>
  )
}

export default function Users() {
  usePageTitle("Usuarios")
  const toast   = useToast()
  const confirm = useConfirm()

  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [deleting,   setDeleting]   = useState(null)
  const [updatingRol,setUpdatingRol]= useState(null)
  const [search,     setSearch]     = useState("")
  const [formData,   setFormData]   = useState({ nombre: "", email: "", contrasena: "", rol: "user" })
  const [formErr,    setFormErr]    = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await api.getUsers()
      setUsers(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErr("")
    setSubmitting(true)
    try {
      await api.createUser(formData)
      setFormData({ nombre: "", email: "", contrasena: "", rol: "user" })
      setShowForm(false)
      fetchUsers()
      toast("Usuario creado correctamente.", "success")
    } catch {
      setFormErr("Error al crear el usuario. Verifica los datos.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, nombre) => {
    const ok = await confirm({
      title: `¿Eliminar usuario?`,
      message: `Se eliminará a "${nombre}" permanentemente. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      danger: true,
    })
    if (!ok) return
    setDeleting(id)
    try {
      await api.deleteUser(id)
      setUsers(prev => prev.filter(u => u.idusuario !== id))
      toast(`Usuario "${nombre}" eliminado.`, "success")
    } catch {
      toast("No se pudo eliminar el usuario.", "error")
    } finally {
      setDeleting(null)
    }
  }

  const handleRolChange = async (id, nombre, newRol) => {
    setUpdatingRol(id)
    try {
      await api.updateUser(id, { rol: newRol })
      setUsers(prev => prev.map(u => u.idusuario === id ? { ...u, rol: newRol } : u))
      toast(`Rol de "${nombre}" actualizado.`, "success")
    } catch {
      toast("No se pudo actualizar el rol.", "error")
    } finally {
      setUpdatingRol(null)
    }
  }

  const filteredUsers = search.trim()
    ? users.filter(u =>
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  const avatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1E2F45&color=E0B63D&bold=true&size=64`

  return (
    <div style={{ padding: "32px 36px", width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <UsersIcon size={22} color="var(--solein-navy)" />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--solein-navy)", margin: 0, letterSpacing: "-0.3px" }}>
              Gestión de Usuarios
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--solein-text-muted)", margin: 0 }}>
            {loading ? "Cargando..." : `${filteredUsers.length}${search ? ` de ${users.length}` : ""} usuario${users.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormErr("") }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: showForm ? "var(--solein-bg)" : "var(--btn-navy-bg)",
            color: showForm ? "var(--solein-text-muted)" : "#fff",
            border: showForm ? "1px solid var(--solein-border)" : "none",
            borderRadius: "var(--radius-md)", padding: "9px 16px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all .2s", fontFamily: "inherit",
          }}
          onMouseEnter={e => { if (!showForm) e.currentTarget.style.background = "var(--btn-navy-hover)" }}
          onMouseLeave={e => { if (!showForm) e.currentTarget.style.background = "var(--btn-navy-bg)" }}
        >
          {showForm ? <><X size={15}/> Cancelar</> : <><UserPlus size={15}/> Nuevo usuario</>}
        </button>
      </div>

      {/* Buscador */}
      {!loading && users.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: "1px solid var(--solein-border)", borderRadius: "var(--radius-md)",
              padding: "8px 14px", fontSize: 13, fontFamily: "inherit",
              color: "var(--solein-navy)", background: "var(--solein-white)",
              outline: "none", width: 280, transition: "border-color .2s",
            }}
            onFocus={e => e.target.style.borderColor = "var(--solein-teal)"}
            onBlur={e => e.target.style.borderColor = "var(--solein-border)"}
          />
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{
          background: "var(--solein-white)", border: "1px solid var(--solein-border)",
          borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 24,
          boxShadow: "var(--shadow-sm)",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--solein-navy)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={16} color="var(--solein-teal)" /> Crear nuevo usuario
          </h2>

          {formErr && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "var(--solein-red)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
              {formErr}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            {[
              { label: "Nombre completo", name: "nombre", type: "text",     placeholder: "Ej. Ana García" },
              { label: "Correo electrónico", name: "email", type: "email",  placeholder: "ana@empresa.com" },
              { label: "Contraseña",    name: "contrasena", type: "password", placeholder: "Mínimo 8 caracteres" },
            ].map(f => (
              <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--solein-text-muted)", textTransform: "uppercase", letterSpacing: ".4px" }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={formData[f.name]}
                  onChange={e => setFormData(p => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  required
                  minLength={f.name === "contrasena" ? 8 : undefined}
                  style={{
                    border: "1.5px solid var(--solein-border)", borderRadius: "var(--radius-md)",
                    padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
                    color: "var(--solein-navy)", outline: "none", background: "var(--solein-bg)",
                    transition: "border-color .2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--solein-teal)"}
                  onBlur={e => e.target.style.borderColor = "var(--solein-border)"}
                />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--solein-text-muted)", textTransform: "uppercase", letterSpacing: ".4px" }}>
                Rol
              </label>
              <select
                value={formData.rol}
                onChange={e => setFormData(p => ({ ...p, rol: e.target.value }))}
                style={{
                  border: "1.5px solid var(--solein-border)", borderRadius: "var(--radius-md)",
                  padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
                  color: "var(--solein-navy)", outline: "none", background: "var(--solein-bg)", cursor: "pointer",
                }}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--btn-navy-bg)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-md)", padding: "10px 20px",
                  fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? .7 : 1, fontFamily: "inherit",
                }}
              >
                {submitting ? "Creando..." : <><UserPlus size={15}/> Crear usuario</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--solein-white)", border: "1px solid var(--solein-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--solein-bg)", borderBottom: "1px solid var(--solein-border)" }}>
              {["Usuario", "Email", "Rol", "Fecha de registro", "Acciones"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--solein-text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--solein-text-muted)" }}>
                    <User size={36} strokeWidth={1.5} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No hay usuarios registrados</p>
                    <p style={{ margin: 0, fontSize: 12 }}>Crea el primero con el botón "Nuevo usuario"</p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "32px 20px", textAlign: "center", color: "var(--solein-text-muted)", fontSize: 13 }}>
                  Sin resultados para <strong>"{search}"</strong>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const rol = ROL_CONFIG[u.rol] || ROL_CONFIG.user
                return (
                  <tr
                    key={u.idusuario}
                    style={{
                      borderBottom: idx < filteredUsers.length - 1 ? "1px solid var(--solein-border)" : "none",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--solein-bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Avatar + nombre */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={avatarUrl(u.nombre)}
                          alt={u.nombre}
                          style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--solein-navy)" }}>{u.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--solein-text-muted)" }}>{u.email}</td>
                    {/* Rol — selector inline */}
                    <td style={{ padding: "14px 16px" }}>
                      <select
                        value={u.rol}
                        disabled={updatingRol === u.idusuario}
                        onChange={e => handleRolChange(u.idusuario, u.nombre, e.target.value)}
                        style={{
                          background: rol.bg, color: rol.color,
                          border: `1px solid ${u.rol === "admin" ? "var(--btn-navy-bg)" : "var(--solein-teal)"}`,
                          borderRadius: 20, padding: "3px 10px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          fontFamily: "inherit", outline: "none",
                          opacity: updatingRol === u.idusuario ? .6 : 1,
                        }}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--solein-text-muted)" }}>
                      {new Date(u.fecha_registro).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => handleDelete(u.idusuario, u.nombre)}
                        disabled={deleting === u.idusuario}
                        title="Eliminar usuario"
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "transparent", border: "1px solid var(--solein-border)",
                          borderRadius: "var(--radius-sm)", padding: "6px 10px",
                          fontSize: 12, color: "var(--solein-text-muted)",
                          cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "var(--solein-red)"; e.currentTarget.style.borderColor = "#fecaca" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--solein-text-muted)"; e.currentTarget.style.borderColor = "var(--solein-border)" }}
                      >
                        <Trash2 size={13} />
                        {deleting === u.idusuario ? "Eliminando..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
