export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api",
  wsUrl: import.meta.env.VITE_WS_URL ?? "ws://127.0.0.1:8000",
} as const
