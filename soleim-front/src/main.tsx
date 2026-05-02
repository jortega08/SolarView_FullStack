import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/styles/globals.css"
import App from "./App.tsx"

// Aplicar tema guardado antes de renderizar (evita flash blanco → oscuro)
const savedTheme = localStorage.getItem("solein_theme") ?? "light"
document.documentElement.setAttribute("data-theme", savedTheme)

const root = document.getElementById("root")!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
