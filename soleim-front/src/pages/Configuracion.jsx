import { useState } from "react"
import { User, Bell, Shield, Save, CheckCircle, Moon, Sun } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import usePageTitle from "../hooks/usePageTitle"
import useDarkMode from "../hooks/useDarkMode"
import "../styles/Configuracion.css"

const ROL_LABELS = {
  admin_empresa: "Administrador de empresa",
  operador:      "Operador",
  viewer:        "Visor",
  admin:         "Super admin",
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
  usePageTitle("Configuración")
  const { user } = useAuth()
  const [isDark, setIsDark] = useDarkMode()
  const [thresholds,     setThresholds]     = useState(loadThresholds)
  const [saved,          setSaved]          = useState(false)
  // Estado de texto libre para cada input — solo se valida en onBlur
  const [rawCritica,     setRawCritica]     = useState(() => String(loadThresholds().bateria_critica))
  const [rawAdvertencia, setRawAdvertencia] = useState(() => String(loadThresholds().bateria_advertencia))

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

      {/* ── Perfil de usuario ────────────────────────────────────────────── */}
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

      {/* ── Apariencia ───────────────────────────────────────────────────── */}
      <div className="config-card">
        <div className="config-card-header">
          {isDark ? <Moon size={18} color="var(--solein-teal)" /> : <Sun size={18} color="var(--solein-gold-dark)" />}
          <h2>Apariencia</h2>
        </div>

        <div className="appearance-row">
          <div className="appearance-info">
            <p className="appearance-label">Modo oscuro</p>
            <p className="appearance-hint">
              {isDark ? "Interfaz con fondo oscuro activada" : "Interfaz con fondo claro activada"}
            </p>
          </div>

          {/* Toggle switch */}
          <button
            role="switch"
            aria-checked={isDark}
            onClick={() => setIsDark(v => !v)}
            className={`dark-toggle${isDark ? " dark-toggle--on" : ""}`}
            title={isDark ? "Desactivar modo oscuro" : "Activar modo oscuro"}
          >
            <span className="dark-toggle__thumb">
              {isDark
                ? <Moon  size={11} color="#3F687A" />
                : <Sun   size={11} color="#E0B63D" />
              }
            </span>
          </button>
        </div>
      </div>

      {/* ── Umbrales de alerta ───────────────────────────────────────────── */}
      <div className="config-card">
        <div className="config-card-header">
          <Bell size={18} color="var(--solein-gold-dark)" />
          <h2>Umbrales de alerta de batería</h2>
        </div>
        <p className="config-description">
          Define los porcentajes de carga en que se generan alertas automáticas.
        </p>

        {/* Barra de zonas visual */}
        <div className="zones-bar-wrap">
          <div className="zones-bar">
            <div
              className="zones-bar__seg zones-bar__seg--critical"
              style={{ width: `${thresholds.bateria_critica}%` }}
            >
              {thresholds.bateria_critica >= 8 && <span>{thresholds.bateria_critica}%</span>}
            </div>
            <div
              className="zones-bar__seg zones-bar__seg--warning"
              style={{ width: `${thresholds.bateria_advertencia - thresholds.bateria_critica}%` }}
            >
              {(thresholds.bateria_advertencia - thresholds.bateria_critica) >= 8 && (
                <span>{thresholds.bateria_advertencia}%</span>
              )}
            </div>
            <div className="zones-bar__seg zones-bar__seg--safe" style={{ flex: 1 }}>
              <span>100%</span>
            </div>
          </div>
          <div className="zones-bar-legend">
            <span className="zones-bar-legend__item zones-bar-legend__item--critical">Crítico</span>
            <span className="zones-bar-legend__item zones-bar-legend__item--warning">Advertencia</span>
            <span className="zones-bar-legend__item zones-bar-legend__item--safe">Seguro</span>
          </div>
        </div>

        {/* Tarjetas de zona */}
        <div className="zone-cards">
          {/* Zona crítica */}
          <div className="zone-card zone-card--critical">
            <div className="zone-card__top">
              <span className="zone-card__dot" />
              <span className="zone-card__title">Crítico</span>
            </div>
            <p className="zone-card__range">0 % — {thresholds.bateria_critica} %</p>
            <p className="zone-card__desc">Alerta de severidad alta</p>
            <div className="zone-card__field">
              <label htmlFor="critica">Umbral</label>
              <div className="zone-card__input-wrap">
                <input
                  id="critica"
                  type="number"
                  min={5}
                  max={thresholds.bateria_advertencia - 5}
                  step={1}
                  value={rawCritica}
                  onChange={e => setRawCritica(e.target.value)}
                  onBlur={() => {
                    const parsed  = parseInt(rawCritica, 10)
                    const fallback = thresholds.bateria_critica
                    const next    = isNaN(parsed)
                      ? fallback
                      : Math.max(5, Math.min(parsed, thresholds.bateria_advertencia - 5))
                    setThresholds({ ...thresholds, bateria_critica: next })
                    setRawCritica(String(next))
                  }}
                />
                <span>%</span>
              </div>
            </div>
          </div>

          {/* Zona advertencia */}
          <div className="zone-card zone-card--warning">
            <div className="zone-card__top">
              <span className="zone-card__dot" />
              <span className="zone-card__title">Advertencia</span>
            </div>
            <p className="zone-card__range">{thresholds.bateria_critica} % — {thresholds.bateria_advertencia} %</p>
            <p className="zone-card__desc">Alerta de severidad media</p>
            <div className="zone-card__field">
              <label htmlFor="advertencia">Umbral</label>
              <div className="zone-card__input-wrap">
                <input
                  id="advertencia"
                  type="number"
                  min={thresholds.bateria_critica + 5}
                  max={60}
                  step={1}
                  value={rawAdvertencia}
                  onChange={e => setRawAdvertencia(e.target.value)}
                  onBlur={() => {
                    const parsed   = parseInt(rawAdvertencia, 10)
                    const fallback = thresholds.bateria_advertencia
                    const next     = isNaN(parsed)
                      ? fallback
                      : Math.max(thresholds.bateria_critica + 5, Math.min(parsed, 60))
                    setThresholds({ ...thresholds, bateria_advertencia: next })
                    setRawAdvertencia(String(next))
                  }}
                />
                <span>%</span>
              </div>
            </div>
          </div>

          {/* Zona segura */}
          <div className="zone-card zone-card--safe">
            <div className="zone-card__top">
              <span className="zone-card__dot" />
              <span className="zone-card__title">Seguro</span>
            </div>
            <p className="zone-card__range">{thresholds.bateria_advertencia} % — 100 %</p>
            <p className="zone-card__desc">Operación normal sin alertas</p>
            <div className="zone-card__field zone-card__field--static">
              <label>Umbral</label>
              <span className="zone-card__static-val">Automático</span>
            </div>
          </div>
        </div>

        <div className="config-actions">
          <button className={`save-btn${saved ? " saved" : ""}`} onClick={handleSave}>
            {saved
              ? <><CheckCircle size={16} /> Guardado</>
              : <><Save size={16} /> Guardar preferencias</>
            }
          </button>
          {saved && <span className="saved-hint">Los cambios se aplican al recargar.</span>}
        </div>
      </div>

      {/* ── Sistema ──────────────────────────────────────────────────────── */}
      <div className="config-card config-card-flat">
        <div className="config-card-header">
          <Shield size={18} color="#94a3b8" />
          <h2>Sistema</h2>
        </div>
        <div className="sys-grid">
          <div className="sys-item"><span>Plataforma</span><strong>Solein B2B</strong></div>
          <div className="sys-item"><span>Versión</span><strong>2.0</strong></div>
          <div className="sys-item"><span>Entorno</span><strong>Producción</strong></div>
        </div>
      </div>
    </div>
  )
}

export default Configuracion
