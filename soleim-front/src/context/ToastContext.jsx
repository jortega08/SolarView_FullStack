import { createContext, useContext, useState, useCallback, useRef } from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

const Ctx = createContext(null)

const VARIANTS = {
  success: { Icon: CheckCircle,   color: "#16a34a",              bg: "#f0fdf4",               border: "#bbf7d0" },
  error:   { Icon: XCircle,       color: "#dc2626",              bg: "#fef2f2",               border: "#fecaca" },
  warning: { Icon: AlertTriangle, color: "#d97706",              bg: "#fffbeb",               border: "#fde68a" },
  info:    { Icon: Info,          color: "var(--solein-teal)",   bg: "var(--solein-teal-bg)", border: "#93c5d8" },
}

function ToastItem({ toast, onRemove }) {
  const v = VARIANTS[toast.type] ?? VARIANTS.info
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      background: v.bg, border: `1px solid ${v.border}`,
      borderRadius: "var(--radius-md)", padding: "12px 14px",
      minWidth: 280, maxWidth: 380,
      boxShadow: "0 4px 20px rgba(0,0,0,.13)",
      animation: "solein-toast-in .22s cubic-bezier(.16,1,.3,1)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <v.Icon size={17} color={v.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{
        fontSize: 13.5, color: "var(--solein-navy)",
        fontWeight: 500, flex: 1, lineHeight: 1.45,
      }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 2, color: "#94a3b8", lineHeight: 0, flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

function ConfirmModal({ cfg, onOk, onCancel }) {
  if (!cfg) return null
  return (
    <div
      onClick={e => e.target === e.currentTarget && onCancel()}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(15,23,42,.45)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: "var(--radius-lg)",
        padding: "28px 28px 24px", maxWidth: 420, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,.22)",
        animation: "solein-modal-in .18s cubic-bezier(.16,1,.3,1)",
        fontFamily: "'Inter', sans-serif",
      }}>
        {cfg.icon && <div style={{ marginBottom: 14 }}>{cfg.icon}</div>}
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--solein-navy)", margin: "0 0 8px" }}>
          {cfg.title}
        </h3>
        {cfg.message && (
          <p style={{ fontSize: 13.5, color: "var(--solein-text-muted)", margin: "0 0 24px", lineHeight: 1.55 }}>
            {cfg.message}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px", borderRadius: "var(--radius-md)",
              background: "var(--solein-bg)", border: "1px solid var(--solein-border)",
              fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              color: "var(--solein-text-muted)", fontFamily: "inherit", transition: "all .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--solein-bg)"}
          >
            {cfg.cancelLabel ?? "Cancelar"}
          </button>
          <button
            onClick={onOk}
            style={{
              padding: "8px 20px", borderRadius: "var(--radius-md)",
              background: cfg.danger ? "#dc2626" : "var(--solein-navy)",
              border: "none", fontSize: 13.5, fontWeight: 600,
              cursor: "pointer", color: "#fff", fontFamily: "inherit", transition: "background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = cfg.danger ? "#b91c1c" : "#2A3F5A"}
            onMouseLeave={e => e.currentTarget.style.background = cfg.danger ? "#dc2626" : "var(--solein-navy)"}
          >
            {cfg.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts,  setToasts] = useState([])
  const [cfg,     setCfg]    = useState(null)
  const resolveRef = useRef(null)

  const toast = useCallback((message, type = "info", duration = 3800) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration)
  }, [])

  const confirm = useCallback((config) =>
    new Promise(res => { resolveRef.current = res; setCfg(config) })
  , [])

  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), [])

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack */}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 8000,
        display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onRemove={dismiss} />
          </div>
        ))}
      </div>

      <ConfirmModal
        cfg={cfg}
        onOk={() => { setCfg(null); resolveRef.current?.(true)  }}
        onCancel={() => { setCfg(null); resolveRef.current?.(false) }}
      />

      <style>{`
        @keyframes solein-toast-in {
          from { opacity: 0; transform: translateX(16px) }
          to   { opacity: 1; transform: translateX(0)    }
        }
        @keyframes solein-modal-in {
          from { opacity: 0; transform: scale(.96) translateY(8px) }
          to   { opacity: 1; transform: scale(1)   translateY(0)   }
        }
      `}</style>
    </Ctx.Provider>
  )
}

export const useToast   = () => useContext(Ctx)?.toast
export const useConfirm = () => useContext(Ctx)?.confirm
