import { useState } from "react"
import { User, Bell, Shield, Save, CheckCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import "../styles/Configuracion.css"

const ROL_LABELS = {
  admin_empresa: "Administrador de empresa",
  operador: "Operador",
  viewer: "Visor",
  admin: "Super admin",
}

const THRESHOLD_KEY = "soleim_alert_thresholds"

function loadThresholds() {
  try {
    return JSON.parse(localStorage.getItem(THRESHOLD_KEY)) || { bateria_critica: 15, bateria_advertencia: 30 }
  } catch {
    return { bateria_critica: 15, bateria_advertencia: 30 }
  }
}

const Configuracion = () => {
  const { user } = useAuth()
  const [thresholds, setThresholds] = useState(loadThresholds)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem(THRESHOLD_KEY, JSON.stringify(thresholds))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="config-page">
      <div className="config-header">
        <h1 className="config-title">Configuración</h1>
        <p className="config-subtitle">Ajusta tus preferencias y umbrales de alerta</p>
      </div>

      {/* User profile */}
      <div className="config-card">
        <div className="config-card-header">
          <User size={18} color="var(--solein-teal)" />
          <h2>Perfil de usuario</h2>
        </div>
        <div className="profile-grid">
          <div className="profile-field">
            <label>Nombre</label>
            <div className="profile-value">{user?.nombre || "—"}</div>
          </div>
          <div className="profile-field">
            <label>Email</label>
            <div className="profile-value">{user?.email || "—"}</div>
          </div>
          <div className="profile-field">
            <label>Rol</label>
            <div className="profile-value">
              <span className="role-badge">
                <Shield size={13} />
                {ROL_LABELS[user?.rol] || user?.rol || "Usuario"}
              </span>
            </div>
          </div>
        </div>
        <p className="config-note">
          Para cambiar tu nombre, email o contraseña contacta al administrador de tu empresa.
        </p>
      </div>

      {/* Alert thresholds */}
      <div className="config-card">
        <div className="config-card-header">
          <Bell size={18} color="var(--solein-gold-dark)" />
          <h2>Umbrales de alerta de batería</h2>
        </div>
        <p className="config-description">
          Define los porcentajes de carga a partir de los cuales se generan alertas automáticas.
        </p>
        <div className="threshold-grid">
          <div className="threshold-item">
            <label htmlFor="critica">
              Alerta crítica (%)
              <span className="threshold-hint">Se genera alerta de severidad alta</span>
            </label>
            <div className="threshold-input-row">
              <input
                id="critica"
                type="range"
                min={5}
                max={40}
                step={1}
                value={thresholds.bateria_critica}
                onChange={e => setThresholds(t => ({ ...t, bateria_critica: +e.target.value }))}
                style={{ "--pct": `${((thresholds.bateria_critica - 5) / 35) * 100}%` }}
              />
              <span className="threshold-val critical">{thresholds.bateria_critica}%</span>
            </div>
          </div>
          <div className="threshold-item">
            <label htmlFor="advertencia">
              Advertencia (%)
              <span className="threshold-hint">Se genera alerta de severidad media</span>
            </label>
            <div className="threshold-input-row">
              <input
                id="advertencia"
                type="range"
                min={20}
                max={60}
                step={1}
                value={thresholds.bateria_advertencia}
                onChange={e => setThresholds(t => ({ ...t, bateria_advertencia: +e.target.value }))}
                style={{ "--pct": `${((thresholds.bateria_advertencia - 20) / 40) * 100}%` }}
              />
              <span className="threshold-val warning">{thresholds.bateria_advertencia}%</span>
            </div>
          </div>
        </div>

        <div className="config-actions">
          <button className={`save-btn${saved ? " saved" : ""}`} onClick={handleSave}>
            {saved ? (
              <><CheckCircle size={16} /> Guardado</>
            ) : (
              <><Save size={16} /> Guardar preferencias</>
            )}
          </button>
          {saved && <span className="saved-hint">Los cambios se aplican al recargar.</span>}
        </div>
      </div>

      {/* Version info */}
      <div className="config-card config-card-flat">
        <div className="config-card-header">
          <Shield size={18} color="#94a3b8" />
          <h2>Sistema</h2>
        </div>
        <div className="sys-grid">
          <div className="sys-item"><span>Plataforma</span><strong>Soleim B2B</strong></div>
          <div className="sys-item"><span>Versión</span><strong>2.0</strong></div>
          <div className="sys-item"><span>Entorno</span><strong>Producción</strong></div>
        </div>
      </div>
    </div>
  )
}

export default Configuracion
