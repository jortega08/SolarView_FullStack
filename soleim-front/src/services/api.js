const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"

export const getAuthHeaders = () => {
  const token = localStorage.getItem('soleim_token')
  const base = { 'Content-Type': 'application/json' }
  return token ? { ...base, 'Authorization': `Bearer ${token}` } : base
}

// ── Empresa / Instalaciones ──────────────────────────────────────────────────

export const fetchPanelEmpresa = async (empresaId = null) => {
  const params = new URLSearchParams()
  if (empresaId) params.append('empresa_id', empresaId)
  const response = await fetch(
    `${API_BASE_URL}/empresa/panel/?${params}`,
    { headers: getAuthHeaders() }
  )
  return response.json()
}

export const fetchInstalaciones = async () => {
  const response = await fetch(`${API_BASE_URL}/empresa/instalaciones/`, { headers: getAuthHeaders() })
  return response.json()
}

export const fetchDetalleInstalacion = async (id) => {
  const response = await fetch(`${API_BASE_URL}/empresa/instalacion/${id}/`, { headers: getAuthHeaders() })
  return response.json()
}

// ── Analítica ────────────────────────────────────────────────────────────────

export const fetchActivities = async ({ periodo = "year", startDate, endDate, instalacionId } = {}) => {
  const params = new URLSearchParams()
  if (periodo) params.append("periodo", periodo)
  if (startDate) params.append("start_date", startDate)
  if (endDate) params.append("end_date", endDate)
  if (instalacionId) params.append("instalacion_id", instalacionId)

  const response = await fetch(
    `${API_BASE_URL}/analitica/actividades/?${params}`,
    { headers: getAuthHeaders() }
  )
  const data = await response.json()
  return data.data || data
}

export const fetchTendencia = async (instalacionId, dias = 7) => {
  const params = new URLSearchParams({ instalacion_id: instalacionId, dias })
  const response = await fetch(`${API_BASE_URL}/analitica/tendencia/?${params}`, { headers: getAuthHeaders() })
  return response.json()
}

export const fetchComparativa = async (empresaId) => {
  const params = new URLSearchParams({ empresa_id: empresaId })
  const response = await fetch(`${API_BASE_URL}/analitica/comparativa/?${params}`, { headers: getAuthHeaders() })
  return response.json()
}

export const fetchAutonomia = async (instalacionId) => {
  const params = new URLSearchParams({ instalacion_id: instalacionId })
  const response = await fetch(`${API_BASE_URL}/analitica/autonomia/?${params}`, { headers: getAuthHeaders() })
  return response.json()
}

export const fetchBatteryStatus = async (instalacionId = null) => {
  const params = new URLSearchParams()
  if (instalacionId) params.append('instalacion_id', instalacionId)
  const response = await fetch(`${API_BASE_URL}/analitica/bateria/?${params}`, { headers: getAuthHeaders() })
  const data = await response.json()
  return data.data
}

// ── Alertas ──────────────────────────────────────────────────────────────────

export const fetchUltimasAlertas = async (instalacionId = null) => {
  const params = new URLSearchParams()
  if (instalacionId) params.append("instalacion_id", instalacionId)
  const response = await fetch(`${API_BASE_URL}/alertas/ultimas/?${params}`, { headers: getAuthHeaders() })
  return response.json()
}

export const resolverAlerta = async (id) => {
  const response = await fetch(`${API_BASE_URL}/alertas/alertas/${id}/resolver/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return response.json()
}

export const getAlertas = async (filters = {}) => {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/alertas/alertas/?${params}`, { headers: getAuthHeaders() })
  return response.json()
}

// ── Reportes CSV ─────────────────────────────────────────────────────────────

export const descargarReporteConsumo = (instalacionId, dias = 30) => {
  const token = localStorage.getItem('soleim_token')
  const params = new URLSearchParams({ instalacion_id: instalacionId, dias })
  const url = `${API_BASE_URL}/empresa/reporte/consumo/?${params}`
  const a = document.createElement('a')
  a.href = url
  // Token en query param solo para descarga directa; el backend usa AllowAny + check propio
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const descargarReporteAlertas = (instalacionId, dias = 30) => {
  const params = new URLSearchParams({ instalacion_id: instalacionId, dias })
  const url = `${API_BASE_URL}/empresa/reporte/alertas/?${params}`
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Usuarios / Domicilios (legacy, mantener para páginas aún activas) ─────────

export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/`, { headers: getAuthHeaders() })
  return response.json()
}

export const createUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  })
  return response.json()
}

export const updateUser = async (id, userData) => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/${id}/`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  })
  return response.json()
}

export const deleteUser = async (id) => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return response.ok
}

export const getDomicilios = async () => {
  const response = await fetch(`${API_BASE_URL}/core/domicilios/`, { headers: getAuthHeaders() })
  return response.json()
}

export const createDomicilio = async ({ usuario_id, ciudad_id }) => {
  const response = await fetch(`${API_BASE_URL}/core/domicilios/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ usuario_id, ciudad_id }),
  })
  if (!response.ok) throw new Error("Error al crear domicilio")
  return response.json()
}

export const deleteDomicilio = async (id) => {
  const response = await fetch(`${API_BASE_URL}/core/domicilios/${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return response.ok
}

export const getPaises = async () => {
  const response = await fetch(`${API_BASE_URL}/core/paises/`, { headers: getAuthHeaders() })
  return response.json()
}

export const getEstados = async (paisId) => {
  const response = await fetch(`${API_BASE_URL}/core/estados/?pais_id=${paisId}`, { headers: getAuthHeaders() })
  return response.json()
}

export const getCiudades = async (estadoId) => {
  const response = await fetch(`${API_BASE_URL}/core/ciudades/?estado_id=${estadoId}`, { headers: getAuthHeaders() })
  return response.json()
}

export const getTiposAlerta = async () => {
  const response = await fetch(`${API_BASE_URL}/alertas/tipos-alerta/`, { headers: getAuthHeaders() })
  return response.json()
}

export const fetchFacturaMensual = async ({ domicilioId, mes, ano }) => {
  const params = new URLSearchParams()
  params.append("domicilio_id", domicilioId)
  params.append("mes", mes)
  params.append("ano", ano)
  const response = await fetch(`${API_BASE_URL}/factura/mensual/?${params}`, { headers: getAuthHeaders() })
  const data = await response.json()
  if (data.success !== false) return data
  throw new Error(data.error || "Error generando factura")
}

export default {
  fetchPanelEmpresa,
  fetchInstalaciones,
  fetchDetalleInstalacion,
  fetchActivities,
  fetchTendencia,
  fetchComparativa,
  fetchAutonomia,
  fetchBatteryStatus,
  fetchUltimasAlertas,
  resolverAlerta,
  getAlertas,
  descargarReporteConsumo,
  descargarReporteAlertas,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDomicilios,
  createDomicilio,
  deleteDomicilio,
  getPaises,
  getEstados,
  getCiudades,
  getTiposAlerta,
  fetchFacturaMensual,
}
