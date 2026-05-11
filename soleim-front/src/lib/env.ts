export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  wsUrl: import.meta.env.VITE_WS_URL ?? "ws://127.0.0.1:8000",
} as const

/**
 * Convierte una ruta relativa de media (ej. "/media/instalaciones/foto.jpg")
 * en una URL absoluta con el host del backend.
 * Si ya es absoluta (http/https/blob) la devuelve sin cambios.
 */
export function absoluteMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
    return path
  }
  const host = env.apiUrl.replace(/\/api\/?$/, "")
  return `${host}${path.startsWith("/") ? "" : "/"}${path}`
}
