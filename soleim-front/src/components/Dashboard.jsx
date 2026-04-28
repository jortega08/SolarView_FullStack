import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2, Zap, AlertTriangle, Wrench, Sun,
  RefreshCw, Clock, MapPin, Activity
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend
} from "recharts"
import { useAuth } from "../context/AuthContext"
import { fetchPanelEmpresa, fetchActivities } from "../services/api"
import usePageTitle from "../hooks/usePageTitle"
import "../styles/Dashboard.css"

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const TIPO_LABEL = { hibrido: "Híbrido", off_grid: "Off-Grid", grid_tie: "Grid-Tie" }
const TIPO_COLOR = { hibrido: "#8b5cf6", off_grid: "#0891b2", grid_tie: "var(--solein-gold)" }

const RIESGO_CONFIG = {
  alto:  { label: "Riesgo alto",  color: "var(--solein-red)",  bg: "rgba(220,38,38,.08)",  dot: "var(--solein-red)" },
  medio: { label: "Riesgo medio", color: "var(--solein-gold)", bg: "var(--solein-gold-bg)", dot: "var(--solein-gold)" },
  bajo:  { label: "Operando bien",color: "var(--solein-gold)", bg: "var(--solein-gold-bg)", dot: "var(--solein-gold)" },
}

function timeAgo(iso) {
  if (!iso) return "Sin datos"
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 1) return "Ahora"
  if (diff < 60) return `${diff}m`
  if (diff < 1440) return `${Math.floor(diff / 60)}h`
  return `${Math.floor(diff / 1440)}d`
}

/* ─── Battery Bar ─────────────────────────────────────────────────────────── */

function BatteryBar({ pct }) {
  if (pct === null || pct === undefined)
    return <span style={{ fontSize: 12, color: "var(--solein-text-muted)" }}>Sin batería</span>
  const color = pct < 20 ? "var(--solein-red)" : pct < 50 ? "var(--solein-gold)" : "var(--solein-gold)"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "var(--solein-border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: "right" }}>{pct}%</span>
    </div>
  )
}

/* ─── Installation Card ───────────────────────────────────────────────────── */

function InstCard({ inst, onClick }) {
  const [hov, setHov] = useState(false)
  const riesgo = RIESGO_CONFIG[inst.riesgo] || RIESGO_CONFIG.bajo
  const tipoColor = TIPO_COLOR[inst.tipo_sistema] || "#64748b"
  const tipoLabel = TIPO_LABEL[inst.tipo_sistema] || inst.tipo_sistema

  return (
    <div
      className={`inst-card-new${hov ? " hov" : ""}`}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Header */}
      <div className="icn-header">
        <div style={{ minWidth: 0 }}>
          <div className="icn-name">{inst.nombre}</div>
          {inst.ciudad && (
            <div className="icn-city">
              <span className="icn-city-dot" />
              <MapPin size={10} style={{ flexShrink: 0 }} />
              {inst.ciudad}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {tipoLabel && (
            <span className="icn-badge" style={{ background: `${tipoColor}18`, color: tipoColor }}>
              {tipoLabel}
            </span>
          )}
          {inst.alertas_criticas > 0 && (
            <span className="icn-badge icn-badge--alert">
              <AlertTriangle size={9} /> {inst.alertas_criticas}
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      {(inst.potencia_kw != null || inst.energia_hoy_kwh != null) && (
        <div className="icn-metrics">
          <div className="icn-metric-cell">
            <div className="icn-metric-label">POTENCIA</div>
            <div className="icn-metric-value" style={{ color: "var(--solein-gold)" }}>
              {inst.potencia_kw != null && inst.potencia_kw > 0 ? inst.potencia_kw : "—"}
              <span className="icn-metric-unit"> kW</span>
            </div>
          </div>
          <div className="icn-metric-cell">
            <div className="icn-metric-label">ENERGÍA HOY</div>
            <div className="icn-metric-value" style={{ color: "var(--solein-red)" }}>
              {inst.energia_hoy_kwh != null && inst.energia_hoy_kwh > 0 ? inst.energia_hoy_kwh : "—"}
              <span className="icn-metric-unit"> kWh</span>
            </div>
          </div>
        </div>
      )}

      {/* Battery */}
      <div>
        <div className="icn-batt-label">BATERÍA</div>
        <BatteryBar pct={inst.bateria_pct} />
      </div>

      {/* Footer */}
      <div className="icn-footer">
        <span className="icn-riesgo-badge" style={{ background: riesgo.bg, color: riesgo.color }}>
          <span className="icn-riesgo-dot" style={{ background: riesgo.dot }} />
          {riesgo.label}
        </span>
        <span className="icn-time">
          <Clock size={10} />
          {timeAgo(inst.ultimo_registro)}
        </span>
      </div>
    </div>
  )
}

/* ─── KPI Card ────────────────────────────────────────────────────────────── */

function KpiCard({ icon: Icon, label, value, unit, iconColor, iconBg, highlight }) {
  return (
    <div className="kpi-card-new" style={highlight ? { borderColor: "rgba(220,38,38,.25)" } : {}}>
      <div className="kpi-icon-new" style={{ background: iconBg }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-value-new" style={highlight ? { color: "var(--solein-red)" } : {}}>
          {value}{unit && <span className="kpi-unit-new"> {unit}</span>}
        </div>
        <div className="kpi-label-new">{label}</div>
      </div>
    </div>
  )
}

/* ─── Sidebar weekly chart tooltip ───────────────────────────────────────── */

function WeekTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "var(--solein-navy)", border: "none", borderRadius: 8,
      padding: "8px 12px", fontSize: 12, color: "var(--solein-bg)"
    }}>
      <strong style={{ display: "block", marginBottom: 4 }}>{label}</strong>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value} kWh</strong>
        </div>
      ))}
    </div>
  )
}

/* ─── Sidebar Panel ───────────────────────────────────────────────────────── */

function SidebarPanel({ instalaciones, weekData }) {
  const potenciaTotal = instalaciones.reduce((s, i) => s + (i.potencia_kw || 0), 0)
  const energiaTotal  = instalaciones.reduce((s, i) => s + (i.energia_hoy_kwh || 0), 0)
  const capTotal      = instalaciones.reduce((s, i) => s + (i.capacidad_panel_kw || 0), 0)

  const solarHoy   = energiaTotal * 0.73
  const elecHoy    = energiaTotal * 0.27
  const costoHoy   = elecHoy * 820
  const ahorroHoy  = solarHoy * 820

  return (
    <div className="dash-sidebar">
      {/* Live power card */}
      <div className="sidebar-power-card">
        <p className="spc-label">POTENCIA TOTAL AHORA</p>
        <div className="spc-value">
          {potenciaTotal.toFixed(1)}
          <span className="spc-unit"> kW</span>
        </div>
        <div className="spc-split">
          <div>
            <p className="spc-split-label">SOLAR</p>
            <p className="spc-split-val spc-split-val--gold">{(potenciaTotal * 0.73).toFixed(1)} kW</p>
          </div>
          <div>
            <p className="spc-split-label">ELÉCTRICA</p>
            <p className="spc-split-val spc-split-val--red">{(potenciaTotal * 0.27).toFixed(1)} kW</p>
          </div>
        </div>
      </div>

      {/* 7-day chart */}
      {weekData && weekData.length > 0 && (
        <div className="sidebar-chart-card">
          <p className="scc-title">Energía últimos 7 días</p>
          <p className="scc-sub">Todas las instalaciones</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={14}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false} />
              <RechartTooltip content={<WeekTooltip />} cursor={{ fill: "rgba(255,255,255,.04)" }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: "var(--solein-text-muted)" }} />
              <Bar dataKey="solar" name="Solar" fill="var(--solein-gold)" stackId="e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="elec"  name="Eléctrica" fill="var(--solein-red)"  stackId="e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Financial summary */}
      {energiaTotal > 0 && (
        <div className="sidebar-financial-card">
          <p className="sfc-title">Resumen financiero</p>
          {[
            { label: "Costo eléctrico hoy",   value: `$${Math.round(costoHoy).toLocaleString("es-CO")}`, gold: false },
            { label: "Ahorro solar estimado",  value: `$${Math.round(ahorroHoy).toLocaleString("es-CO")}`, gold: true },
            ...(capTotal > 0 ? [{ label: "Cap. total paneles", value: `${capTotal} kWp`, gold: false }] : []),
          ].map(({ label, value, gold }) => (
            <div key={label} className="sfc-row">
              <span className="sfc-row-label">{label}</span>
              <span className="sfc-row-value" style={gold ? { color: "var(--solein-gold)" } : {}}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */

const FILTER_TABS = [
  { id: "todas",   label: "Todas" },
  { id: "activas", label: "Activas" },
  { id: "alertas", label: "Con alertas" },
]

const Dashboard = () => {
  usePageTitle("Panel")
  const { user } = useAuth()
  const navigate = useNavigate()
  const [panel,      setPanel]      = useState(null)
  const [weekData,   setWeekData]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState(null)
  const [filter,     setFilter]     = useState("todas")

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [data, activ] = await Promise.allSettled([
        fetchPanelEmpresa(),
        fetchActivities({ periodo: "week" }),
      ])
      if (data.status === "fulfilled") {
        setPanel(data.value)
        setError(null)
      } else {
        throw data.reason
      }
      if (activ.status === "fulfilled") {
        const raw = Array.isArray(activ.value) ? activ.value : []
        const DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]
        if (raw.length > 0) {
          setWeekData(raw.slice(-7).map((d, i) => ({
            day: DAYS[i % 7],
            solar: +(d.solar || 0).toFixed(0),
            elec:  +(d.electrica || d.elec || 0).toFixed(0),
          })))
        }
      }
    } catch {
      setError("No se pudo cargar el panel.")
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

  const empresa       = panel?.empresa
  const instalaciones = panel?.instalaciones || []
  const resumen       = panel?.resumen || {}

  const activas       = instalaciones.filter(i => i.estado === "activo" || i.estado === "activa").length
  const totalAlertas  = instalaciones.reduce((s, i) => s + (i.alertas_criticas || 0), 0)
  const mantenimiento = instalaciones.filter(i => i.estado === "mantenimiento").length
  const energiaTotal  = instalaciones.reduce((s, i) => s + (i.energia_hoy_kwh || 0), 0)

  const filtradas = (() => {
    switch (filter) {
      case "activas":  return instalaciones.filter(i => i.estado === "activo" || i.estado === "activa")
      case "alertas":  return instalaciones.filter(i => (i.alertas_criticas || 0) > 0)
      default:         return instalaciones
    }
  })()

  const now = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <p className="dash-eyebrow">Panel Empresarial</p>
          <h1 className="dash-title">{empresa?.nombre || "Panel de empresa"}</h1>
          <p className="dash-welcome">
            Bienvenido, <strong>{user?.nombre || user?.email}</strong> · {now}
          </p>
        </div>
        <button
          className={`dash-refresh-btn${refreshing ? " spinning" : ""}`}
          onClick={() => load(true)}
          title="Actualizar"
        >
          <RefreshCw size={15} />
          <span>Actualizar</span>
        </button>
      </div>

      {error && <div className="dash-error">{error}</div>}

      {/* KPI Strip */}
      <div className="dash-kpis">
        <KpiCard icon={Building2} label="Instalaciones"    value={resumen.total ?? instalaciones.length} iconColor="var(--solein-red)"  iconBg="rgba(220,38,38,.08)" />
        <KpiCard icon={Zap}       label="Activas"          value={activas}        iconColor="var(--solein-gold)" iconBg="var(--solein-gold-bg)" />
        <KpiCard icon={AlertTriangle} label="Alertas críticas" value={totalAlertas} iconColor={totalAlertas > 0 ? "var(--solein-red)" : "var(--solein-text-muted)"} iconBg={totalAlertas > 0 ? "rgba(220,38,38,.08)" : "var(--solein-bg)"} highlight={totalAlertas > 0} />
        <KpiCard icon={Wrench}    label="Mantenimiento"    value={mantenimiento}  iconColor="var(--solein-gold)" iconBg="var(--solein-gold-bg)" />
        <KpiCard icon={Sun}       label="Energía hoy"      value={energiaTotal.toFixed(0)} unit="kWh" iconColor="var(--solein-gold)" iconBg="var(--solein-gold-bg)" />
      </div>

      {/* Main layout */}
      <div className="dash-main">
        {/* Left: installations */}
        <div className="dash-left">
          {/* Section header + filter tabs */}
          <div className="dash-inst-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 className="dash-inst-title">Instalaciones</h2>
              <span className="dash-inst-count">{filtradas.length}</span>
            </div>
            <div className="dash-filter-tabs">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`dash-filter-tab${filter === tab.id ? " active" : ""}`}
                  onClick={() => setFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {instalaciones.length === 0 ? (
            <div className="dash-empty">
              <Building2 size={40} strokeWidth={1.2} color="var(--solein-border)" />
              <p>No hay instalaciones asignadas.</p>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="dash-empty">
              <Activity size={36} strokeWidth={1.2} color="var(--solein-border)" />
              <p>No hay instalaciones en este filtro.</p>
            </div>
          ) : (
            <div className="dash-inst-grid">
              {filtradas.map(inst => (
                <InstCard
                  key={inst.id}
                  inst={inst}
                  onClick={() => navigate(`/instalacion/${inst.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <SidebarPanel instalaciones={instalaciones} weekData={weekData} />
      </div>
    </div>
  )
}

export default Dashboard
