import { useState } from "react"
import { authService } from "@/services/auth.service"
import { apiClient } from "@/services/apiClient"
import { AuthContext } from "./auth-context"
import type { ApiUser } from "@/types/api"
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  saveAuthSession,
} from "@/lib/authStorage"

function formatApiError(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatApiError).filter(Boolean).join(" ")
  if (value && typeof value === "object")
    return Object.values(value).map(formatApiError).filter(Boolean).join(" ")
  return typeof value === "string" ? value : ""
}

function getApiErrorMessage(data: Record<string, unknown> | null, fallback: string): string {
  return (
    formatApiError(data?.error) ||
    formatApiError(data?.errors) ||
    formatApiError(data?.detail) ||
    fallback
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser<ApiUser>())
  const [token, setToken] = useState<string | null>(() => getStoredAccessToken())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const persistSession = (userData: ApiUser, accessToken: string, refreshToken?: string) => {
    saveAuthSession(userData, accessToken, refreshToken)
    setToken(accessToken)
    setUser(userData)
  }

  const login = async (email: string, contrasena: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.login(email.trim(), contrasena)
      if (!data.success) throw new Error(getApiErrorMessage(data as unknown as Record<string, unknown>, "Credenciales inválidas"))
      persistSession(data.user, data.tokens.access, data.tokens.refresh)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión"
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (nombre: string, email: string, contrasena: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.register(nombre.trim(), email.trim(), contrasena)
      if (!data.success) throw new Error(getApiErrorMessage(data as unknown as Record<string, unknown>, "Error en el registro"))
      persistSession(data.user, data.tokens.access, data.tokens.refresh)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse"
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    const refresh = getStoredRefreshToken()
    authService.logout(refresh)
    clearAuthSession()
    setToken(null)
    setUser(null)
  }

  const updateUser = async (patch: Partial<ApiUser>) => {
    if (!user) throw new Error("No hay sesión activa")
    const userId = user.idusuario ?? user.id
    const { data } = await apiClient.patch<ApiUser>(`/core/usuarios/${userId}/`, patch)
    const updated = { ...user, ...data }
    saveAuthSession(updated, getStoredAccessToken() ?? "", getStoredRefreshToken() ?? undefined)
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, isAuthenticated: !!token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
