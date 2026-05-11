import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Advertir solo cuando un chunk supere 600 kB (el límite por defecto es 500)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /**
         * Dividir vendors en grupos lógicos para que el browser pueda cachearlos
         * de forma independiente. Un cambio en tu código de app no invalida
         * el caché de react, router ni radix-ui.
         */
        manualChunks(id) {
          // ── React core ──────────────────────────────────────────────────────
          if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")) {
            return "vendor-react"
          }

          // ── Router ──────────────────────────────────────────────────────────
          if (id.includes("node_modules/react-router") ||
              id.includes("node_modules/@remix-run/")) {
            return "vendor-router"
          }

          // ── React Query ─────────────────────────────────────────────────────
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-query"
          }

          // ── UI primitives (Radix, Lucide, Sonner, CVA) ──────────────────────
          if (id.includes("node_modules/@radix-ui/") ||
              id.includes("node_modules/lucide-react/") ||
              id.includes("node_modules/sonner/") ||
              id.includes("node_modules/class-variance-authority/") ||
              id.includes("node_modules/clsx/") ||
              id.includes("node_modules/tailwind-merge/")) {
            return "vendor-ui"
          }

          // ── Formularios ─────────────────────────────────────────────────────
          if (id.includes("node_modules/react-hook-form/") ||
              id.includes("node_modules/zod/") ||
              id.includes("node_modules/@hookform/")) {
            return "vendor-forms"
          }

          // ── Fechas ──────────────────────────────────────────────────────────
          if (id.includes("node_modules/date-fns/")) {
            return "vendor-dates"
          }

          // ── HTTP ────────────────────────────────────────────────────────────
          if (id.includes("node_modules/axios/")) {
            return "vendor-http"
          }

          // ── Gráficas livianas (Recharts) ─────────────────────────────────────
          // Recharts se usa en varias páginas; un chunk compartido ahorra descargas.
          if (id.includes("node_modules/recharts/") ||
              id.includes("node_modules/d3-") ||
              id.includes("node_modules/victory-vendor/")) {
            return "vendor-recharts"
          }

          // ── ECharts (pesado ~600 kB) — queda en el chunk de la página analítica
          // No se mueve; ya está lazy-loaded, así el usuario lo descarga
          // solo cuando visita /analitica por primera vez.

          // ── FullCalendar (pesado ~200 kB) — mismo criterio que ECharts
          // Queda en el chunk de /mantenimiento.

          // ── Drag & Drop ──────────────────────────────────────────────────────
          if (id.includes("node_modules/@dnd-kit/")) {
            return "vendor-dnd"
          }

          // ── Exportación (jsPDF, PapaParse) ────────────────────────────────────
          if (id.includes("node_modules/jspdf") ||
              id.includes("node_modules/papaparse/")) {
            return "vendor-export"
          }

          // ── Animaciones ──────────────────────────────────────────────────────
          if (id.includes("node_modules/motion/") ||
              id.includes("node_modules/framer-motion/")) {
            return "vendor-motion"
          }
        },
      },
    },
  },

  server: {
    port: 5174,
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:8000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
