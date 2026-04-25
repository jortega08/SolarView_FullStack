import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sun, Zap } from 'lucide-react'
import '../styles/Auth.css'

export default function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', contrasena: '', confirmContrasena: '' })
  const [err, setErr] = useState('')
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
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-icon">
            <Sun size={48} />
          </div>
          <h1>Soleim</h1>
          <p>Comienza a monitorear tu sistema solar hoy mismo. Gratis y sin complicaciones.</p>
          <div className="auth-brand-features">
            <div className="auth-feature"><Zap size={16} /><span>Configuración en minutos</span></div>
            <div className="auth-feature"><Zap size={16} /><span>Alertas automáticas</span></div>
            <div className="auth-feature"><Zap size={16} /><span>Gamificación solar</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2>Crear cuenta</h2>
          <p className="auth-subtitle">Únete a Soleim gratis</p>

          {err && <div className="auth-error">{err}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                name="confirmContrasena"
                value={form.confirmContrasena}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                required
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
