import { useState, useEffect, useRef } from "react"
import {
  AlertTriangle, AlertOctagon, AlertCircle, Info,
  CheckCircle, XCircle, Clock, RefreshCw, CheckCheck, MapPin,
  Bell, Search, Calendar, ChevronDown, X, Filter,
} from "lucide-react"
import api from "../services/api"
import { useToast, useConfirm } from "../context/ToastContext"
import usePageTitle from "../hooks/usePageTitle"

/* ── Configuración de severidad ───────────────────────────────────────────── */
const SEVERIDAD = {
  critica: { label: "Crítica", bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: AlertOctagon  },
  alta:    { label: "Alta",    bg: "#fff7ed", color: "#ea580c", border: "#fed7aa", icon: AlertTriangle },
  media:   { label: "Media",   bg: "#fffbeb", color: "#d97706", border: "#fde68a", icon: AlertCircle   },
  baja:    { label: "Baja",    bg: "#f7fee7", color: "#65a30d", border: "#bbf7d0", icon: Info          },
}

const SEV_TABS = [
  { value: "todas",   label: "Todas"   },
  { value: "critica", label: "Crítica" },
  { value: "alta",    label: "Alta"    },
  { value: "media",   label: "Media"   },
  { value: "baja",    label: "Baja"    },
]

const ESTADO_TABS = [
  { value: "todas",     label: "Todas",      icon: Filter       },
  { value: "activa",    label: "Activas",    icon: Bell         },
  { value: "resuelta",  label: "Resueltas",  icon: CheckCircle  },
  { value: "cancelada", label: "Canceladas", icon: XCircle      },
]

const DATE_OPTIONS = [
  { value: "24h",  label: "Últimas 24 h"  },
  { value: "7d",   label: "Últimos 7 días" },
  { value: "30d",  label: "Últimos 30 días"},
  { value: "all",  label: "Todo el tiempo" },
]

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000)
  if (diff < 1)    return "Ahora"
  if (diff < 60)   return `Hace ${diff}m`
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
  return `Hace ${Math.floor(diff / 1440)}d`
}

function filterByDate(list, range) {
  if (range === "all") return list
  const ms = { "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000 }
  const since = Date.now() - ms[range]
  return list.filter(a => new Date(a.fecha).getTime() >= since)
}

/* ── Ilustración vacío ────────────────────────────────────────────────────── */
function EmptyIllustration() {
  return (
    <svg width="110" height="88" viewBox="0 0 110 88" fill="none" aria-hidden="true">
      <rect x="8"  y="28" width="18" height="40" rx="3" fill="var(--solein-border)" />
      <rect x="32" y="18" width="18" height="50" rx="3" fill="var(--solein-border)" />
      <rect x="56" y="38" width="18" height="30" rx="3" fill="var(--solein-border)" />
      <rect x="4"  y="69" width="76" height="3"  rx="1.5" fill="var(--solein-border)" />
      <circle cx="80" cy="38" r="18" stroke="var(--solein-text-muted)" strokeWidth="3.5" fill="none" strokeOpacity=".45" />
      <line x1="93" y1="51" x2="106" y2="64" stroke="var(--solein-text-muted)" strokeWidth="3.5" strokeLinecap="round" strokeOpacity=".45" />
      <circle cx="80" cy="38" r="9"  fill="var(--solein-border)" fillOpacity=".5" />
    </svg>
  )
}

/* ── Tarjeta de métrica ───────────────────────────────────────────────────── */
function StatCard({ icon: Icon, count, label, description, color, bg, border, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0,
        display: "flex", alignItems: "center", gap: 14,
        background: active ? bg : "var(--solein-white)",
        border: `1.5px solid ${active ? border : "var(--solein-border)"}`,
        borderBottom: `3px solid ${active ? color : "var(--solein-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "16px 18px",
        cursor: "pointer", fontFamily: "inherit",
        transition: "all .18s", textAlign: "left",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = border
        e.currentTarget.style.borderBottomColor = color
        e.currentTarget.style.background = bg
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor  = active ? border : "var(--solein-border)"
        e.currentTarget.style.borderBottomColor = active ? color : "var(--solein-border)"
        e.currentTarget.style.background   = active ? bg : "var(--solein-white)"
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
        background: `${color}15`,
        border: `1.5px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.5px" }}>
          {count}
        </p>
        <p style={{ margin: "2px 0 1px", fontSize: 12.5, fontWeight: 600, color: "var(--solein-navy)" }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "var(--solein-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {description}
        </p>
      </div>
    </button>
  )
}

/* ── Tarjeta de alerta ────────────────────────────────────────────────────── */
function AlertCard({ alerta, onResolver }) {
  const sev      = SEVERIDAD[alerta.severidad] || SEVERIDAD.baja
  const SevIcon  = sev.icon
  const [resolving, setResolving] = useState(false)

  const isResolved  = alerta.estado === "resuelta"
  const isCancelled = alerta.estado === "cancelada"
  const isInactive  = isResolved || isCancelled

  const handleResolve = async () => {
    setResolving(true)
    try { await onResolver(alerta.idalerta) }
    finally { setResolving(false) }
  }

  return (
    <div
      className={`alert-card alert-card--${alerta.severidad}${isInactive ? " alert-card--inactive" : ""}`}
      style={{ transition: "box-shadow .2s, transform .15s" }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)"
        if (!isInactive) e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.transform = "none"
      }}
    >
      {/* Ícono de severidad */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        background: isInactive ? "var(--solein-bg)" : `${sev.color}18`,
        border: `1.5px solid ${isInactive ? "var(--solein-border)" : sev.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <SevIcon size={18} color={isInactive ? "var(--solein-text-muted)" : sev.color} />
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Fila superior: badges + tiempo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              background: isInactive ? "var(--solein-bg)" : sev.bg,
              color: isInactive ? "var(--solein-text-muted)" : sev.color,
              border: `1px solid ${isInactive ? "var(--solein-border)" : sev.border}`,
              borderRadius: 20, padding: "2px 10px",
              fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px",
            }}>
              {sev.label}
            </span>
            {isResolved && (
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "#f0fdf4", color: "#16a34a",
                border: "1px solid #bbf7d0",
                borderRadius: 20, padding: "2px 10px", fontSize: 10.5, fontWeight: 600,
              }}>
                <CheckCircle size={11} /> Resuelta
              </span>
            )}
            {isCancelled && (
              <span style={{
                background: "var(--solein-bg)", color: "var(--solein-text-muted)",
                border: "1px solid var(--solein-border)",
                borderRadius: 20, padding: "2px 10px", fontSize: 10.5, fontWeight: 600,
              }}>
                Cancelada
              </span>
            )}
            {alerta.tipoalerta && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: isInactive ? "var(--solein-text-muted)" : "var(--solein-teal)",
                textTransform: "uppercase", letterSpacing: ".3px",
              }}>
                {alerta.tipoalerta.nombre}
              </span>
            )}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--solein-text-muted)", flexShrink: 0 }}>
            <Clock size={12} />
            {timeAgo(alerta.fecha)}
          </span>
        </div>

        {/* Mensaje */}
        <p style={{
          margin: "0 0 10px",
          fontSize: 14, fontWeight: 500, lineHeight: 1.55,
          color: isInactive ? "var(--solein-text-muted)" : "var(--solein-navy)",
        }}>
          {alerta.mensaje}
        </p>

        {/* Pie */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 10,
          borderTop: `1px solid ${isInactive ? "var(--solein-border)" : sev.border}`,
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--solein-text-muted)" }}>
            <MapPin size={12} />
            Instalación&nbsp;
            <strong style={{ color: isInactive ? "var(--solein-text-muted)" : "var(--solein-navy)", fontWeight: 600 }}>
              #{alerta.instalacion_id || alerta.domicilio_id || "—"}
            </strong>
            <span style={{ opacity: .35, margin: "0 2px" }}>·</span>
            {new Date(alerta.fecha).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
          </span>
          {alerta.estado === "activa" && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--solein-white)", color: "#16a34a",
                border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)",
                padding: "5px 14px", fontSize: 12, fontWeight: 600,
                cursor: resolving ? "not-allowed" : "pointer",
                opacity: resolving ? .65 : 1, fontFamily: "inherit",
                transition: "all .15s", boxShadow: "0 1px 3px rgba(0,0,0,.06)",
              }}
              onMouseEnter={e => { if (!resolving) { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#86efac" } }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--solein-white)"; e.currentTarget.style.borderColor = "#bbf7d0" }}
            >
              <CheckCircle size={13} />
              {resolving ? "Resolviendo..." : "Marcar resuelta"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Página principal ─────────────────────────────────────────────────────── */
export default function Alertas() {
  usePageTitle("Alertas")
  const toast   = useToast()
  const confirm = useConfirm()

  const [alertas,    setAlertas]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter,     setFilter]     = useState("todas")
  const [sevFilter,  setSevFilter]  = useState("todas")
  const [resolving,  setResolving]  = useState(false)
  const [search,     setSearch]     = useState("")
  const [dateFilter, setDateFilter] = useState("7d")
  const [dateOpen,   setDateOpen]   = useState(false)
  const [showTip,    setShowTip]    = useState(true)

  const dateRef = useRef(null)

  /* Cerrar date dropdown al hacer click fuera */
  useEffect(() => {
    const handler = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) setDateOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await api.getAlertas()
      setAlertas(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setAlertas([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleResolver = async (id) => {
    await api.resolverAlerta(id)
    setAlertas(prev => prev.map(a => a.idalerta === id ? { ...a, estado: "resuelta" } : a))
  }

  const handleResolverTodas = async () => {
    const activas = alertas.filter(a => a.estado === "activa")
    const ok = await confirm({
      title: "¿Resolver todas las alertas activas?",
      message: `Se marcarán ${activas.length} alerta${activas.length !== 1 ? "s" : ""} como resueltas.`,
      confirmLabel: "Resolver todas",
    })
    if (!ok) return
    setResolving(true)
    try {
      await Promise.all(activas.map(a => api.resolverAlerta(a.idalerta)))
      setAlertas(prev => prev.map(a => a.estado === "activa" ? { ...a, estado: "resuelta" } : a))
      toast(`${activas.length} alerta${activas.length !== 1 ? "s" : ""} resueltas.`, "success")
    } catch {
      toast("Ocurrió un error al resolver las alertas.", "error")
    } finally {
      setResolving(false)
    }
  }

  const clearFilters = () => {
    setFilter("todas")
    setSevFilter("todas")
    setSearch("")
    setDateFilter("7d")
  }

  const hasActiveFilters = filter !== "todas" || sevFilter !== "todas" || search !== "" || dateFilter !== "7d"

  /* Pipeline de filtrado */
  const byDate  = filterByDate(alertas, dateFilter)
  const filtered = byDate
    .filter(a => filter    === "todas" || a.estado    === filter)
    .filter(a => sevFilter === "todas" || a.severidad === sevFilter)
    .filter(a => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        a.mensaje?.toLowerCase().includes(q) ||
        String(a.instalacion_id || "").includes(q) ||
        String(a.domicilio_id   || "").includes(q)
      )
    })

  /* Conteos (sobre alertas sin filtrar por estado/sev/search, solo fecha) */
  const counts = {
    todas:     byDate.length,
    activa:    byDate.filter(a => a.estado === "activa").length,
    resuelta:  byDate.filter(a => a.estado === "resuelta").length,
    cancelada: byDate.filter(a => a.estado === "cancelada").length,
  }
  const sevActiveCounts = Object.fromEntries(
    ["critica","alta","media","baja"].map(s => [
      s, byDate.filter(a => a.estado === "activa" && a.severidad === s).length,
    ])
  )
  const sevCounts = Object.fromEntries(
    ["critica","alta","media","baja"].map(s => [s, byDate.filter(a => a.severidad === s).length])
  )

  const dateLabel = DATE_OPTIONS.find(o => o.value === dateFilter)?.label ?? "Fecha"

  return (
    <div style={{ padding: "32px 36px", width: "100%", maxWidth: "100%", paddingBottom: showTip ? 80 : 32 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--solein-navy)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
            Alertas
          </h1>
          <p style={{ fontSize: 13, color: "var(--solein-text-muted)", margin: 0 }}>
            {loading
              ? "Cargando alertas..."
              : "Monitorea y gestiona las alertas de tus instalaciones en tiempo real."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {counts.activa > 0 && (
            <button
              onClick={handleResolverTodas}
              disabled={resolving}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--solein-navy)", border: "none",
                borderRadius: "var(--radius-md)", padding: "9px 16px",
                fontSize: 13, fontWeight: 600, color: "#fff",
                cursor: resolving ? "not-allowed" : "pointer",
                opacity: resolving ? .7 : 1, fontFamily: "inherit", transition: "all .15s",
              }}
              onMouseEnter={e => { if (!resolving) e.currentTarget.style.background = "var(--solein-navy-hover)" }}
              onMouseLeave={e => e.currentTarget.style.background = "var(--solein-navy)"}
            >
              <CheckCheck size={14} />
              {resolving ? "Resolviendo…" : `Resolver todas (${counts.activa})`}
            </button>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Actualizar"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--solein-white)", border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-md)", padding: "9px 16px",
              fontSize: 13, fontWeight: 500, color: "var(--solein-text-muted)",
              cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--solein-teal)"; e.currentTarget.style.color = "var(--solein-teal)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--solein-border)"; e.currentTarget.style.color = "var(--solein-text-muted)" }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin .7s linear infinite" : "none" }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard
          icon={AlertOctagon}
          count={sevActiveCounts.critica}
          label="Críticas activas"
          description="Requieren atención inmediata"
          color="#dc2626" bg="#fef2f2" border="#fecaca"
          active={sevFilter === "critica" && filter === "activa"}
          onClick={() => {
            setSevFilter(v => v === "critica" ? "todas" : "critica")
            setFilter("activa")
          }}
        />
        <StatCard
          icon={AlertTriangle}
          count={sevActiveCounts.alta}
          label="Altas activas"
          description="Atención prioritaria"
          color="#ea580c" bg="#fff7ed" border="#fed7aa"
          active={sevFilter === "alta" && filter === "activa"}
          onClick={() => {
            setSevFilter(v => v === "alta" ? "todas" : "alta")
            setFilter("activa")
          }}
        />
        <StatCard
          icon={AlertCircle}
          count={sevActiveCounts.media + sevActiveCounts.baja}
          label="Medias / Bajas"
          description="Atención normal"
          color="#d97706" bg="#fffbeb" border="#fde68a"
          active={sevFilter === "media" && filter === "activa"}
          onClick={() => {
            setSevFilter(v => v === "media" ? "todas" : "media")
            setFilter("activa")
          }}
        />
        <StatCard
          icon={CheckCircle}
          count={counts.resuelta}
          label="Resueltas"
          description="Total en el período"
          color="#16a34a" bg="#f0fdf4" border="#bbf7d0"
          active={filter === "resuelta"}
          onClick={() => {
            setFilter(v => v === "resuelta" ? "todas" : "resuelta")
            setSevFilter("todas")
          }}
        />
      </div>

      {/* ── Tabs + filtros ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>

        {/* Tabs de estado con underline */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--solein-border)" }}>
          {ESTADO_TABS.map(tab => {
            const TabIcon = tab.icon
            const active  = filter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "transparent", border: "none",
                  borderBottom: `2px solid ${active ? "var(--solein-teal)" : "transparent"}`,
                  marginBottom: -2,
                  padding: "8px 16px", fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--solein-teal)" : "var(--solein-text-muted)",
                  cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "var(--solein-navy)" }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "var(--solein-text-muted)" }}
              >
                <TabIcon size={13} />
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span style={{
                    background: active ? "var(--solein-teal-bg)" : "var(--solein-border)",
                    color: active ? "var(--solein-teal)" : "var(--solein-text-muted)",
                    borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                  }}>
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Filtro de fecha */}
        <div ref={dateRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDateOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--solein-white)", border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-md)", padding: "7px 12px",
              fontSize: 12.5, fontWeight: 500, color: "var(--solein-text-muted)",
              cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--solein-teal)"; e.currentTarget.style.color = "var(--solein-teal)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--solein-border)"; e.currentTarget.style.color = "var(--solein-text-muted)" }}
          >
            <Calendar size={13} />
            {dateLabel}
            <ChevronDown size={12} style={{ transition: "transform .2s", transform: dateOpen ? "rotate(180deg)" : "none" }} />
          </button>
          {dateOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: "var(--solein-white)", border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)",
              overflow: "hidden", zIndex: 200, minWidth: 160,
            }}>
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setDateFilter(opt.value); setDateOpen(false) }}
                  style={{
                    display: "block", width: "100%", padding: "9px 14px",
                    background: dateFilter === opt.value ? "var(--solein-teal-bg)" : "transparent",
                    border: "none", textAlign: "left", fontSize: 13,
                    fontWeight: dateFilter === opt.value ? 600 : 400,
                    color: dateFilter === opt.value ? "var(--solein-teal)" : "var(--solein-text)",
                    cursor: "pointer", fontFamily: "inherit", transition: "background .12s",
                  }}
                  onMouseEnter={e => { if (dateFilter !== opt.value) e.currentTarget.style.background = "var(--solein-bg)" }}
                  onMouseLeave={e => { if (dateFilter !== opt.value) e.currentTarget.style.background = "transparent" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buscador */}
        <div style={{ position: "relative" }}>
          <Search size={14} style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--solein-text-muted)", pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Buscar alerta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              paddingLeft: 30, paddingRight: search ? 28 : 12,
              paddingTop: 7, paddingBottom: 7,
              border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-md)",
              background: "var(--solein-white)",
              color: "var(--solein-text)",
              fontSize: 12.5, fontFamily: "inherit",
              width: 180, transition: "border-color .2s, width .2s",
              outline: "none",
            }}
            onFocus={e => { e.target.style.borderColor = "var(--solein-teal)"; e.target.style.width = "220px" }}
            onBlur={e =>  { e.target.style.borderColor = "var(--solein-border)"; e.target.style.width = "180px" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                color: "var(--solein-text-muted)", display: "flex",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Chips de severidad ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {SEV_TABS.map(tab => {
          const sev    = SEVERIDAD[tab.value]
          const count  = tab.value === "todas" ? byDate.length : (sevCounts[tab.value] ?? 0)
          const active = sevFilter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setSevFilter(tab.value)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: `1px solid ${active && sev ? sev.border : "var(--solein-border)"}`,
                background: active && sev ? sev.bg : "var(--solein-white)",
                color: active && sev ? sev.color : active ? "var(--solein-navy)" : "var(--solein-text-muted)",
                cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
              }}
            >
              {tab.value !== "todas" && sev && (
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sev.color, flexShrink: 0 }} />
              )}
              {tab.label}
              {count > 0 && <span style={{ opacity: .65 }}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              height: 120, background: "var(--solein-white)",
              border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-lg)", animation: "pulse 1.5s infinite",
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          padding: "52px 20px 44px",
          background: "var(--solein-white)", border: "1px solid var(--solein-border)",
          borderRadius: "var(--radius-lg)",
        }}>
          <EmptyIllustration />
          <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, color: "var(--solein-navy)" }}>
            Sin resultados
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--solein-text-muted)", textAlign: "center" }}>
            No hay alertas que coincidan con los filtros seleccionados.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: 8,
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--solein-white)", border: "1px solid var(--solein-border)",
                borderRadius: "var(--radius-md)", padding: "8px 18px",
                fontSize: 13, fontWeight: 600, color: "var(--solein-text-muted)",
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--solein-teal)"; e.currentTarget.style.color = "var(--solein-teal)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--solein-border)"; e.currentTarget.style.color = "var(--solein-text-muted)" }}
            >
              <Filter size={13} />
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(a => (
            <AlertCard key={a.idalerta} alerta={a} onResolver={handleResolver} />
          ))}
        </div>
      )}

      {/* ── Tip banner ── */}
      {showTip && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--solein-white)",
          border: "1px solid var(--solein-border)",
          borderLeft: "4px solid var(--solein-teal)",
          borderRadius: "var(--radius-md)",
          padding: "11px 16px",
          boxShadow: "var(--shadow-md)",
          zIndex: 500, maxWidth: 560, width: "calc(100% - 80px)",
          fontSize: 13,
        }}>
          <Info size={16} color="var(--solein-teal)" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, color: "var(--solein-text-muted)", flex: 1 }}>
            <strong style={{ color: "var(--solein-teal)" }}>Tip:</strong>{" "}
            Puedes ajustar los filtros de severidad o fecha para encontrar lo que buscas.
          </p>
          <button
            onClick={() => setShowTip(false)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 2,
              color: "var(--solein-text-muted)", display: "flex", flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Estilos locales ── */}
      <style>{`
        .alert-card {
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          display: flex;
          gap: 14px;
          border: 1.5px solid var(--solein-border);
          background: var(--solein-white);
        }
        .alert-card--critica { background: #fef2f2; border-color: #fecaca; }
        .alert-card--alta    { background: #fff7ed; border-color: #fed7aa; }
        .alert-card--media   { background: #fffbeb; border-color: #fde68a; }
        .alert-card--baja    { background: #f7fee7; border-color: #bbf7d0; }
        .alert-card--inactive { background: var(--solein-white) !important; border-color: var(--solein-border) !important; opacity: .72; }

        [data-theme="dark"] .alert-card--critica { background: #2c1010; border-color: #7f1d1d; }
        [data-theme="dark"] .alert-card--alta    { background: #1e1008; border-color: #7c2d12; }
        [data-theme="dark"] .alert-card--media   { background: #1c1500; border-color: #78350f; }
        [data-theme="dark"] .alert-card--baja    { background: #0c1f0c; border-color: #14532d; }
        [data-theme="dark"] .alert-card--inactive { background: var(--solein-white) !important; border-color: var(--solein-border) !important; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
