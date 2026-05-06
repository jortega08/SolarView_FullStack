import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { Building2, KeyRound, Zap } from "lucide-react"
import { useAuth } from "@/contexts/useAuth"
import { apiClient } from "@/services/apiClient"
import type { ApiCiudad } from "@/types/api"
import { cn } from "@/lib/cn"

const modes = ["empresa", "codigo"] as const

const schema = z
  .object({
    mode: z.enum(modes),
    nombre: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Correo inválido"),
    contrasena: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir una mayúscula")
      .regex(/\d/, "Debe incluir un número"),
    prestador_nombre: z.string().optional(),
    prestador_nit: z.string().optional(),
    prestador_ciudad: z.string().optional(),
    codigo: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "empresa" && !value.prestador_nombre?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prestador_nombre"],
        message: "Nombre de empresa requerido",
      })
    }
    if (value.mode === "codigo" && !value.codigo?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["codigo"],
        message: "Código requerido",
      })
    }
  })

type FormData = z.infer<typeof schema>

function ModeButton({
  active,
  icon,
  title,
  hint,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-[var(--radius-md)] border p-3 text-left transition-colors",
        active
          ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-neutral-50)]"
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
        {icon}
        {title}
      </span>
      <span className="text-xs text-[var(--color-text-secondary)]">{hint}</span>
    </button>
  )
}

export default function RegisterPage() {
  const { register: registerAuth, registerConCodigo, loading } = useAuth()
  const navigate = useNavigate()
  const [ciudades, setCiudades] = useState<ApiCiudad[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mode: "empresa" },
  })

  const mode = watch("mode")

  useEffect(() => {
    let alive = true
    apiClient
      .get<ApiCiudad[]>("/core/ciudades/")
      .then((response) => {
        if (alive) setCiudades(Array.isArray(response.data) ? response.data : [])
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const onSubmit = async (data: FormData) => {
    try {
      if (data.mode === "codigo") {
        await registerConCodigo({
          nombre: data.nombre,
          email: data.email,
          contrasena: data.contrasena,
          codigo: data.codigo ?? "",
        })
      } else {
        await registerAuth({
          nombre: data.nombre,
          email: data.email,
          contrasena: data.contrasena,
          prestador_nombre: data.prestador_nombre?.trim(),
          prestador_nit: data.prestador_nit?.trim() || undefined,
          prestador_ciudad: data.prestador_ciudad ? Number(data.prestador_ciudad) : null,
        })
      }
      navigate("/", { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse"
      setError("root", { message: msg })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-600)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">SOLEIM</span>
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Crear cuenta</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-5">
            Registra tu empresa prestadora o únete con un código de invitación.
          </p>

          <div role="tablist" aria-label="Tipo de registro" className="grid grid-cols-2 gap-2 mb-5">
            <ModeButton
              active={mode === "empresa"}
              icon={<Building2 className="w-4 h-4" />}
              title="Nueva empresa"
              hint="Primer usuario"
              onClick={() => setValue("mode", "empresa", { shouldValidate: true })}
            />
            <ModeButton
              active={mode === "codigo"}
              icon={<KeyRound className="w-4 h-4" />}
              title="Tengo código"
              hint="Empleado invitado"
              onClick={() => setValue("mode", "codigo", { shouldValidate: true })}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === "codigo" && (
              <Field label="Código de invitación" error={errors.codigo?.message}>
                <input {...register("codigo")} className="input-ui" placeholder="Pegado por tu administrador" />
              </Field>
            )}

            <Field label="Nombre completo" error={errors.nombre?.message}>
              <input {...register("nombre")} className="input-ui" placeholder="Ana García" />
            </Field>

            <Field label="Correo electrónico" error={errors.email?.message}>
              <input {...register("email")} type="email" className="input-ui" placeholder="tu@empresa.com" />
            </Field>

            <Field label="Contraseña" error={errors.contrasena?.message}>
              <input {...register("contrasena")} type="password" className="input-ui" placeholder="Mínimo 8 caracteres" />
            </Field>

            {mode === "empresa" && (
              <div className="pt-2 border-t border-[var(--color-border)] space-y-4">
                <Field label="Nombre de la empresa prestadora" error={errors.prestador_nombre?.message}>
                  <input {...register("prestador_nombre")} className="input-ui" placeholder="Solar Andes SAS" />
                </Field>
                <Field label="NIT (opcional)" error={errors.prestador_nit?.message}>
                  <input {...register("prestador_nit")} className="input-ui" placeholder="900-555-1" />
                </Field>
                <Field label="Ciudad (opcional)" error={errors.prestador_ciudad?.message}>
                  <select {...register("prestador_ciudad")} className="input-ui">
                    <option value="">Sin ciudad</option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad.idciudad} value={ciudad.idciudad}>
                        {ciudad.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

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
              {loading ? "Registrando..." : mode === "codigo" ? "Unirme con código" : "Crear empresa y cuenta"}
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

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--color-danger-600)]">{error}</p>}
    </div>
  )
}
