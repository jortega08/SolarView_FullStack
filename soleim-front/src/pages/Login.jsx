import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sun, Zap } from 'lucide-react'
import '../styles/Auth.css'

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
          <div className="auth-brand-icon">
            <Sun size={48} />
          </div>
          <h1>Soleim</h1>
          <p>Monitorea tu energía solar en tiempo real. Controla el consumo, gestiona baterías y ahorra más.</p>
          <div className="auth-brand-features">
            <div className="auth-feature"><Zap size={16} /><span>Dashboard en tiempo real</span></div>
            <div className="auth-feature"><Zap size={16} /><span>Gestión de baterías</span></div>
            <div className="auth-feature"><Zap size={16} /><span>Facturación inteligente</span></div>
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
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
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
