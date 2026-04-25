import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2, Zap, AlertTriangle, Wrench,
  Battery, TrendingUp, ChevronRight, RefreshCw,
  CheckCircle, AlertCircle, Clock
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { fetchPanelEmpresa } from "../services/api"
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [panel, setPanel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await fetchPanelEmpresa()
      setPanel(data)
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

  const empresa = panel?.empresa
  const instalaciones = panel?.instalaciones || []
  const resumen = panel?.resumen || { total: 0, con_alerta_critica: 0, en_mantenimiento: 0 }

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
        <button
          className={`refresh-btn${refreshing ? " spinning" : ""}`}
          onClick={() => load(true)}
          title="Actualizar"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="b2b-error">{error}</div>}

      {/* KPI cards */}
      <div className="b2b-kpis">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#eff6ff" }}>
            <Building2 size={22} color="#3b82f6" />
          </div>
          <div>
            <p className="kpi-value">{resumen.total}</p>
            <p className="kpi-label">Instalaciones</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: instalaciones.filter(i => i.estado === "activo").length > 0 ? "#f0fdf4" : "#f8fafc" }}>
            <Zap size={22} color="#16a34a" />
          </div>
          <div>
            <p className="kpi-value">{instalaciones.filter(i => i.estado === "activo").length}</p>
            <p className="kpi-label">Activas</p>
          </div>
        </div>
        <div className="kpi-card" style={{ borderColor: resumen.con_alerta_critica > 0 ? "#fecaca" : undefined }}>
          <div className="kpi-icon" style={{ background: resumen.con_alerta_critica > 0 ? "#fef2f2" : "#f8fafc" }}>
            <AlertTriangle size={22} color={resumen.con_alerta_critica > 0 ? "#dc2626" : "#94a3b8"} />
          </div>
          <div>
            <p className="kpi-value" style={{ color: resumen.con_alerta_critica > 0 ? "#dc2626" : undefined }}>
              {resumen.con_alerta_critica}
            </p>
            <p className="kpi-label">Con alertas críticas</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "#fffbeb" }}>
            <Wrench size={22} color="#d97706" />
          </div>
          <div>
            <p className="kpi-value">{resumen.en_mantenimiento}</p>
            <p className="kpi-label">En mantenimiento</p>
          </div>
        </div>
      </div>

      {/* Instalaciones grid */}
      <div className="b2b-section-header">
        <h2 className="b2b-section-title">
          <TrendingUp size={18} />
          Instalaciones
        </h2>
        <span className="b2b-count">{instalaciones.length}</span>
      </div>

      {instalaciones.length === 0 ? (
        <div className="b2b-empty">
          <Building2 size={40} color="#cbd5e1" />
          <p>No hay instalaciones asignadas a tu cuenta.</p>
        </div>
      ) : (
        <div className="inst-grid">
          {instalaciones.map(inst => (
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
