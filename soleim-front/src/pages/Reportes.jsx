import { useState, useEffect } from "react"
import { FileDown, BarChart3, AlertTriangle, Loader, Building2 } from "lucide-react"
import { fetchInstalaciones, descargarReporteConsumo, descargarReporteAlertas } from "../services/api"
import "../styles/Reportes.css"

const PERIODOS = [
  { value: 7,   label: "Últimos 7 días" },
  { value: 30,  label: "Últimos 30 días" },
  { value: 90,  label: "Últimos 90 días" },
  { value: 180, label: "Últimos 6 meses" },
]

const ReporteCard = ({ icon: Icon, title, description, color, bg, onDownload, loading }) => (
  <div className="reporte-card">
    <div className="reporte-card-icon" style={{ background: bg }}>
      <Icon size={24} color={color} />
    </div>
    <div className="reporte-card-body">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <button className="reporte-dl-btn" onClick={onDownload} disabled={loading}>
      {loading
        ? <><Loader size={15} className="spin-icon" /> Generando...</>
        : <><FileDown size={15} /> Descargar CSV</>
      }
    </button>
  </div>
)

const Reportes = () => {
  const [instalaciones, setInstalaciones] = useState([])
  const [instalacionId, setInstalacionId] = useState("")
  const [dias, setDias] = useState(30)
  const [loadingConsumo, setLoadingConsumo] = useState(false)
  const [loadingAlertas, setLoadingAlertas] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInstalaciones()
      .then(data => {
        const list = data.results || []
        setInstalaciones(list)
        if (list.length > 0) setInstalacionId(list[0].id)
      })
      .catch(() => setError("No se pudieron cargar las instalaciones."))
      .finally(() => setLoadingList(false))
  }, [])

  const handleConsumo = async () => {
    if (!instalacionId) return
    setLoadingConsumo(true)
    try { descargarReporteConsumo(instalacionId, dias) }
    finally { setTimeout(() => setLoadingConsumo(false), 1500) }
  }

  const handleAlertas = async () => {
    if (!instalacionId) return
    setLoadingAlertas(true)
    try { descargarReporteAlertas(instalacionId, dias) }
    finally { setTimeout(() => setLoadingAlertas(false), 1500) }
  }

  const instSeleccionada = instalaciones.find(i => i.id === Number(instalacionId))

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <h1 className="reportes-title">Reportes</h1>
        <p className="reportes-subtitle">Exporta datos de consumo y alertas en formato CSV para análisis externo</p>
      </div>

      {error && <div className="reportes-error">{error}</div>}

      {/* Filters */}
      <div className="reportes-filters-card">
        <h2 className="filters-title">Parámetros del reporte</h2>
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="instalacion">Instalación</label>
            {loadingList ? (
              <div className="filter-loading"><Loader size={14} className="spin-icon" /> Cargando...</div>
            ) : (
              <select
                id="instalacion"
                value={instalacionId}
                onChange={e => setInstalacionId(e.target.value)}
                className="filter-select"
              >
                {instalaciones.length === 0 && (
                  <option value="">Sin instalaciones asignadas</option>
                )}
                {instalaciones.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre} — {inst.empresa}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="filter-group">
            <label htmlFor="periodo">Período</label>
            <select
              id="periodo"
              value={dias}
              onChange={e => setDias(+e.target.value)}
              className="filter-select"
            >
              {PERIODOS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {instSeleccionada && (
          <div className="filter-summary">
            <Building2 size={14} />
            <span>
              <strong>{instSeleccionada.nombre}</strong> · {instSeleccionada.empresa}
              {instSeleccionada.ciudad ? ` · ${instSeleccionada.ciudad}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Report types */}
      <div className="reportes-section-title">Tipos de reporte disponibles</div>
      <div className="reportes-grid">
        <ReporteCard
          icon={BarChart3}
          title="Consumo energético"
          description={`Registros de consumo solar y eléctrico con potencia y costo — últimos ${dias} días.`}
          color="#3b82f6"
          bg="#eff6ff"
          onDownload={handleConsumo}
          loading={loadingConsumo}
        />
        <ReporteCard
          icon={AlertTriangle}
          title="Historial de alertas"
          description={`Todas las alertas generadas con severidad, causa probable y acción sugerida — últimos ${dias} días.`}
          color="#f59e0b"
          bg="#fffbeb"
          onDownload={handleAlertas}
          loading={loadingAlertas}
        />
      </div>

      <div className="reportes-info">
        Los archivos CSV incluyen BOM UTF-8 para compatibilidad con Microsoft Excel.
        Para reportes de más de 90 días considera filtrar por instalación antes de abrir en Excel.
      </div>
    </div>
  )
}

export default Reportes
