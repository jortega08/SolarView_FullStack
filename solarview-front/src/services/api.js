const API_BASE_URL = "http://127.0.0.1:8000/api"
const DOMICILIO_ID = 1

export const fetchActivities = async ({ periodo = "year", startDate, endDate } = {}) => {
  try {
    const params = new URLSearchParams()
    params.append("domicilio_id", DOMICILIO_ID)
    if (periodo) params.append("periodo", periodo)
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)

    const response = await fetch(
      `${API_BASE_URL}/analitica/actividades/?${params.toString()}`
    )
    const data = await response.json()
    return data.data || data
  } catch (error) {
    console.error("Error fetching activities:", error)
    throw error
  }
}

export const fetchDashboardData = async (periodo = "year", range = null) => {
  try {
    const [statsRes, activitiesData, tasksRes] = await Promise.all([
      fetch(`${API_BASE_URL}/analitica/estadisticas/?domicilio_id=${DOMICILIO_ID}`),
      fetchActivities({
        periodo,
        startDate: range?.startISO,
        endDate: range?.endISO,
      }),
      fetch(`${API_BASE_URL}/analitica/tareas/?domicilio_id=${DOMICILIO_ID}`),
    ])

    const stats = await statsRes.json()
    const tasks = await tasksRes.json()

    return {
      stats: stats.data || stats,
      activities: activitiesData,
      tasks: tasks.data || tasks,
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw error
  }
}

export const fetchBatteryStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analitica/bateria/?domicilio_id=${DOMICILIO_ID}`)
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Error fetching battery status:", error)
    throw error
  }
}

export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/`)
  return response.json()
}

export const createUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  return response.json()
}

export const updateUser = async (id, userData) => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  return response.json()
}

export const deleteUser = async (id) => {
  const response = await fetch(`${API_BASE_URL}/core/usuarios/${id}/`, {
    method: "DELETE",
  })
  return response.ok
}

export const getDomicilios = async () => {
  const response = await fetch(`${API_BASE_URL}/core/domicilios/`)
  return response.json()
}

export const createDomicilio = async (domicilioData) => {
  const response = await fetch(`${API_BASE_URL}/core/domicilios/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(domicilioData),
  })
  return response.json()
}

export const updateDomicilio = async (id, domicilioData) => {
  const response = await fetch(`${API_BASE_URL}/core/domicilios/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(domicilioData),
  })
  return response.json()
}

export const deleteDomicilio = async (id) => {
  const response = await fetch(`${API_BASE_URL}/core/domicilios/${id}/`, {
    method: "DELETE",
  })
  return response.ok
}

export const getPaises = async () => {
  const response = await fetch(`${API_BASE_URL}/core/paises/`)
  return response.json()
}

export const getEstados = async (paisId) => {
  const response = await fetch(`${API_BASE_URL}/core/estados/?pais_id=${paisId}`)
  return response.json()
}

export const getCiudades = async (estadoId) => {
  const response = await fetch(`${API_BASE_URL}/core/ciudades/?estado_id=${estadoId}`)
  return response.json()
}

export const getAlertas = async (filters = {}) => {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/alertas/alertas/?${params}`)
  return response.json()
}

export const createAlerta = async (alertaData) => {
  const response = await fetch(`${API_BASE_URL}/alertas/alertas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alertaData),
  })
  return response.json()
}

export const updateAlerta = async (id, alertaData) => {
  const response = await fetch(`${API_BASE_URL}/alertas/alertas/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alertaData),
  })
  return response.json()
}

export const deleteAlerta = async (id) => {
  const response = await fetch(`${API_BASE_URL}/alertas/alertas/${id}/`, {
    method: "DELETE",
  })
  return response.ok
}

export const getTiposAlerta = async () => {
  const response = await fetch(`${API_BASE_URL}/alertas/tipos-alerta/`)
  return response.json()
}

export const getAlertasActivasCount = async (domicilioId = null) => {
  const url = domicilioId
    ? `${API_BASE_URL}/alertas/alertas/activas/count/?domicilio_id=${domicilioId}`
    : `${API_BASE_URL}/alertas/alertas/activas/count/`
  const response = await fetch(url)
  return response.json()
}

export default {
  fetchDashboardData,
  fetchBatteryStatus,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDomicilios,
  createDomicilio,
  updateDomicilio,
  deleteDomicilio,
  getPaises,
  getEstados,
  getCiudades,
  getAlertas,
  createAlerta,
  updateAlerta,
  deleteAlerta,
  getTiposAlerta,
  getAlertasActivasCount,
}
