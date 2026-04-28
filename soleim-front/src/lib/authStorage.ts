const ACCESS_TOKEN_KEY = "soleim_access_token"
const LEGACY_ACCESS_TOKEN_KEY = "soleim_token"
const REFRESH_TOKEN_KEY = "soleim_refresh_token"
const LEGACY_REFRESH_TOKEN_KEY = "soleim_refresh"
const USER_KEY = "soleim_user"

export const authStorageKeys = {
  accessToken: ACCESS_TOKEN_KEY,
  legacyAccessToken: LEGACY_ACCESS_TOKEN_KEY,
  refreshToken: REFRESH_TOKEN_KEY,
  legacyRefreshToken: LEGACY_REFRESH_TOKEN_KEY,
  user: USER_KEY,
} as const

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
}

export function getStoredUser<T>(): T | null {
  try {
    const value = localStorage.getItem(USER_KEY)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export function saveAccessToken(accessToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken)
}

export function saveRefreshToken(refreshToken: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken)
}

export function saveAuthSession(userData: unknown, accessToken: string, refreshToken?: string): void {
  saveAccessToken(accessToken)
  if (refreshToken) saveRefreshToken(refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(userData))
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
