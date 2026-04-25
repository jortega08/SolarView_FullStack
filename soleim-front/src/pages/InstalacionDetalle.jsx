import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Battery, Zap, DollarSign, Thermometer,
  AlertTriangle, CheckCircle, Clock, RefreshCw, Activity,
  Sun, PlugZap
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { fetchDetalleInstalacion, fetchTendencia, resolverAlerta } from "../services/api"
import "../styles/InstalacionDetalle.css"

const SEVERIDAD_CONFIG = {
  critica: { color: "#dc2626", bg: "#fef2f2", label: "Crítica" },
  alta:    { color: "#ea580c", bg: "#fff7ed", label: "Alta" },
  media:   { color: "#d97706", bg: "#fffbeb", label: "Media" },
  baja:    { color: "#65a30d", bg: "#f7fee7", label: "Baja" },
}

const TIPO_CONFIG = {
  hibrido:   { label: "Híbrido",   color: "#8b5cf6" },
  off_grid:  { label: "Off-grid",  color: "#0891b2" },
  grid_tie:  { label: "Grid-tie",  color: "#059669" },
}

const ESTADO_CONFIG = {
  activo:        { label: "Activo",        color: "#16a34a", bg: "#f0fdf4" },
  mantenimiento: { label: "Mantenimiento", color: "#d97706", bg: "#fffbeb" },
  inactivo:      { label: "Inactivo",      color: "#9ca3af", bg: "#f8fafc" },
}

function MetricCard({ icon: Icon, label, value, unit, color = "#3F687A", bg = "#e8f4f7" }) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: bg }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p className="metric-label">{label}</p>
        <p className="metric-value">
          {value !== null && value !== undefined ? value : "—"}
          {value !== null && value !== undefined && unit && (
            <span className="metric-unit"> {unit}</span>
          )}
        </p>
      </div>
    </div>
  )
}

function AlertRow({ alerta, onResolve }) {
  const sev = SEVERIDAD_CONFIG[alerta.severidad] || SEVERIDAD_CONFIG.baja
  const [resolving, setResolving] = useState(false)

  const handleResolve = async () => {
    setResolving(true)
    try { await onResolve(alerta.id) }
    finally { setResolving(false) }
  }

  return (
    <div className="alert-row" style={{ borderLeftColor: sev.color }}>
      <div className="alert-row-header">
        <span className="alert-sev-badge" style={{ background: sev.bg, color: sev.color }}>
          {sev.label}
        </span>
        <span className="alert-time">
          <Clock size={11} />
          {new Date(alerta.fecha).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </div>
      <p className="alert-msg">{alerta.mensaje}</p>
      {alerta.causa_probable && (
        <p className="alert-causa">
          <strong>Causa:</strong> {alerta.causa_probable}
        </p>
      )}
      {alerta.accion_sugerida && (
        <p className="alert-accion">
          <strong>Acción:</strong> {alerta.accion_sugerida}
        </p>
      )}
      <button className="resolve-btn" onClick={handleResolve} disabled={resolving}>
        {resolving ? "Resolviendo..." : (
          <><CheckCircle size={14} /> Marcar resuelta</>
        )}
      </button>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0", fontSize: 12 }}>
          {p.name}: <strong>{p.value ?? "—"} {p.dataKey === "bateria_avg" ? "%" : "kWh"}</strong>
        </p>
      ))}
    </div>
  )
}

const InstalacionDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detalle, setDetalle] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dias, setDias] = useState(7)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [det, tend] = await Promise.all([
        fetchDetalleInstalacion(id),
        fetchTendencia(id, dias),
      ])
      setDetalle(det)
      setAlertas(det.alertas_activas || [])
      setTendencia(tend.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id, dias])

  useEffect(() => { load() }, [load])

  const handleResolve = async (alertaId) => {
    await resolverAlerta(alertaId)
    setAlertas(prev => prev.filter(a => a.id !== alertaId))
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Cargando instalación...</p>
      </div>
    )
  }

  if (!detalle) {
    return (
      <div className="det-error">
        <p>No se encontró la instalación.</p>
        <button onClick={() => navigate("/")}>Volver al panel</button>
      </div>
    )
  }

  const { instalacion, bateria, consumo_hoy, autonomia_estimada_horas } = detalle
  const tipo = TIPO_CONFIG[instalacion.tipo_sistema] || { label: instalacion.tipo_sistema, color: "#64748b" }
  const estado = ESTADO_CONFIG[instalacion.estado] || ESTADO_CONFIG.inactivo

  const totalHoy = (consumo_hoy.solar || 0) + (consumo_hoy.electrica || 0)
  const solarRatio = totalHoy > 0 ? Math.round((consumo_hoy.solar / totalHoy) * 100) : 0

  return (
    <div className="det-page">
      {/* Breadcrumb + actions */}
      <div className="det-topbar">
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Panel
        </button>
        <button
          className={`refresh-btn${refreshing ? " spinning" : ""}`}
          onClick={() => load(true)}
          title="Actualizar"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Header */}
      <div className="det-header">
        <div>
          <div className="det-breadcrumb">{instalacion.empresa}</div>
          <h1 className="det-title">{instalacion.nombre}</h1>
          <div className="det-tags">
            <span className="tag" style={{ background: tipo.color + "18", color: tipo.color }}>
              {tipo.label}
            </span>
            <span className="tag" style={{ background: estado.bg, color: estado.color }}>
              {estado.label}
            </span>
            {instalacion.ciudad && (
              <span className="tag tag-neutral">{instalacion.ciudad}</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="metrics-grid">
        <MetricCard
          icon={Battery}
          label="Batería"
          value={bateria?.porcentaje_carga ?? null}
          unit="%"
          color={bateria ? (bateria.porcentaje_carga < 20 ? "#dc2626" : bateria.porcentaje_carga < 50 ? "#d97706" : "#16a34a") : "#9ca3af"}
          bg={bateria ? (bateria.porcentaje_carga < 20 ? "#fef2f2" : "#f0fdf4") : "#f8fafc"}
        />
        <MetricCard icon={Sun} label="Solar hoy" value={consumo_hoy.solar} unit="kWh" color="#f59e0b" bg="#fffbeb" />
        <MetricCard icon={PlugZap} label="Eléctrica hoy" value={consumo_hoy.electrica} unit="kWh" color="#6366f1" bg="#eef2ff" />
        <MetricCard icon={DollarSign} label="Costo hoy" value={consumo_hoy.costo} unit="COP" color="#059669" bg="#f0fdf4" />
        <MetricCard icon={Zap} label="Ratio solar" value={solarRatio} unit="%" color="#f59e0b" bg="#fffbeb" />
        <MetricCard
          icon={Activity}
          label="Autonomía est."
          value={autonomia_estimada_horas}
          unit="h"
          color="#8b5cf6"
          bg="#f5f3ff"
        />
        {bateria && (
          <MetricCard icon={Thermometer} label="Temp. batería" value={bateria.temperatura} unit="°C" color="#ef4444" bg="#fef2f2" />
        )}
        {instalacion.capacidad_panel_kw && (
          <MetricCard icon={Sun} label="Cap. panel" value={instalacion.capacidad_panel_kw} unit="kWp" color="#0891b2" bg="#ecfeff" />
        )}
      </div>

      <div className="det-cols">
        {/* Tendencia chart */}
        <div className="det-card det-chart-card">
          <div className="det-card-header">
            <h2 className="det-card-title">Tendencia energética</h2>
            <div className="dias-selector">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  className={`dias-btn${dias === d ? " active" : ""}`}
                  onClick={() => setDias(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tendencia} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="fecha"
                tickFormatter={v => v.slice(5)}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="solar" name="Solar kWh" stroke="#E0B63D" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="electrica" name="Eléctrica kWh" stroke="#3F687A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bateria_avg" name="Batería %" stroke="#16a34a" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="det-card det-alerts-card">
          <div className="det-card-header">
            <h2 className="det-card-title">
              <AlertTriangle size={16} />
              Alertas activas
            </h2>
            <span className="b2b-count">{alertas.length}</span>
          </div>
          {alertas.length === 0 ? (
            <div className="alerts-empty">
              <CheckCircle size={28} color="#16a34a" />
              <p>Sin alertas activas</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alertas.map(a => (
                <AlertRow key={a.id} alerta={a} onResolve={handleResolve} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Installation info */}
      <div className="det-card det-info-card">
        <h2 className="det-card-title">Información de la instalación</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Dirección</span>
            <span className="info-value">{instalacion.direccion || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Tipo sistema</span>
            <span className="info-value">{tipo.label}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cap. panel</span>
            <span className="info-value">{instalacion.capacidad_panel_kw ? `${instalacion.capacidad_panel_kw} kWp` : "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cap. batería</span>
            <span className="info-value">{instalacion.capacidad_bateria_kwh ? `${instalacion.capacidad_bateria_kwh} kWh` : "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Fecha instalación</span>
            <span className="info-value">
              {instalacion.fecha_instalacion
                ? new Date(instalacion.fecha_instalacion).toLocaleDateString("es-CO")
                : "—"}
            </span>
          </div>
          {bateria && (
            <>
              <div className="info-item">
                <span className="info-label">Voltaje batería</span>
                <span className="info-value">{bateria.voltaje} V</span>
              </div>
              <div className="info-item">
                <span className="info-label">Corriente</span>
                <span className="info-value">{bateria.corriente} A</span>
              </div>
              <div className="info-item">
                <span className="info-label">Últ. registro</span>
                <span className="info-value">
                  {new Date(bateria.fecha_registro).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default InstalacionDetalle
