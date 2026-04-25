import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, XCircle, Clock, Filter, RefreshCw } from "lucide-react"
import api from "../services/api"

const SEVERIDAD = {
  critica: { label: "Crítica",     bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  alta:    { label: "Alta",        bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
  media:   { label: "Media",       bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  baja:    { label: "Baja",        bg: "#f7fee7", color: "#65a30d", border: "#bbf7d0" },
}

const ESTADO_TABS = [
  { value: "todas",    label: "Todas" },
  { value: "activa",   label: "Activas" },
  { value: "resuelta", label: "Resueltas" },
  { value: "cancelada",label: "Canceladas" },
]

function AlertCard({ alerta, onResolver }) {
  const sev = SEVERIDAD[alerta.severidad] || SEVERIDAD.baja
  const [resolving, setResolving] = useState(false)

  const handleResolve = async () => {
    setResolving(true)
    try { await onResolver(alerta.idalerta) }
    finally { setResolving(false) }
  }

  return (
    <div style={{
      background: "#fff",
      border: `1px solid var(--solein-border)`,
      borderLeft: `4px solid ${sev.color}`,
      borderRadius: "0 var(--radius-lg) var(--radius-lg) 0",
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      transition: "box-shadow .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            background: sev.bg, color: sev.color,
            border: `1px solid ${sev.border}`,
            borderRadius: 20, padding: "2px 10px",
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".3px"
          }}>
            {sev.label}
          </span>
          {alerta.estado !== "activa" && (
            <span style={{
              background: alerta.estado === "resuelta" ? "#f0fdf4" : "var(--solein-bg)",
              color: alerta.estado === "resuelta" ? "var(--solein-green)" : "var(--solein-text-muted)",
              borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
            }}>
              {alerta.estado === "resuelta" ? "✓ Resuelta" : "Cancelada"}
            </span>
          )}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--solein-text-muted)" }}>
          <Clock size={11} />
          {new Date(alerta.fecha).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </div>

      {/* Tipo */}
      {alerta.tipoalerta && (
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--solein-teal)", textTransform: "uppercase", letterSpacing: ".3px" }}>
          {alerta.tipoalerta.nombre}
        </p>
      )}

      {/* Mensaje */}
      <p style={{ margin: 0, fontSize: 14, color: "var(--solein-navy)", fontWeight: 500, lineHeight: 1.5 }}>
        {alerta.mensaje}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--solein-border)" }}>
        <span style={{ fontSize: 12, color: "var(--solein-text-muted)" }}>
          Instalación ID: <strong style={{ color: "var(--solein-navy)" }}>{alerta.instalacion_id || alerta.domicilio_id || "—"}</strong>
        </span>
        {alerta.estado === "activa" && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#f0fdf4", color: "var(--solein-green)",
              border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)",
              padding: "5px 12px", fontSize: 12, fontWeight: 600,
              cursor: resolving ? "not-allowed" : "pointer",
              opacity: resolving ? .7 : 1, fontFamily: "inherit", transition: "all .15s",
            }}
            onMouseEnter={e => { if (!resolving) e.currentTarget.style.background = "#dcfce7" }}
            onMouseLeave={e => e.currentTarget.style.background = "#f0fdf4"}
          >
            <CheckCircle size={13} />
            {resolving ? "Resolviendo..." : "Marcar resuelta"}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Alertas() {
  const [alertas, setAlertas]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]       = useState("todas")

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

  const filtered = alertas.filter(a => filter === "todas" || a.estado === filter)

  const counts = {
    todas:     alertas.length,
    activa:    alertas.filter(a => a.estado === "activa").length,
    resuelta:  alertas.filter(a => a.estado === "resuelta").length,
    cancelada: alertas.filter(a => a.estado === "cancelada").length,
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <AlertTriangle size={22} color="var(--solein-navy)" />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--solein-navy)", margin: 0, letterSpacing: "-0.3px" }}>
              Alertas
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--solein-text-muted)", margin: 0 }}>
            {loading ? "Cargando alertas..." : `${counts.activa} activa${counts.activa !== 1 ? "s" : ""} · ${counts.resuelta} resuelta${counts.resuelta !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          title="Actualizar"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--solein-white)", border: "1px solid var(--solein-border)",
            borderRadius: "var(--radius-md)", padding: "8px 14px",
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

      {/* Tabs de filtro */}
      <div style={{
        display: "flex", gap: 4,
        background: "var(--solein-bg)", borderRadius: "var(--radius-md)",
        padding: 4, marginBottom: 20, width: "fit-content",
      }}>
        {ESTADO_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: filter === tab.value ? "var(--solein-white)" : "transparent",
              border: "none", borderRadius: "var(--radius-sm)",
              padding: "7px 14px", fontSize: 13, fontWeight: filter === tab.value ? 600 : 500,
              color: filter === tab.value ? "var(--solein-navy)" : "var(--solein-text-muted)",
              cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
              boxShadow: filter === tab.value ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}
          >
            {tab.label}
            {counts[tab.value] > 0 && (
              <span style={{
                background: filter === tab.value ? "var(--solein-teal-bg)" : "var(--solein-border)",
                color: filter === tab.value ? "var(--solein-teal)" : "var(--solein-text-muted)",
                borderRadius: 20, padding: "0 7px", fontSize: 11, fontWeight: 700,
              }}>
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 110, background: "var(--solein-white)", border: "1px solid var(--solein-border)", borderRadius: "var(--radius-lg)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 20px", color: "var(--solein-text-muted)" }}>
          {filter === "activa"
            ? <><CheckCircle size={40} color="var(--solein-green)" strokeWidth={1.5} /><p style={{ margin: 0, fontWeight: 500 }}>Sin alertas activas</p><p style={{ margin: 0, fontSize: 13 }}>Todo está operando correctamente</p></>
            : <><XCircle size={40} strokeWidth={1.5} /><p style={{ margin: 0, fontWeight: 500 }}>Sin resultados para este filtro</p></>
          }
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(a => (
            <AlertCard key={a.idalerta} alerta={a} onResolver={handleResolver} />
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
