import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://django:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://django:8000",
        ws: true,
      },
    },
  },
})
