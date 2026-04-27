import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import usePageTitle from '../hooks/usePageTitle'
import '../styles/Auth.css'

function SoleinMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M30 9 C30 9 22 8 16 13.5 C10 19 16 24 20 21.5" stroke="#E0B63D" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <path d="M20 21.5 C24 19 30 23.5 25 29 C20 34.5 11 33 11 33" stroke="#3F687A" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      <circle cx="30" cy="9"    r="2.8" fill="#E0B63D"/>
      <circle cx="20" cy="21.5" r="2.8" fill="#9B7720"/>
      <circle cx="11" cy="33"   r="2.8" fill="#3F687A"/>
    </svg>
  )
}

function SolarIllustration() {
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      {/* Outer rings */}
      <circle cx="120" cy="120" r="108" stroke="rgba(224,182,61,0.06)"  strokeWidth="1"/>
      <circle cx="120" cy="120" r="82"  stroke="rgba(63,104,122,0.14)"  strokeWidth="1"/>
      <circle cx="120" cy="120" r="56"  stroke="rgba(224,182,61,0.18)"  strokeWidth="1"/>

      {/* Sun core */}
      <circle cx="120" cy="120" r="28"  stroke="#E0B63D" strokeWidth="2"  opacity="0.85"/>
      <circle cx="120" cy="120" r="18"  fill="rgba(224,182,61,0.10)"/>
      <circle cx="120" cy="120" r="6"   fill="#E0B63D"   opacity="0.9"/>

      {/* Cardinal rays */}
      <line x1="120" y1="84"  x2="120" y2="62"  stroke="#E0B63D" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>
      <line x1="120" y1="156" x2="120" y2="178" stroke="#E0B63D" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>
      <line x1="84"  y1="120" x2="62"  y2="120" stroke="#E0B63D" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>
      <line x1="156" y1="120" x2="178" y2="120" stroke="#E0B63D" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>

      {/* Diagonal rays */}
      <line x1="100" y1="100" x2="84"  y2="84"  stroke="#E0B63D" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <line x1="140" y1="100" x2="156" y2="84"  stroke="#E0B63D" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <line x1="100" y1="140" x2="84"  y2="156" stroke="#E0B63D" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <line x1="140" y1="140" x2="156" y2="156" stroke="#E0B63D" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>

      {/* Energy flow arcs */}
      <path d="M 30 185 Q 120 85  210 160" stroke="#3F687A" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55"/>
      <path d="M 18 148 Q 120 48  222 132" stroke="#3F687A" strokeWidth="1"   fill="none" strokeLinecap="round" opacity="0.28"/>

      {/* Node dots */}
      <circle cx="30"  cy="185" r="3.5" fill="#3F687A" opacity="0.65"/>
      <circle cx="210" cy="160" r="3.5" fill="#3F687A" opacity="0.65"/>
      <circle cx="120" cy="92"  r="2.5" fill="#3F687A" opacity="0.35"/>

      {/* Corner accent marks */}
      <circle cx="38"  cy="38"  r="2" fill="rgba(224,182,61,0.25)"/>
      <circle cx="202" cy="38"  r="2" fill="rgba(224,182,61,0.25)"/>
      <circle cx="38"  cy="202" r="2" fill="rgba(63,104,122,0.35)"/>
      <circle cx="202" cy="202" r="2" fill="rgba(63,104,122,0.35)"/>
    </svg>
  )
}

export default function Login() {
  usePageTitle("Iniciar sesión")
  const [email,      setEmail]    = useState('')
  const [contrasena, setPass]     = useState('')
  const [showPass,   setShowPass] = useState(false)
  const [err,        setErr]      = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      await login(email, contrasena)
      navigate('/')
    } catch (error) {
      setErr(error.message)
    }
  }

  return (
    <div className="auth-layout">

      {/* ── Panel izquierdo: formulario ─────────────────────────────────── */}
      <div className="auth-form-panel">

        {/* Logo ancla arriba */}
        <div className="auth-logo-anchor">
          <SoleinMark size={30} />
          <span className="auth-logo-name">Solein</span>
        </div>

        {/* Formulario centrado */}
        <div className="auth-form-container">
          <h2 className="auth-heading">Bienvenido de vuelta.</h2>
          <p className="auth-subtitle">Accede a tu panel de control energético</p>

          {err && <div className="auth-error">{err}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-pass">Contraseña</label>
                <span className="auth-forgot">¿Olvidaste tu contraseña?</span>
              </div>
              <div className="input-password-wrap">
                <input
                  id="login-pass"
                  type={showPass ? "text" : "password"}
                  value={contrasena}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-switch">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>

        {/* Footer discreto abajo */}
        <p className="auth-panel-footer">
          © {new Date().getFullYear()} Solein · Monitoreo energético solar
        </p>
      </div>

      {/* ── Panel derecho: marca ────────────────────────────────────────── */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <SolarIllustration />
          <div className="auth-brand-copy">
            <h1>
              Tu energía,<br />
              <span className="auth-brand-gold">bajo control.</span>
            </h1>
            <p>Plataforma de monitoreo solar B2B</p>
          </div>
        </div>
      </div>

    </div>
  )
}
