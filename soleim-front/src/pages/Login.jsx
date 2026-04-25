import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, BarChart2, Battery } from 'lucide-react'
import '../styles/Auth.css'

function SoleinMark({ size = 42 }) {
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

export default function Login() {
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [err, setErr] = useState('')
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
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <SoleinMark size={48} />
            <div>
              <h1 className="auth-brand-logo-name">Solein</h1>
              <p className="auth-brand-logo-tagline">Monitoreo y Control Energético</p>
            </div>
          </div>
          <p>Gestiona tus instalaciones solares en tiempo real. Controla el consumo, monitorea baterías y toma decisiones con datos.</p>
          <div className="auth-brand-features">
            <div className="auth-feature"><Zap size={16} /><span>Dashboard en tiempo real</span></div>
            <div className="auth-feature"><BarChart2 size={16} /><span>Analítica y reportes</span></div>
            <div className="auth-feature"><Battery size={16} /><span>Monitoreo de baterías</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2>Iniciar sesión</h2>
          <p className="auth-subtitle">Accede a tu panel de control</p>

          {err && <div className="auth-error">{err}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="auth-switch">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
