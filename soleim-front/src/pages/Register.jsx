import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Eye, EyeOff, KeyRound } from 'lucide-react'
import usePageTitle from '../hooks/usePageTitle'
import '../styles/Auth.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
    </svg>
  )
}

const MODES = {
  EMPRESA: 'empresa',
  CODIGO: 'codigo',
}

export default function Register() {
  usePageTitle("Crear cuenta")
  // Modo del formulario:
  //   EMPRESA → registro de un nuevo PrestadorServicio (el primer usuario = la empresa).
  //   CODIGO  → unirse como empleado a un prestador existente con código de invitación.
  const [mode, setMode] = useState(MODES.EMPRESA)

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    contrasena: '',
    confirmContrasena: '',
    // EMPRESA
    prestadorNombre: '',
    prestadorNit: '',
    prestadorCiudad: '',
    // CODIGO
    codigo: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [ciudades, setCiudades] = useState([])
  const [err, setErr] = useState('')

  const { register, registerConCodigo, loading } = useAuth()
  const navigate = useNavigate()

  // Cargamos ciudades sólo cuando el usuario está creando una nueva empresa.
  useEffect(() => {
    if (mode !== MODES.EMPRESA || ciudades.length > 0) return
    let aborted = false
    fetch(`${API_BASE}/core/ciudades/`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (aborted) return
        const list = Array.isArray(data) ? data : data?.results ?? []
        setCiudades(list)
      })
      .catch(() => { /* fallback a input texto */ })
    return () => { aborted = true }
  }, [mode, ciudades.length])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (form.contrasena !== form.confirmContrasena) {
      setErr('Las contraseñas no coinciden')
      return
    }
    try {
      if (mode === MODES.EMPRESA) {
        await register({
          nombre: form.nombre,
          email: form.email,
          contrasena: form.contrasena,
          // En este modo el bloque prestador es REQUERIDO.
          prestador: {
            nombre: form.prestadorNombre,
            nit: form.prestadorNit,
            ciudad: form.prestadorCiudad || null,
          },
        })
      } else {
        await registerConCodigo({
          nombre: form.nombre,
          email: form.email,
          contrasena: form.contrasena,
          codigo: form.codigo,
        })
      }
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
          <p className="auth-subtitle">
            {mode === MODES.EMPRESA
              ? 'Eres el primer usuario: registras tu empresa prestadora.'
              : 'Únete a una empresa existente con tu código de invitación.'}
          </p>

          {/* Selector de modo: dos cards visibles desde el primer momento */}
          <div
            role="tablist"
            aria-label="Tipo de registro"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <ModeCard
              active={mode === MODES.EMPRESA}
              icon={<Building2 size={16} />}
              title="Nueva empresa"
              hint="Registras tu prestadora"
              onClick={() => setMode(MODES.EMPRESA)}
            />
            <ModeCard
              active={mode === MODES.CODIGO}
              icon={<KeyRound size={16} />}
              title="Tengo código"
              hint="Unirme a una empresa"
              onClick={() => setMode(MODES.CODIGO)}
            />
          </div>

          {err && <div className="auth-error">{err}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === MODES.CODIGO && (
              <div className="form-group">
                <label htmlFor="reg-codigo">Código de invitación</label>
                <input
                  id="reg-codigo"
                  type="text"
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  placeholder="Pegado por tu administrador"
                  required
                  autoFocus
                />
              </div>
            )}

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
                autoFocus={mode === MODES.EMPRESA}
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

            {/* Datos de la empresa prestadora — sólo en modo EMPRESA */}
            {mode === MODES.EMPRESA && (
              <div
                style={{
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '0.25rem',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
                  Estos datos crean tu empresa prestadora. Después podrás invitar
                  a tus empleados con un código y dar de alta a tus clientes.
                </p>
                <div className="form-group">
                  <label htmlFor="reg-prestador-nombre">Nombre de la empresa prestadora</label>
                  <input
                    id="reg-prestador-nombre"
                    type="text"
                    name="prestadorNombre"
                    value={form.prestadorNombre}
                    onChange={handleChange}
                    placeholder="Solar Andes SAS"
                    required
                    maxLength={150}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-prestador-nit">NIT (opcional)</label>
                  <input
                    id="reg-prestador-nit"
                    type="text"
                    name="prestadorNit"
                    value={form.prestadorNit}
                    onChange={handleChange}
                    placeholder="900-555-1"
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-prestador-ciudad">Ciudad (opcional)</label>
                  {ciudades.length > 0 ? (
                    <select
                      id="reg-prestador-ciudad"
                      name="prestadorCiudad"
                      value={form.prestadorCiudad}
                      onChange={handleChange}
                    >
                      <option value="">Sin ciudad</option>
                      {ciudades.map((c) => (
                        <option key={c.idciudad} value={c.idciudad}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="reg-prestador-ciudad"
                      type="text"
                      name="prestadorCiudad"
                      value={form.prestadorCiudad}
                      onChange={handleChange}
                      placeholder="ID de ciudad (numérico)"
                      inputMode="numeric"
                    />
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading
                ? 'Creando cuenta...'
                : mode === MODES.EMPRESA
                  ? 'Crear empresa y cuenta'
                  : 'Unirme con código'}
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

function ModeCard({ active, icon, title, hint, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.25rem',
        padding: '0.65rem 0.75rem',
        borderRadius: 8,
        border: active ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
        background: active ? 'rgba(29,78,216,0.06)' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: active ? '#1d4ed8' : '#0f172a',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        {icon}
        {title}
      </span>
      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{hint}</span>
    </button>
  )
}
