import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, RefreshCw, MapPin, Battery, Zap, Sun, Thermometer,
  Clock, DollarSign, Activity, PieChart, CheckCircle, AlertTriangle,
  Info, PlugZap
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { fetchDetalleInstalacion, fetchTendencia, resolverAlerta } from "../services/api"
import usePageTitle from "../hooks/usePageTitle"
import "../styles/InstalacionDetalle.css"

/* ─── Config ──────────────────────────────────────────────────────────────── */

const SEVERIDAD_CONFIG = {
  critica: { color: "var(--solein-red)",  bg: "rgba(220,38,38,.08)",  label: "Crítica" },
  alta:    { color: "#f97316",            bg: "rgba(249,115,22,.10)", label: "Alta"    },
  media:   { color: "var(--solein-gold)", bg: "var(--solein-gold-bg)", label: "Media" },
  baja:    { color: "var(--solein-gold)", bg: "var(--solein-gold-bg)", label: "Baja"  },
}

const TIPO_CONFIG = {
  hibrido:   { label: "Híbrido",  color: "#8b5cf6" },
  off_grid:  { label: "Off-Grid", color: "#0891b2" },
  grid_tie:  { label: "Grid-Tie", color: "var(--solein-gold)" },
}

const ESTADO_CONFIG = {
  activo:        { label: "Activo",        color: "var(--solein-gold)",  bg: "var(--solein-gold-bg)" },
  activa:        { label: "Activa",        color: "var(--solein-gold)",  bg: "var(--solein-gold-bg)" },
  mantenimiento: { label: "Mantenimiento", color: "var(--solein-gold)",  bg: "var(--solein-gold-bg)" },
  inactivo:      { label: "Inactivo",      color: "var(--solein-text-muted)", bg: "var(--solein-bg)" },
  inactiva:      { label: "Inactiva",      color: "var(--solein-text-muted)", bg: "var(--solein-bg)" },
}

/* ─── Energy Flow SVG ─────────────────────────────────────────────────────── */

function EnergyFlow({ solarKw, batteryPct, elecKw }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 80)
    return () => clearInterval(iv)
  }, [])

  const flowOffset = (tick * 3) % 40
  const batColor   = batteryPct == null ? "var(--solein-text-muted)"
    : batteryPct > 50 ? "var(--solein-gold)"
    : batteryPct > 20 ? "var(--solein-gold)"
    : "var(--solein-red)"

  return (
    <div className="det-card" style={{ display: "flex", flexDirection: "column" }}>
      <p className="det-section-title">Flujo de Energía</p>
      <p className="det-section-sub">Tiempo real</p>
      <svg viewBox="0 0 320 220" style={{ flex: 1, width: "100%", maxHeight: 220 }}>
        {/* Solar → Inverter */}
        <line x1="72" y1="60" x2="160" y2="110"
          stroke="var(--solein-gold)" strokeWidth="2" strokeDasharray="10 6"
          strokeDashoffset={-flowOffset} opacity={solarKw > 0 ? 1 : 0.25} />
        {/* Inverter → Load */}
        <line x1="200" y1="110" x2="280" y2="60"
          stroke="var(--solein-red)" strokeWidth="2" strokeDasharray="10 6"
          strokeDashoffset={-flowOffset} />
        {/* Inverter ↔ Battery */}
        <line x1="180" y1="130" x2="180" y2="175"
          stroke={batColor} strokeWidth="2" strokeDasharray="8 5"
          strokeDashoffset={-flowOffset} opacity={batteryPct != null ? 1 : 0.2} />
        {/* Inverter → Grid */}
        <line x1="200" y1="115" x2="280" y2="160"
          stroke="var(--solein-gold)" strokeWidth="1.5" strokeDasharray="8 5"
          strokeDashoffset={-flowOffset} opacity="0.6" />

        {/* Solar Panel node */}
        <rect x="24" y="30" width="96" height="58" rx="12"
          fill="var(--solein-gold-bg)" stroke="var(--solein-gold)" strokeWidth="1.5" opacity="0.7" />
        <text x="72" y="55" textAnchor="middle" fontSize="10" fontWeight="700"
          fill="var(--solein-text-muted)">Solar</text>
        <text x="72" y="72" textAnchor="middle" fontSize="14" fontWeight="800"
          fill="var(--solein-gold)">{solarKw} kW</text>

        {/* Inverter node */}
        <rect x="140" y="88" width="80" height="46" rx="10"
          fill="var(--solein-bg)" stroke="var(--solein-border)" strokeWidth="1.5" />
        <text x="180" y="112" textAnchor="middle" fontSize="9" fontWeight="700"
          fill="var(--solein-text-muted)">INVERSOR</text>

        {/* Load node */}
        <rect x="232" y="30" width="80" height="58" rx="12"
          fill="rgba(220,38,38,.07)" stroke="rgba(220,38,38,.3)" strokeWidth="1.5" />
        <text x="272" y="55" textAnchor="middle" fontSize="10" fontWeight="700"
          fill="var(--solein-red)">Carga</text>
        <text x="272" y="72" textAnchor="middle" fontSize="14" fontWeight="800"
          fill="var(--solein-red)">{elecKw} kW</text>

        {/* Battery node */}
        <rect x="140" y="175" width="80" height="40" rx="10"
          fill={`rgba(224,182,61,.12)`} stroke="var(--solein-gold)" strokeWidth="1.5"
          opacity={batteryPct != null ? 1 : 0.3} />
        <text x="180" y="200" textAnchor="middle" fontSize="12" fontWeight="800"
          fill={batColor}>{batteryPct != null ? `${batteryPct}%` : "N/A"}</text>

        {/* Grid node */}
        <rect x="232" y="135" width="80" height="46" rx="12"
          fill="var(--solein-gold-bg)" stroke="var(--solein-gold)" strokeWidth="1" opacity="0.7" />
        <text x="272" y="156" textAnchor="middle" fontSize="9" fontWeight="700"
          fill="var(--solein-text-muted)">RED</text>
        <text x="272" y="172" textAnchor="middle" fontSize="9"
          fill="var(--solein-text-muted)">pública</text>
      </svg>
    </div>
  )
}

/* ─── Battery Gauge (SVG arc) ─────────────────────────────────────────────── */

function BatteryGauge({ pct, temp, voltaje, corriente, autonomia }) {
  const W  = 160, cx = W / 2, cy = W * 0.58, r = W * 0.38, sw = W * 0.09
  const color = pct == null ? "var(--solein-text-muted)"
    : pct < 20 ? "var(--solein-red)"
    : pct < 50 ? "var(--solein-gold)"
    : "var(--solein-gold)"

  const angle  = Math.PI * (1 - Math.min(Math.max(pct ?? 0, 0), 100) / 100)
  const xEnd   = cx + r * Math.cos(angle)
  const yEnd   = cy - r * Math.sin(angle)
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const filled = (pct == null || pct <= 0) ? null
    : pct >= 100 ? bgPath
    : `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${xEnd.toFixed(1)} ${yEnd.toFixed(1)}`

  const stats = [
    { label: "Voltaje",    value: voltaje   ? `${voltaje} V`  : "—", icon: Zap,          warn: false },
    { label: "Corriente",  value: corriente ? `${corriente} A` : "—", icon: Activity,    warn: false },
    { label: "Temp.",      value: temp      ? `${temp} °C`    : "—", icon: Thermometer,   warn: temp > 40 },
    { label: "Autonomía",  value: autonomia ? `${autonomia} h` : "—", icon: Clock,        warn: false },
  ]

  return (
    <div className="det-card" style={{ display: "flex", flexDirection: "column" }}>
      <p className="det-section-title">Estado de Batería</p>
      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <svg width={W} height={W * 0.62} viewBox={`0 0 ${W} ${W * 0.62}`} style={{ overflow: "visible" }}>
          <path d={bgPath} fill="none" stroke="var(--solein-border)" strokeWidth={sw} strokeLinecap="round" />
          {filled && <path d={filled} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={W * 0.2} fontWeight="800"
            fill={color} fontFamily="Inter, sans-serif">
            {pct != null ? `${pct}%` : "—"}
          </text>
          <text x={cx} y={cy + W * 0.12} textAnchor="middle" fontSize={W * 0.09}
            fill="var(--solein-text-muted)" fontFamily="Inter, sans-serif">
            Carga de batería
          </text>
        </svg>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        {stats.map(({ label, value, icon: Icon, warn }) => (
          <div key={label} className="bat-stat-cell" style={warn ? { borderColor: "var(--solein-red)" } : {}}>
            <Icon size={13} color={warn ? "var(--solein-red)" : "var(--solein-text-muted)"} />
            <div>
              <div className="bat-stat-value" style={warn ? { color: "var(--solein-red)" } : {}}>{value}</div>
              <div className="bat-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── KPI Chip ────────────────────────────────────────────────────────────── */

function Chip({ icon: Icon, label, value, unit, iconColor, iconBg }) {
  return (
    <div className="det-chip">
      <div className="det-chip-icon" style={{ background: iconBg }}>
        <Icon size={18} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="det-chip-value">
          {value ?? "—"}
          {value != null && unit && <span className="det-chip-unit"> {unit}</span>}
        </div>
        <div className="det-chip-label">{label}</div>
      </div>
    </div>
  )
}

/* ─── Tooltip ─────────────────────────────────────────────────────────────── */

function ChartTooltip({ active, payload, label, unit = "kWh" }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0", fontSize: 12 }}>
          {p.name}: <strong>{p.value ?? "—"} {p.dataKey === "bateria_avg" ? "%" : unit}</strong>
        </p>
      ))}
    </div>
  )
}

/* ─── Alert Row ───────────────────────────────────────────────────────────── */

function AlertRow({ alerta, onResolve }) {
  const sev = SEVERIDAD_CONFIG[alerta.severidad] || SEVERIDAD_CONFIG.baja
  const [resolving, setResolving] = useState(false)

  const handleResolve = async () => {
    setResolving(true)
    try { await onResolve(alerta.id) }
    finally { setResolving(false) }
  }

  return (
    <div className="alert-row-new" style={{ borderLeftColor: sev.color, background: sev.bg }}>
      <div className="alert-row-header">
        <span className="alert-sev-badge" style={{ background: `${sev.color}20`, color: sev.color }}>
          {sev.label}
        </span>
        <span className="alert-time">
          <Clock size={10} />
          {new Date(alerta.fecha).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </div>
      <p className="alert-msg">{alerta.mensaje}</p>
      {alerta.causa_probable && (
        <p className="alert-causa"><strong>Causa:</strong> {alerta.causa_probable}</p>
      )}
      {alerta.accion_sugerida && (
        <p className="alert-accion"><strong>Acción:</strong> {alerta.accion_sugerida}</p>
      )}
      <button className="resolve-btn-new" onClick={handleResolve} disabled={resolving}
        style={{ color: sev.color, borderColor: `${sev.color}40` }}>
        <CheckCircle size={13} />
        {resolving ? "Resolviendo..." : "Marcar resuelta"}
      </button>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

const InstalacionDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detalle,    setDetalle]    = useState(null)
  const [tendencia,  setTendencia]  = useState([])
  const [alertas,    setAlertas]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange,  setTimeRange]  = useState("7d")

  const nombreInstalacion = detalle?.instalacion?.nombre
  usePageTitle(nombreInstalacion || "Instalación")

  const diasMap = { "7d": 7, "14d": 14, "30d": 30 }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [det, tend] = await Promise.all([
        fetchDetalleInstalacion(id),
        fetchTendencia(id, diasMap[timeRange] || 7),
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
  }, [id, timeRange])

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
  const tipo   = TIPO_CONFIG[instalacion.tipo_sistema]   || { label: instalacion.tipo_sistema,   color: "var(--solein-text-muted)" }
  const estado = ESTADO_CONFIG[instalacion.estado]       || ESTADO_CONFIG.inactivo

  const totalHoy   = (consumo_hoy.solar || 0) + (consumo_hoy.electrica || 0)
  const solarRatio = totalHoy > 0 ? Math.round((consumo_hoy.solar / totalHoy) * 100) : 0
  const solarKw    = parseFloat(((instalacion.potencia_kw || 0) * 0.73).toFixed(1))
  const elecKw     = parseFloat(((instalacion.potencia_kw || 0) * 0.27).toFixed(1))

  // Derived chart data from tendencia
  const trendLabels = tendencia.map(d => d.fecha?.slice(5) || "")
  const donutData   = [
    { name: "Solar",    value: +(tendencia.reduce((s, d) => s + (d.solar || 0), 0).toFixed(0)) },
    { name: "Eléctrica",value: +(tendencia.reduce((s, d) => s + (d.electrica || 0), 0).toFixed(0)) },
  ]
  const totalDonut  = donutData[0].value + donutData[1].value
  const pctSolar    = totalDonut > 0 ? Math.round(donutData[0].value / totalDonut * 100) : 0

  const weekBars    = tendencia.slice(-7).map(d => ({
    day:   d.fecha?.slice(5) || "",
    solar: +(d.solar || 0).toFixed(0),
    elec:  +(d.electrica || 0).toFixed(0),
  }))

  const costTrend   = tendencia.map(d => ({
    fecha: d.fecha?.slice(5) || "",
    cost:  +((d.electrica || 0) * 820).toFixed(0),
  }))

  return (
    <div className="det-page">
      {/* Top bar */}
      <div className="det-topbar">
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={15} /> Panel
        </button>
        <button
          className={`dash-refresh-btn${refreshing ? " spinning" : ""}`}
          style={{ padding: "8px 12px" }}
          onClick={() => load(true)}
          title="Actualizar"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Header */}
      <div className="det-header">
        <p className="det-breadcrumb">{instalacion.empresa || "Solein"}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 className="det-title">{instalacion.nombre}</h1>
          <span className="tag" style={{ background: `${tipo.color}18`, color: tipo.color }}>
            {tipo.label}
          </span>
          <span className="tag" style={{ background: estado.bg, color: estado.color, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: estado.color, display: "inline-block" }} />
            {estado.label}
          </span>
          {instalacion.ciudad && (
            <span className="tag tag-neutral" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={11} /> {instalacion.ciudad}
            </span>
          )}
        </div>
      </div>

      {/* KPI Chips — row 1 */}
      <div className="det-chips-grid">
        <Chip icon={Battery}    label="Batería"        value={bateria?.porcentaje_carga ?? "—"} unit="%" iconColor={bateria?.porcentaje_carga < 20 ? "var(--solein-red)" : "var(--solein-gold)"} iconBg={bateria?.porcentaje_carga < 20 ? "rgba(220,38,38,.08)" : "var(--solein-gold-bg)"} />
        <Chip icon={Zap}        label="Potencia actual" value={instalacion.potencia_kw}    unit="kW"   iconColor="var(--solein-gold)"  iconBg="var(--solein-gold-bg)" />
        <Chip icon={Sun}        label="Solar hoy"      value={consumo_hoy.solar}           unit="kWh"  iconColor="var(--solein-gold)"  iconBg="var(--solein-gold-bg)" />
        <Chip icon={PlugZap}    label="Eléctrica hoy"  value={consumo_hoy.electrica}       unit="kWh"  iconColor="var(--solein-red)"   iconBg="rgba(220,38,38,.08)" />
      </div>
      {/* KPI Chips — row 2 */}
      <div className="det-chips-grid" style={{ marginTop: -8 }}>
        {consumo_hoy.costo != null && (
          <Chip icon={DollarSign} label="Costo hoy"  value={`$${(consumo_hoy.costo).toLocaleString("es-CO")}`} unit="COP" iconColor="var(--solein-gold)" iconBg="var(--solein-gold-bg)" />
        )}
        <Chip icon={PieChart}     label="Ratio solar" value={solarRatio}                      unit="%"   iconColor="#8b5cf6"             iconBg="#f5f3ff" />
        {bateria?.temperatura != null && (
          <Chip icon={Thermometer} label="Temp. bat." value={bateria.temperatura}             unit="°C"  iconColor={bateria.temperatura > 40 ? "var(--solein-red)" : "var(--solein-text-muted)"} iconBg={bateria.temperatura > 40 ? "rgba(220,38,38,.08)" : "var(--solein-bg)"} />
        )}
        {autonomia_estimada_horas != null && (
          <Chip icon={Clock}       label="Autonomía"  value={autonomia_estimada_horas}        unit="h"   iconColor="#8b5cf6"             iconBg="#f5f3ff" />
        )}
      </div>

      {/* Row: Energy flow + Battery gauge */}
      <div className="det-row-2col">
        <EnergyFlow
          solarKw={solarKw}
          batteryPct={bateria?.porcentaje_carga ?? null}
          elecKw={elecKw}
        />
        <BatteryGauge
          pct={bateria?.porcentaje_carga ?? null}
          temp={bateria?.temperatura}
          voltaje={bateria?.voltaje}
          corriente={bateria?.corriente}
          autonomia={autonomia_estimada_horas}
        />
      </div>

      {/* Power / Tendencia chart */}
      {tendencia.length > 0 && (
        <div className="det-card">
          <div className="det-card-header">
            <div>
              <p className="det-section-title">Potencia activa</p>
              <p className="det-section-sub">Tendencia energética (kWh)</p>
            </div>
            <div className="dias-selector">
              {["7d", "14d", "30d"].map(r => (
                <button key={r} className={`dias-btn${timeRange === r ? " active" : ""}`}
                  onClick={() => setTimeRange(r)}>{r}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tendencia} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--solein-border)" />
              <XAxis dataKey="fecha" tickFormatter={v => v?.slice(5) || ""} tick={{ fontSize: 10, fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="solar"    name="Solar"     stroke="var(--solein-gold)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="electrica" name="Eléctrica" stroke="var(--solein-red)"  strokeWidth={2} dot={false} />
              {tendencia[0]?.bateria_avg !== undefined && (
                <Line type="monotone" dataKey="bateria_avg" name="Batería %" stroke="var(--solein-teal)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Row: Weekly bars + Donut */}
      {tendencia.length > 0 && (
        <div className="det-row-3-2">
          {/* Weekly Bars */}
          <div className="det-card">
            <p className="det-section-title">Comparación energética semanal</p>
            <p className="det-section-sub">Generación solar vs consumo eléctrico (kWh)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekBars} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} barSize={18}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9,  fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="solar" name="Solar"     fill="var(--solein-gold)" radius={[4,4,0,0]} />
                <Bar dataKey="elec"  name="Eléctrica" fill="var(--solein-red)"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut */}
          <div className="det-card">
            <p className="det-section-title">Mix energético</p>
            <p className="det-section-sub">Distribución solar vs eléctrica</p>
            <div style={{ position: "relative" }}>
              <ResponsiveContainer width="100%" height={210}>
                <RPieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius="50%" outerRadius="78%"
                    paddingAngle={3} dataKey="value">
                    <Cell fill="var(--solein-gold)" />
                    <Cell fill="var(--solein-red)" />
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [`${v.toFixed(0)} kWh`, name]}
                    contentStyle={{ background: "var(--solein-white)", border: "1px solid var(--solein-border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </RPieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -62%)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--solein-gold)", lineHeight: 1 }}>{pctSolar}%</div>
                <div style={{ fontSize: 10, color: "var(--solein-text-muted)", fontWeight: 600 }}>solar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row: Cost trend + Alerts */}
      <div className="det-row-3-2">
        {/* Cost trend */}
        {costTrend.length > 0 && (
          <div className="det-card">
            <p className="det-section-title">Costo energético</p>
            <p className="det-section-sub">Últimos {diasMap[timeRange]} días (COP)</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={costTrend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--solein-border)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false} interval={Math.floor(costTrend.length / 5)} />
                <YAxis tick={{ fontSize: 9, fill: "var(--solein-text-muted)" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toLocaleString("es-CO")} COP`, "Costo"]}
                  contentStyle={{ background: "var(--solein-white)", border: "1px solid var(--solein-border)", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="cost" stroke="var(--solein-gold)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Alerts panel */}
        <div className="det-card">
          <div className="det-card-header">
            <p className="det-section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={15} color="var(--solein-red)" />
              Alertas activas
            </p>
            <span className="det-alert-count" style={{ background: alertas.length > 0 ? "rgba(220,38,38,.08)" : "var(--solein-gold-bg)", color: alertas.length > 0 ? "var(--solein-red)" : "var(--solein-gold)" }}>
              {alertas.length}
            </span>
          </div>
          {alertas.length === 0 ? (
            <div className="alerts-empty">
              <CheckCircle size={28} color="var(--solein-gold)" />
              <p>Sin alertas activas</p>
            </div>
          ) : (
            <div className="alerts-list-new">
              {alertas.map(a => (
                <AlertRow key={a.id} alerta={a} onResolve={handleResolve} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info table */}
      <div className="det-card">
        <p className="det-section-title" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Info size={15} color="var(--solein-text-muted)" />
          Información de la instalación
        </p>
        <div className="info-grid-new">
          {[
            { label: "Tipo sistema",   value: tipo.label },
            { label: "Cap. paneles",   value: instalacion.capacidad_panel_kw ? `${instalacion.capacidad_panel_kw} kWp` : "—" },
            { label: "Cap. batería",   value: instalacion.capacidad_bateria_kwh ? `${instalacion.capacidad_bateria_kwh} kWh` : "Sin batería" },
            { label: "Ciudad",         value: instalacion.ciudad || "—" },
            { label: "Voltaje bat.",   value: bateria?.voltaje ? `${bateria.voltaje} V` : "—" },
            { label: "Corriente bat.", value: bateria?.corriente ? `${bateria.corriente} A` : "—" },
            { label: "Último reg.",    value: bateria?.fecha_registro ? new Date(bateria.fecha_registro).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—" },
            { label: "Estado",         value: estado.label },
          ].map(({ label, value }) => (
            <div key={label} className="info-cell-new">
              <div className="info-cell-label">{label}</div>
              <div className="info-cell-value">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InstalacionDetalle
