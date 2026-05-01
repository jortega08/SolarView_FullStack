import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import usePageTitle from '../hooks/usePageTitle'
import '../styles/Auth.css'

function SoleinMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#1d4ed8"/>
      <circle cx="20" cy="20" r="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      <path d="M22.5 9.5 L14 21.5 L19.5 21.5 L17.5 30.5 L26 18 L20.5 18 Z" fill="white"/>
    </svg>
  )
}

function SolarIllustration() {
  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <circle cx="120" cy="120" r="108" stroke="rgba(29,78,216,0.08)"  strokeWidth="1"/>
      <circle cx="120" cy="120" r="82"  stroke="rgba(59,130,246,0.15)" strokeWidth="1"/>
      <circle cx="120" cy="120" r="56"  stroke="rgba(29,78,216,0.20)"  strokeWidth="1"/>
      <circle cx="120" cy="120" r="28"  stroke="#1d4ed8" strokeWidth="2"  opacity="0.85"/>
      <circle cx="120" cy="120" r="18"  fill="rgba(29,78,216,0.10)"/>
      <circle cx="120" cy="120" r="6"   fill="#1d4ed8"   opacity="0.9"/>
      <line x1="120" y1="84"  x2="120" y2="62"  stroke="#1d4ed8" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>
      <line x1="120" y1="156" x2="120" y2="178" stroke="#1d4ed8" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>
      <line x1="84"  y1="120" x2="62"  y2="120" stroke="#1d4ed8" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>
      <line x1="156" y1="120" x2="178" y2="120" stroke="#1d4ed8" strokeWidth="2"   strokeLinecap="round" opacity="0.75"/>
      <line x1="100" y1="100" x2="84"  y2="84"  stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <line x1="140" y1="100" x2="156" y2="84"  stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <line x1="100" y1="140" x2="84"  y2="156" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <line x1="140" y1="140" x2="156" y2="156" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <path d="M 30 185 Q 120 85  210 160" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55"/>
      <path d="M 18 148 Q 120 48  222 132" stroke="#60a5fa" strokeWidth="1"   fill="none" strokeLinecap="round" opacity="0.28"/>
      <circle cx="30"  cy="185" r="3.5" fill="#3b82f6" opacity="0.65"/>
      <circle cx="210" cy="160" r="3.5" fill="#3b82f6" opacity="0.65"/>
      <circle cx="120" cy="92"  r="2.5" fill="#60a5fa" opacity="0.35"/>
      <circle cx="38"  cy="38"  r="2" fill="rgba(29,78,216,0.25)"/>
      <circle cx="202" cy="38"  r="2" fill="rgba(29,78,216,0.25)"/>
      <circle cx="38"  cy="202" r="2" fill="rgba(59,130,246,0.35)"/>
      <circle cx="202" cy="202" r="2" fill="rgba(59,130,246,0.35)"/>
    </svg>
  )
}

export default function Register() {
  usePageTitle("Crear cuenta")
  const [form, setForm] = useState({ nombre: '', email: '', contrasena: '', confirmContrasena: '' })
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [err,  setErr]  = useState('')
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (form.contrasena !== form.confirmContrasena) {
      setErr('Las contraseñas no coinciden')
      return
    }
    try {
      await register({ nombre: form.nombre, email: form.email, contrasena: form.contrasena })
      navigate('/')
    } catch (error) {
      setErr(error.message)
    }
  }

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  return (
    <div className="auth-layout">

      {/* ── Panel izquierdo: formulario ─────────────────────────────────── */}
      <div className="auth-form-panel">

        <div className="auth-logo-anchor">
          <SoleinMark size={30} />
          <span className="auth-logo-name">SOLEIM</span>
        </div>

        <div className="auth-form-container">
          <h2 className="auth-heading">Crea tu cuenta.</h2>
          <p className="auth-subtitle">Empieza a monitorear tus instalaciones solares</p>

          {err && <div className="auth-error">{err}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-nombre">Nombre completo</label>
              <input
                id="reg-nombre"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ana García"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Correo electrónico</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@empresa.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-pass">Contraseña</label>
              <div className="input-password-wrap">
                <input
                  id="reg-pass"
                  type={showPass ? "text" : "password"}
                  name="contrasena"
                  value={form.contrasena}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar" : "Mostrar"}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirmar contraseña</label>
              <div className="input-password-wrap">
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  name="confirmContrasena"
                  value={form.confirmContrasena}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Ocultar" : "Mostrar"}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>

        <p className="auth-panel-footer">
          © {new Date().getFullYear()} SOLEIM · Control Solar Empresarial
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
