import { Component } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("[Solein ErrorBoundary]", error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "var(--solein-bg)",
        fontFamily: "'Inter', sans-serif", gap: 16, padding: 32,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#fef2f2",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AlertCircle size={36} color="#dc2626" strokeWidth={1.5} />
        </div>

        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--solein-navy)", margin: "0 0 8px" }}>
            Algo salió mal
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--solein-text-muted)", margin: "0 0 6px", lineHeight: 1.5 }}>
            Ocurrió un error inesperado en esta sección de Solein.
          </p>
          {this.state.error?.message && (
            <p style={{
              fontSize: 12, color: "#94a3b8",
              background: "#f8fafc", borderRadius: 6,
              padding: "6px 12px", fontFamily: "monospace",
              margin: "0 0 20px", wordBreak: "break-all",
            }}>
              {this.state.error.message}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--solein-navy)", color: "#fff",
              border: "none", borderRadius: "var(--radius-md)", padding: "9px 20px",
              fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <RefreshCw size={15} />
            Reintentar
          </button>
          <button
            onClick={() => { window.location.href = "/" }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--solein-bg)", color: "var(--solein-text-muted)",
              border: "1px solid var(--solein-border)",
              borderRadius: "var(--radius-md)", padding: "9px 20px",
              fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }
}
