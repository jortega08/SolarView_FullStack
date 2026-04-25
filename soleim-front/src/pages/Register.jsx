import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, Bell, BarChart2 } from 'lucide-react'
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
          <div className="auth-brand-logo">
            <SoleinMark size={48} />
            <div>
              <h1 className="auth-brand-logo-name">Solein</h1>
              <p className="auth-brand-logo-tagline">Monitoreo y Control Energético</p>
            </div>
          </div>
          <p>Crea tu cuenta y empieza a monitorear tus instalaciones solares con datos en tiempo real.</p>
          <div className="auth-brand-features">
            <div className="auth-feature"><BarChart2 size={16} /><span>Dashboard y analítica</span></div>
            <div className="auth-feature"><Bell size={16} /><span>Alertas automáticas</span></div>
            <div className="auth-feature"><ShieldCheck size={16} /><span>Acceso seguro por empresa</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2>Crear cuenta</h2>
          <p className="auth-subtitle">Regístrate para acceder a tu panel</p>

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
                placeholder="tu@empresa.com"
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
            <button type="submit" className="auth-btn" disabled={loading}>
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
