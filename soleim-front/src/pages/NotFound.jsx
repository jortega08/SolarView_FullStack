import { useNavigate } from "react-router-dom"
import { Home, AlertCircle } from "lucide-react"
import usePageTitle from "../hooks/usePageTitle"

export default function NotFound() {
  usePageTitle("Página no encontrada")
  const navigate = useNavigate()

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100vh", background: "var(--solein-bg)",
      fontFamily: "'Inter', sans-serif", gap: 16, padding: 24,
    }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "var(--solein-teal-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 4,
      }}>
        <AlertCircle size={40} color="var(--solein-teal)" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontSize: 80, fontWeight: 800, color: "var(--solein-navy)",
          margin: 0, lineHeight: 1, letterSpacing: "-4px",
          opacity: .15,
        }}>
          404
        </p>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: "var(--solein-navy)",
          margin: "8px 0 6px", letterSpacing: "-0.3px",
        }}>
          Página no encontrada
        </h1>
        <p style={{ fontSize: 14, color: "var(--solein-text-muted)", margin: 0 }}>
          La ruta que buscas no existe en Solein.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: 8, display: "flex", alignItems: "center", gap: 8,
          background: "var(--solein-navy)", color: "#fff",
          border: "none", borderRadius: "var(--radius-md)", padding: "10px 24px",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", transition: "background .2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#2A3F5A"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--solein-navy)"}
      >
        <Home size={16} />
        Ir al panel
      </button>
    </div>
  )
}
