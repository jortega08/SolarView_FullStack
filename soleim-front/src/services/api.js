const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"

export const getAuthHeaders = () => {
  const token = localStorage.getItem('soleim_token')
  const base = { 'Content-Type': 'application/json' }
  return token ? { ...base, 'Authorization': `Bearer ${token}` } : base
}

/**
 * Wrapper de fetch que detecta respuestas 401 y despacha
 * el evento global 'solein:session-expired' para que el Layout
 * cierre la sesión limpiamente y redirija al login.
 */
const authFetch = async (url, options = {}) => {
  const { headers: customHeaders, ...rest } = options
  const response = await fetch(url, {
    headers: { ...getAuthHeaders(), ...customHeaders },
    ...rest,
  })
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('solein:session-expired'))
    throw new Error('SESSION_EXPIRED')
  }
  return response
}

// ── Caché en memoria ──────────────────────────────────────────────────────────
// Guarda { data, expires } por clave. Solo para GET. Las mutaciones invalidan
// las entradas relevantes para que el siguiente fetch traiga datos frescos.

const _cache = new Map()

/** Obtiene del caché si existe y no expiró. */
const _cacheGet = (key) => {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { _cache.delete(key); return null }
  return entry.data
}

/** Guarda en caché con TTL en segundos. */
const _cacheSet = (key, data, ttlSeconds) => {
  _cache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 })
}

/** Borra entradas cuya clave empiece con el prefijo dado. */
const _cacheInvalidate = (prefix) => {
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key)
  }
}

/** Limpia toda la caché (usar al cerrar sesión). */
export const clearApiCache = () => _cache.clear()

// ── Empresa / Instalaciones ──────────────────────────────────────────────────

export const fetchPanelEmpresa = async (empresaId = null) => {
  const params = new URLSearchParams()
  if (empresaId) params.append('empresa_id', empresaId)
  const key = `panel:${empresaId ?? 'all'}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/empresa/panel/?${params}`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const fetchInstalaciones = async () => {
  const key = 'instalaciones'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/empresa/instalaciones/`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const fetchDetalleInstalacion = async (id) => {
  const key = `instalacion:${id}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/empresa/instalacion/${id}/`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

// ── Analítica ────────────────────────────────────────────────────────────────

export const fetchActivities = async ({ periodo = "year", startDate, endDate, instalacionId } = {}) => {
  const params = new URLSearchParams()
  if (periodo)       params.append("periodo", periodo)
  if (startDate)     params.append("start_date", startDate)
  if (endDate)       params.append("end_date", endDate)
  if (instalacionId) params.append("instalacion_id", instalacionId)
  const key = `activities:${params}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/analitica/actividades/?${params}`)
  const data = await response.json()
  const result = data.data || data
  _cacheSet(key, result, 30)
  return result
}

export const fetchTendencia = async (instalacionId, dias = 7) => {
  const params = new URLSearchParams({ instalacion_id: instalacionId, dias })
  const key = `tendencia:${instalacionId}:${dias}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/analitica/tendencia/?${params}`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const fetchComparativa = async (empresaId) => {
  const key = `comparativa:${empresaId}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const params = new URLSearchParams({ empresa_id: empresaId })
  const response = await authFetch(`${API_BASE_URL}/analitica/comparativa/?${params}`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const fetchAutonomia = async (instalacionId) => {
  const key = `autonomia:${instalacionId}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const params = new URLSearchParams({ instalacion_id: instalacionId })
  const response = await authFetch(`${API_BASE_URL}/analitica/autonomia/?${params}`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const fetchBatteryStatus = async (instalacionId = null) => {
  const key = `bateria:${instalacionId ?? 'all'}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const params = new URLSearchParams()
  if (instalacionId) params.append('instalacion_id', instalacionId)
  const response = await authFetch(`${API_BASE_URL}/analitica/bateria/?${params}`)
  const data = await response.json()
  _cacheSet(key, data.data, 30)
  return data.data
}

// ── Alertas ──────────────────────────────────────────────────────────────────

export const fetchUltimasAlertas = async (instalacionId = null) => {
  const key = `alertas-ultimas:${instalacionId ?? 'all'}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const params = new URLSearchParams()
  if (instalacionId) params.append("instalacion_id", instalacionId)
  const response = await authFetch(`${API_BASE_URL}/alertas/ultimas/?${params}`)
  const data = await response.json()
  _cacheSet(key, data, 15)
  return data
}

export const resolverAlerta = async (id) => {
  const response = await authFetch(`${API_BASE_URL}/alertas/alertas/${id}/resolver/`, { method: 'POST' })
  // Invalidar alertas para que la siguiente carga traiga datos frescos
  _cacheInvalidate('alertas')
  _cacheInvalidate('panel:')
  return response.json()
}

export const getAlertas = async (filters = {}) => {
  const params = new URLSearchParams(filters)
  const key = `alertas-list:${params}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/alertas/alertas/?${params}`)
  const data = await response.json()
  _cacheSet(key, data, 15)
  return data
}

// ── Reportes CSV ─────────────────────────────────────────────────────────────

export const fetchMiPrestador = async () => {
  const key = 'mi-prestador'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/mi-prestador/`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const updateMiPrestador = async (payload) => {
  const response = await authFetch(`${API_BASE_URL}/core/mi-prestador/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  _cacheInvalidate('mi-prestador')
  return data
}

export const fetchEquipoPrestador = async () => {
  const key = 'equipo-prestador'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/equipo-prestador/`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const quitarAccesoEmpleado = async (idusuario) => {
  const response = await authFetch(`${API_BASE_URL}/core/equipo-prestador/${idusuario}/quitar-acceso/`, {
    method: 'POST',
  })
  const data = await response.json()
  _cacheInvalidate('equipo-prestador')
  return data
}

export const fetchInvitaciones = async () => {
  const key = 'invitaciones-prestador'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/invitaciones/`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const crearInvitacion = async (payload) => {
  const response = await authFetch(`${API_BASE_URL}/core/invitaciones/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  _cacheInvalidate('invitaciones-prestador')
  return data
}

export const revocarInvitacion = async (id) => {
  const response = await authFetch(`${API_BASE_URL}/core/invitaciones/${id}/`, {
    method: 'DELETE',
  })
  _cacheInvalidate('invitaciones-prestador')
  return response.ok
}

export const descargarReporteConsumo = (instalacionId, dias = 30) => {
  const params = new URLSearchParams({ instalacion_id: instalacionId, dias })
  const a = document.createElement('a')
  a.href = `${API_BASE_URL}/empresa/reporte/consumo/?${params}`
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const descargarReporteAlertas = (instalacionId, dias = 30) => {
  const params = new URLSearchParams({ instalacion_id: instalacionId, dias })
  const a = document.createElement('a')
  a.href = `${API_BASE_URL}/empresa/reporte/alertas/?${params}`
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const getUsers = async () => {
  const key = 'usuarios'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/usuarios/`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const createUser = async (userData) => {
  const response = await authFetch(`${API_BASE_URL}/core/usuarios/`, {
    method: "POST",
    body: JSON.stringify(userData),
  })
  _cacheInvalidate('usuarios')
  return response.json()
}

export const updateUser = async (id, userData) => {
  const response = await authFetch(`${API_BASE_URL}/core/usuarios/${id}/`, {
    method: "PUT",
    body: JSON.stringify(userData),
  })
  _cacheInvalidate('usuarios')
  return response.json()
}

export const deleteUser = async (id) => {
  const response = await authFetch(`${API_BASE_URL}/core/usuarios/${id}/`, { method: "DELETE" })
  _cacheInvalidate('usuarios')
  return response.ok
}

// ── Domicilios ────────────────────────────────────────────────────────────────

export const getDomicilios = async () => {
  const key = 'domicilios'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/domicilios/`)
  const data = await response.json()
  _cacheSet(key, data, 30)
  return data
}

export const createDomicilio = async ({ usuario_id, ciudad_id }) => {
  const response = await authFetch(`${API_BASE_URL}/core/domicilios/`, {
    method: "POST",
    body: JSON.stringify({ usuario_id, ciudad_id }),
  })
  if (!response.ok) throw new Error("Error al crear domicilio")
  _cacheInvalidate('domicilios')
  return response.json()
}

export const deleteDomicilio = async (id) => {
  const response = await authFetch(`${API_BASE_URL}/core/domicilios/${id}/`, { method: "DELETE" })
  _cacheInvalidate('domicilios')
  return response.ok
}

export const getPaises = async () => {
  const key = 'paises'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/paises/`)
  const data = await response.json()
  _cacheSet(key, data, 300) // 5 min — datos casi estáticos
  return data
}

export const getEstados = async (paisId) => {
  const key = `estados:${paisId}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/estados/?pais_id=${paisId}`)
  const data = await response.json()
  _cacheSet(key, data, 300)
  return data
}

export const getCiudades = async (estadoId) => {
  const key = `ciudades:${estadoId}`
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/core/ciudades/?estado_id=${estadoId}`)
  const data = await response.json()
  _cacheSet(key, data, 300)
  return data
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export const getTiposAlerta = async () => {
  const key = 'tipos-alerta'
  const cached = _cacheGet(key)
  if (cached) return cached
  const response = await authFetch(`${API_BASE_URL}/alertas/tipos-alerta/`)
  const data = await response.json()
  _cacheSet(key, data, 300)
  return data
}

export const fetchFacturaMensual = async ({ domicilioId, mes, ano }) => {
  const params = new URLSearchParams()
  params.append("domicilio_id", domicilioId)
  params.append("mes", mes)
  params.append("ano", ano)
  const response = await authFetch(`${API_BASE_URL}/factura/mensual/?${params}`)
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
  fetchMiPrestador,
  updateMiPrestador,
  fetchEquipoPrestador,
  quitarAccesoEmpleado,
  fetchInvitaciones,
  crearInvitacion,
  revocarInvitacion,
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
  clearApiCache,
}
