import axios from "axios"
import { env } from "@/lib/env"
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  saveAccessToken,
} from "@/lib/authStorage"

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (refreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      })
    }

    original._retry = true
    refreshing = true

    try {
      const refresh = getStoredRefreshToken()
      if (!refresh) throw new Error("no_refresh")
      const { data } = await axios.post(`${env.apiUrl}/auth/refresh/`, { refresh })
      const newToken: string = data.access
      saveAccessToken(newToken)
      apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch (err) {
      processQueue(err, null)
      clearAuthSession()
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
      return Promise.reject(err)
    } finally {
      refreshing = false
    }
  }
)
