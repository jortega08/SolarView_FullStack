import { createContext, useContext, useState } from 'react'
import { clearApiCache } from '../services/api'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'soleim_token'
const USER_KEY = 'soleim_user'

const formatApiError = (value) => {
  if (Array.isArray(value)) {
    return value.map(formatApiError).filter(Boolean).join(' ')
  }

  if (value && typeof value === 'object') {
    return Object.values(value).map(formatApiError).filter(Boolean).join(' ')
  }

  return typeof value === 'string' ? value : ''
}

const getApiErrorMessage = (data, fallbackMessage) => (
  formatApiError(data?.error) ||
  formatApiError(data?.errors) ||
  formatApiError(data?.detail) ||
  fallbackMessage
)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const _saveSession = (userData, accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }

  const login = async (email, contrasena) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), contrasena }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Credenciales invalidas'))
      }
      _saveSession(data.user, data.tokens.access)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async ({ nombre, email, contrasena, prestador }) => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        nombre: nombre.trim(),
        email: email.trim(),
        contrasena,
      }
      // Bloque opcional: si el usuario eligió crear su empresa prestadora
      // en el mismo registro, el backend la crea y la vincula a usuario.prestador.
      // Ver usuario/serializers.py::RegisterSerializer.
      if (prestador?.nombre?.trim()) {
        payload.prestador_nombre = prestador.nombre.trim()
        if (prestador.nit?.trim()) payload.prestador_nit = prestador.nit.trim()
        if (prestador.ciudad) payload.prestador_ciudad = Number(prestador.ciudad)
      }
      const res = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Error en el registro'))
      }
      _saveSession(data.user, data.tokens.access)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const registerConCodigo = async ({ nombre, email, contrasena, codigo }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/registrar-con-codigo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          contrasena,
          codigo: codigo.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'No se pudo unir al prestador'))
      }
      _saveSession(data.user, data.tokens.access)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    clearApiCache()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, registerConCodigo, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
