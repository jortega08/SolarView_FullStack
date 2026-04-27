import { useState, useEffect } from "react"

const THEME_KEY = "solein_theme"

export default function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === "dark")

  // Aplica el tema y notifica a otras instancias
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light")
    window.dispatchEvent(new CustomEvent("solein:theme-change", { detail: { dark } }))
  }, [dark])

  // Escucha cambios de OTRAS instancias (Layout ↔ Configuracion)
  // React bail-out: setDark con mismo valor no provoca re-render ni nuevo evento
  useEffect(() => {
    const handler = (e) => {
      setDark(prev => (prev !== e.detail.dark ? e.detail.dark : prev))
    }
    window.addEventListener("solein:theme-change", handler)
    return () => window.removeEventListener("solein:theme-change", handler)
  }, [])

  return [dark, setDark]
}
