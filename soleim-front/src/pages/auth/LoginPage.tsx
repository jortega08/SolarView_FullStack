import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/useAuth"

const schema = z.object({
  email: z.string().email("Correo inválido"),
  contrasena: z.string().min(1, "Contraseña requerida"),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/"

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.contrasena)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Credenciales inválidas"
      setError("root", { message: msg })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo Soleim */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <svg width="36" height="44" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 11 C6 5.5 10 3 15 3 C20 3 23 6 23 11 C23 15.5 20 17 15 17"
              stroke="#E0B63D" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="23" cy="11" r="2.8" fill="#E0B63D"/>
            <path d="M22 23 C22 28.5 18 31 13 31 C8 31 5 28 5 23 C5 18.5 8 17 13 17"
              stroke="#3F687A" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="5" cy="23" r="2.8" fill="#3F687A"/>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-[26px] font-bold text-[var(--color-primary-600)] tracking-tight">Soleim</span>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--color-teal-500)]">
              Control Energético
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Iniciar sesión</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Correo electrónico</label>
              <input
                {...register("email")}
                type="email"
                placeholder="correo@empresa.com"
                className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
              />
              {errors.email && <p className="mt-1 text-xs text-[var(--color-danger-600)]">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Contraseña</label>
              <input
                {...register("contrasena")}
                type="password"
                placeholder="••••••••"
                className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
              />
              {errors.contrasena && <p className="mt-1 text-xs text-[var(--color-danger-600)]">{errors.contrasena.message}</p>}
            </div>

            {errors.root && (
              <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-danger-50)] border border-[var(--color-danger-200)]">
                <p className="text-xs text-[var(--color-danger-700)]">{errors.root.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 px-4 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white text-sm font-medium rounded-[var(--radius-md)] transition-colors disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-[var(--color-primary-600)] font-medium hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
