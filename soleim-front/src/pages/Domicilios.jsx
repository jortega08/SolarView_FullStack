import { useState, useEffect } from "react"
import { MapPin, Plus, Trash2, X, User, Globe, ChevronDown } from "lucide-react"
import api from "../services/api"
import { useToast, useConfirm } from "../context/ToastContext"
import usePageTitle from "../hooks/usePageTitle"

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: i === 1 ? "60%" : "75%", animation: "pulse 1.5s infinite" }} />
        </td>
      ))}
    </tr>
  )
}

function SelectField({ label, value, onChange, disabled, children, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--solein-text-muted)", textTransform: "uppercase", letterSpacing: ".4px" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required
          style={{
            width: "100%",
            border: "1.5px solid var(--solein-border)", borderRadius: "var(--radius-md)",
            padding: "9px 32px 9px 12px", fontSize: 14, fontFamily: "inherit",
            color: value ? "var(--solein-navy)" : "var(--solein-text-muted)",
            outline: "none", background: disabled ? "#f8fafc" : "var(--solein-bg)",
            cursor: disabled ? "not-allowed" : "pointer",
            appearance: "none", transition: "border-color .2s",
          }}
          onFocus={e => !disabled && (e.target.style.borderColor = "var(--solein-teal)")}
          onBlur={e => (e.target.style.borderColor = "var(--solein-border)")}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown
          size={14}
          color="var(--solein-text-muted)"
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
      </div>
    </div>
  )
}

export default function Domicilios() {
  usePageTitle("Domicilios")
  const toast   = useToast()
  const confirm = useConfirm()

  const [domicilios, setDomicilios] = useState([])
  const [users,      setUsers]      = useState([])
  const [paises,     setPaises]     = useState([])
  const [estados,    setEstados]    = useState([])
  const [ciudades,   setCiudades]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [deleting,   setDeleting]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData,   setFormData]   = useState({ usuario_id: "", pais_id: "", estado_id: "", ciudad_id: "" })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [domData, usersData, paisesData] = await Promise.all([
        api.getDomicilios(),
        api.getUsers(),
        api.getPaises(),
      ])
      setDomicilios(Array.isArray(domData)   ? domData   : domData.results   ?? [])
      setUsers(     Array.isArray(usersData) ? usersData : usersData.results ?? [])
      setPaises(    Array.isArray(paisesData)? paisesData: paisesData.results ?? [])
    } catch {
      toast("Error al cargar los datos.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handlePaisChange = async (paisId) => {
    setFormData(p => ({ ...p, pais_id: paisId, estado_id: "", ciudad_id: "" }))
    setEstados([])
    setCiudades([])
    if (!paisId) return
    try {
      const data = await api.getEstados(paisId)
      setEstados(Array.isArray(data) ? data : data.results ?? [])
    } catch { toast("Error al cargar departamentos.", "error") }
  }

  const handleEstadoChange = async (estadoId) => {
    setFormData(p => ({ ...p, estado_id: estadoId, ciudad_id: "" }))
    setCiudades([])
    if (!estadoId) return
    try {
      const data = await api.getCiudades(estadoId)
      setCiudades(Array.isArray(data) ? data : data.results ?? [])
    } catch { toast("Error al cargar ciudades.", "error") }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.createDomicilio({ usuario_id: formData.usuario_id, ciudad_id: formData.ciudad_id })
      setFormData({ usuario_id: "", pais_id: "", estado_id: "", ciudad_id: "" })
      setEstados([])
      setCiudades([])
      setShowForm(false)
      toast("Domicilio registrado correctamente.", "success")
      fetchData()
    } catch {
      toast("Error al crear el domicilio. Verifica los datos.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, nombre) => {
    const ok = await confirm({
      title: "¿Eliminar domicilio?",
      message: `Se eliminará el domicilio de "${nombre}". Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      danger: true,
    })
    if (!ok) return
    setDeleting(id)
    try {
      await api.deleteDomicilio(id)
      setDomicilios(prev => prev.filter(d => d.iddomicilio !== id))
      toast("Domicilio eliminado.", "success")
    } catch {
      toast("No se pudo eliminar el domicilio.", "error")
    } finally {
      setDeleting(null)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setFormData({ usuario_id: "", pais_id: "", estado_id: "", ciudad_id: "" })
    setEstados([])
    setCiudades([])
  }

  return (
    <div style={{ padding: "32px 36px", width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <MapPin size={22} color="var(--solein-navy)" />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--solein-navy)", margin: 0, letterSpacing: "-0.3px" }}>
              Gestión de Domicilios
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--solein-text-muted)", margin: 0 }}>
            {loading ? "Cargando..." : `${domicilios.length} domicilio${domicilios.length !== 1 ? "s" : ""} registrado${domicilios.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => showForm ? cancelForm() : setShowForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: showForm ? "var(--solein-bg)" : "var(--solein-navy)",
            color: showForm ? "var(--solein-text-muted)" : "#fff",
            border: showForm ? "1px solid var(--solein-border)" : "none",
            borderRadius: "var(--radius-md)", padding: "9px 16px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all .2s", fontFamily: "inherit",
          }}
        >
          {showForm ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Nuevo domicilio</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: "var(--solein-white)", border: "1px solid var(--solein-border)",
          borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 24,
          boxShadow: "var(--shadow-sm)",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--solein-navy)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={16} color="var(--solein-teal)" /> Registrar nuevo domicilio
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            {/* Usuario */}
            <div style={{ gridColumn: "1 / -1" }}>
              <SelectField
                label="Usuario"
                value={formData.usuario_id}
                onChange={e => setFormData(p => ({ ...p, usuario_id: e.target.value }))}
                placeholder="Seleccionar usuario"
              >
                {users.map(u => (
                  <option key={u.idusuario} value={u.idusuario}>
                    {u.nombre} — {u.email}
                  </option>
                ))}
              </SelectField>
            </div>

            {/* País */}
            <SelectField
              label="País"
              value={formData.pais_id}
              onChange={e => handlePaisChange(e.target.value)}
              placeholder="Seleccionar país"
            >
              {paises.map(p => (
                <option key={p.idpais} value={p.idpais}>{p.nombre}</option>
              ))}
            </SelectField>

            {/* Departamento / Estado */}
            <SelectField
              label="Departamento / Estado"
              value={formData.estado_id}
              onChange={e => handleEstadoChange(e.target.value)}
              disabled={!formData.pais_id}
              placeholder={formData.pais_id ? "Seleccionar departamento" : "Selecciona un país primero"}
            >
              {estados.map(e => (
                <option key={e.idestado} value={e.idestado}>{e.nombre}</option>
              ))}
            </SelectField>

            {/* Ciudad */}
            <div style={{ gridColumn: "1 / -1" }}>
              <SelectField
                label="Ciudad"
                value={formData.ciudad_id}
                onChange={e => setFormData(p => ({ ...p, ciudad_id: e.target.value }))}
                disabled={!formData.estado_id}
                placeholder={formData.estado_id ? "Seleccionar ciudad" : "Selecciona un departamento primero"}
              >
                {ciudades.map(c => (
                  <option key={c.idciudad} value={c.idciudad}>{c.nombre}</option>
                ))}
              </SelectField>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
              <button
                type="submit"
                disabled={submitting || !formData.ciudad_id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--solein-navy)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-md)", padding: "10px 20px",
                  fontSize: 14, fontWeight: 600,
                  cursor: (submitting || !formData.ciudad_id) ? "not-allowed" : "pointer",
                  opacity: (submitting || !formData.ciudad_id) ? .65 : 1,
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "Guardando..." : <><MapPin size={15} /> Registrar domicilio</>}
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
              {["Usuario", "Email", "Ciudad", "Departamento / País", "Acciones"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--solein-text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : domicilios.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--solein-text-muted)" }}>
                    <Globe size={36} strokeWidth={1.5} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No hay domicilios registrados</p>
                    <p style={{ margin: 0, fontSize: 12 }}>Crea el primero con el botón "Nuevo domicilio"</p>
                  </div>
                </td>
              </tr>
            ) : (
              domicilios.map((d, idx) => (
                <tr
                  key={d.iddomicilio}
                  style={{
                    borderBottom: idx < domicilios.length - 1 ? "1px solid var(--solein-border)" : "none",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--solein-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Usuario */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--solein-teal-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={15} color="var(--solein-teal)" />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--solein-navy)" }}>
                        {d.usuario?.nombre || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--solein-text-muted)" }}>
                    {d.usuario?.email || "—"}
                  </td>

                  {/* Ciudad */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={13} color="var(--solein-teal)" />
                      <span style={{ fontSize: 13, color: "var(--solein-navy)", fontWeight: 500 }}>
                        {d.ciudad?.nombre || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Departamento / País */}
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--solein-text-muted)" }}>
                    {[d.ciudad?.estado?.nombre, d.ciudad?.estado?.pais?.nombre].filter(Boolean).join(" · ") || "—"}
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => handleDelete(d.iddomicilio, d.usuario?.nombre)}
                      disabled={deleting === d.iddomicilio}
                      title="Eliminar domicilio"
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
                      {deleting === d.iddomicilio ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
