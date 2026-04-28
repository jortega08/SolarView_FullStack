import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { Zap } from "lucide-react"
import { useAuth } from "@/contexts/useAuth"

const schema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: regAuth, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await regAuth(data.nombre, data.email, data.contrasena)
      navigate("/", { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse"
      setError("root", { message: msg })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-600)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">SOLEIM</span>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Crear cuenta</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5">Completa los datos para registrarte</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {(["nombre", "email", "contrasena"] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1 capitalize">
                  {field === "contrasena" ? "Contraseña" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  {...register(field)}
                  type={field === "contrasena" ? "password" : field === "email" ? "email" : "text"}
                  className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                />
                {errors[field] && <p className="mt-1 text-xs text-[var(--color-danger-600)]">{errors[field]?.message}</p>}
              </div>
            ))}

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
              {loading ? "Registrando…" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-[var(--color-primary-600)] font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
