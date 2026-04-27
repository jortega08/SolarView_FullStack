import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2, Zap, AlertTriangle, Wrench,
  Battery, TrendingUp, ChevronRight, RefreshCw,
  CheckCircle, AlertCircle, Clock, Search
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { fetchPanelEmpresa } from "../services/api"
import usePageTitle from "../hooks/usePageTitle"
import "../styles/Dashboard.css"

const RIESGO_CONFIG = {
  alto:  { label: "Riesgo alto",  bg: "#fef2f2", color: "#dc2626", dot: "#dc2626" },
  medio: { label: "Riesgo medio", bg: "#fffbeb", color: "#d97706", dot: "#d97706" },
  bajo:  { label: "Operando bien",bg: "#f0fdf4", color: "#16a34a", dot: "#16a34a" },
}

const ESTADO_CONFIG = {
  activo:        { label: "Activo",        icon: CheckCircle, color: "#16a34a" },
  mantenimiento: { label: "Mantenimiento", icon: Wrench,       color: "#d97706" },
  inactivo:      { label: "Inactivo",      icon: AlertCircle,  color: "#9ca3af" },
}

function BatteryBar({ pct }) {
  const color = pct === null ? "#9ca3af" : pct < 20 ? "#dc2626" : pct < 50 ? "#d97706" : "#16a34a"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct ?? 0}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 34, textAlign: "right" }}>
        {pct !== null ? `${pct}%` : "—"}
      </span>
    </div>
  )
}

function InstalacionCard({ inst, onClick }) {
  const riesgo = RIESGO_CONFIG[inst.riesgo] || RIESGO_CONFIG.bajo
  const estado = ESTADO_CONFIG[inst.estado] || ESTADO_CONFIG.inactivo
  const EstadoIcon = estado.icon

  const timeAgo = inst.ultimo_registro
    ? (() => {
        const diff = Math.floor((Date.now() - new Date(inst.ultimo_registro)) / 60000)
        if (diff < 1) return "Ahora mismo"
        if (diff < 60) return `Hace ${diff} min`
        if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
        return `Hace ${Math.floor(diff / 1440)}d`
      })()
    : "Sin datos"

  return (
    <div className="inst-card" onClick={onClick}>
      <div className="inst-card-header">
        <div>
          <h3 className="inst-name">{inst.nombre}</h3>
          <div className="inst-estado">
            <EstadoIcon size={13} color={estado.color} />
            <span style={{ color: estado.color }}>{estado.label}</span>
          </div>
        </div>
        <div className="inst-riesgo-badge" style={{ background: riesgo.bg, color: riesgo.color }}>
          <span className="riesgo-dot" style={{ background: riesgo.dot }} />
          {riesgo.label}
        </div>
      </div>

      <div className="inst-battery-section">
        <span className="inst-label">Batería</span>
        <BatteryBar pct={inst.bateria_pct} />
      </div>

      {inst.alertas_criticas > 0 && (
        <div className="inst-alert-row">
          <AlertTriangle size={14} color="#dc2626" />
          <span>{inst.alertas_criticas} alerta{inst.alertas_criticas > 1 ? "s" : ""} crítica{inst.alertas_criticas > 1 ? "s" : ""}</span>
        </div>
      )}

      <div className="inst-footer">
        <div className="inst-time">
          <Clock size={12} />
          <span>{timeAgo}</span>
        </div>
        <ChevronRight size={16} color="#94a3b8" />
      </div>
    </div>
  )
}

const Dashboard = () => {
  usePageTitle("Panel")
  const { user } = useAuth()
  const navigate = useNavigate()
  const [panel,       setPanel]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [search,      setSearch]      = useState("")
  const [sortBy,      setSortBy]      = useState("riesgo")

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await fetchPanelEmpresa()
      setPanel(data)
      setLastUpdated(new Date())
      setError(null)
    } catch {
      setError("No se pudo cargar el panel. Verifica la conexión.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(() => load(true), 30000)
    return () => clearInterval(iv)
  }, [load])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Cargando panel...</p>
      </div>
    )
  }

  const empresa     = panel?.empresa
  const instalaciones = panel?.instalaciones || []
  const resumen     = panel?.resumen || { total: 0, con_alerta_critica: 0, en_mantenimiento: 0 }

  const RIESGO_ORDER = { alto: 0, medio: 1, bajo: 2 }

  const filtradas = (() => {
    let list = search.trim()
      ? instalaciones.filter(i => i.nombre.toLowerCase().includes(search.toLowerCase()))
      : [...instalaciones]

    switch (sortBy) {
      case "riesgo":   list.sort((a, b) => (RIESGO_ORDER[a.riesgo] ?? 2) - (RIESGO_ORDER[b.riesgo] ?? 2)); break
      case "bateria":  list.sort((a, b) => (a.bateria_pct ?? 101) - (b.bateria_pct ?? 101)); break
      case "nombre":   list.sort((a, b) => a.nombre.localeCompare(b.nombre)); break
      case "alertas":  list.sort((a, b) => (b.alertas_criticas ?? 0) - (a.alertas_criticas ?? 0)); break
    }
    return list
  })()

  const updatedLabel = (() => {
    if (!lastUpdated) return null
    const diff = Math.floor((Date.now() - lastUpdated) / 60000)
    if (diff < 1) return "Actualizado ahora"
    if (diff === 1) return "Actualizado hace 1 min"
    return `Actualizado hace ${diff} min`
  })()

  return (
    <div className="b2b-panel">
      {/* Header */}
      <div className="b2b-header">
        <div>
          <h1 className="b2b-title">
            {empresa ? empresa.nombre : "Panel Empresa"}
          </h1>
          <p className="b2b-subtitle">
            Bienvenido, {user?.nombre} · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {updatedLabel && (
            <span style={{ fontSize: 12, color: "var(--solein-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={12} />
              {updatedLabel}
            </span>
          )}
          <button
            className={`refresh-btn${refreshing ? " spinning" : ""}`}
            onClick={() => load(true)}
            title="Actualizar"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && <div className="b2b-error">{error}</div>}

      {/* KPI cards */}
      <div className="b2b-kpis">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "var(--solein-teal-bg)" }}>
            <Building2 size={22} color="var(--solein-teal)" />
          </div>
          <div>
            <p className="kpi-value">{resumen.total}</p>
            <p className="kpi-label">Instalaciones</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#f0fdf4" }}>
            <Zap size={22} color="#16a34a" />
          </div>
          <div>
            <p className="kpi-value">{instalaciones.filter(i => i.estado === "activo").length}</p>
            <p className="kpi-label">Activas</p>
          </div>
        </div>
        <div className="kpi-card" style={{ borderColor: resumen.con_alerta_critica > 0 ? "#fecaca" : undefined }}>
          <div className="kpi-icon" style={{ background: resumen.con_alerta_critica > 0 ? "#fef2f2" : "var(--solein-bg)" }}>
            <AlertTriangle size={22} color={resumen.con_alerta_critica > 0 ? "var(--solein-red)" : "#94a3b8"} />
          </div>
          <div>
            <p className="kpi-value" style={{ color: resumen.con_alerta_critica > 0 ? "var(--solein-red)" : undefined }}>
              {resumen.con_alerta_critica}
            </p>
            <p className="kpi-label">Con alertas críticas</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "var(--solein-gold-bg)" }}>
            <Wrench size={22} color="var(--solein-gold-dark)" />
          </div>
          <div>
            <p className="kpi-value">{resumen.en_mantenimiento}</p>
            <p className="kpi-label">En mantenimiento</p>
          </div>
        </div>
      </div>

      {/* Instalaciones: header + búsqueda */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div className="b2b-section-header" style={{ margin: 0 }}>
          <h2 className="b2b-section-title">
            <TrendingUp size={18} />
            Instalaciones
          </h2>
          <span className="b2b-count">{filtradas.length}{search && instalaciones.length !== filtradas.length ? ` de ${instalaciones.length}` : ""}</span>
        </div>

        {instalaciones.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {/* Ordenamiento */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                border: "1px solid var(--solein-border)", borderRadius: "var(--radius-md)",
                padding: "7px 10px", fontSize: 13, fontFamily: "inherit",
                color: "var(--solein-navy)", background: "var(--solein-white)",
                outline: "none", cursor: "pointer",
              }}
            >
              <option value="riesgo">Ordenar: Riesgo</option>
              <option value="bateria">Ordenar: Batería ↑</option>
              <option value="alertas">Ordenar: Alertas ↓</option>
              <option value="nombre">Ordenar: Nombre A-Z</option>
            </select>

            {/* Búsqueda */}
            <div style={{ position: "relative" }}>
            <Search size={14} color="var(--solein-text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Buscar instalación…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: "1px solid var(--solein-border)", borderRadius: "var(--radius-md)",
                padding: "7px 12px 7px 30px", fontSize: 13,
                fontFamily: "inherit", color: "var(--solein-navy)",
                background: "var(--solein-white)", outline: "none",
                width: 200, transition: "border-color .2s",
              }}
              onFocus={e => e.target.style.borderColor = "var(--solein-teal)"}
              onBlur={e => e.target.style.borderColor = "var(--solein-border)"}
            />
            </div>
          </div>
        )}
      </div>

      {instalaciones.length === 0 ? (
        <div className="b2b-empty">
          <Building2 size={40} color="#cbd5e1" />
          <p>No hay instalaciones asignadas a tu cuenta.</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="b2b-empty">
          <Search size={36} color="#cbd5e1" />
          <p>Sin resultados para <strong>"{search}"</strong></p>
        </div>
      ) : (
        <div className="inst-grid">
          {filtradas.map(inst => (
            <InstalacionCard
              key={inst.id}
              inst={inst}
              onClick={() => navigate(`/instalacion/${inst.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
