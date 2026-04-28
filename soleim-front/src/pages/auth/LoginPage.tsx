import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Zap } from "lucide-react"
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
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-600)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">SOLEIM</span>
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
