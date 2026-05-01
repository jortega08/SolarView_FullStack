import * as Dialog from "@radix-ui/react-dialog"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { useEffect } from "react"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { useCrearOrden } from "@/hooks/useOrdenes"
import { useTecnicos } from "@/hooks/useTecnicos"
import { cn } from "@/lib/cn"

const schema = z.object({
  instalacion: z.coerce.number().int().positive({ message: "Selecciona una instalación" }),
  titulo: z.string().min(3, "Título demasiado corto"),
  descripcion: z.string().optional(),
  prioridad: z.enum(["urgente", "alta", "media", "baja"]),
  tipo: z.enum(["correctivo", "preventivo", "inspeccion", "instalacion"]).optional(),
  alerta: z.coerce.number().int().positive().optional(),
  tecnico_id: z.coerce.number().int().positive().optional().or(z.literal(0)).transform(v => v || undefined),
})

type FormValues = z.infer<typeof schema>

interface CrearOrdenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultInstalacion?: number
  defaultAlertaId?: number
  defaultTitulo?: string
  defaultDescripcion?: string
  onCreated?: () => void
}

export function CrearOrdenDialog({
  open,
  onOpenChange,
  defaultInstalacion,
  defaultAlertaId,
  defaultTitulo,
  defaultDescripcion,
  onCreated,
}: CrearOrdenDialogProps) {
  const { data: instalaciones } = useInstalaciones()
  const { data: tecnicos } = useTecnicos()
  const { mutateAsync: crear, isPending } = useCrearOrden()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      instalacion: defaultInstalacion ?? 0,
      titulo: defaultTitulo ?? "",
      descripcion: defaultDescripcion ?? "",
      prioridad: "media",
      tipo: "correctivo",
      alerta: defaultAlertaId,
      tecnico_id: 0,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        instalacion: defaultInstalacion ?? 0,
        titulo: defaultTitulo ?? "",
        descripcion: defaultDescripcion ?? "",
        prioridad: "media",
        tipo: "correctivo",
        alerta: defaultAlertaId,
        tecnico_id: 0,
      })
    }
  }, [open, defaultInstalacion, defaultAlertaId, defaultTitulo, defaultDescripcion, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      await crear({
        instalacion: values.instalacion,
        titulo: values.titulo,
        descripcion: values.descripcion,
        prioridad: values.prioridad,
        tipo: values.tipo,
        estado: "abierta",
        ...(values.alerta ? { alerta: values.alerta } : {}),
        ...(values.tecnico_id ? { tecnico_id: values.tecnico_id } : {}),
      } as Parameters<typeof crear>[0] & { tecnico_id?: number })
      onCreated?.()
      onOpenChange(false)
    } catch {
      /* toast en hook */
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-overlay)]">
          <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                Crear orden de trabajo
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Puedes asignar un técnico de inmediato o hacerlo más adelante.
              </Dialog.Description>
            </div>
            <Dialog.Close className="text-[var(--color-neutral-500)] hover:text-[var(--color-text-primary)]">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Instalación
              </label>
              <Controller
                control={control}
                name="instalacion"
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value || ""}
                    className={cn(
                      "w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2 text-sm",
                      errors.instalacion
                        ? "border-[var(--color-danger-500)]"
                        : "border-[var(--color-border)]"
                    )}
                  >
                    <option value="">Selecciona una instalación…</option>
                    {(instalaciones ?? []).map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.instalacion && (
                <p className="mt-1 text-xs text-[var(--color-danger-600)]">
                  {errors.instalacion.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Título
              </label>
              <input
                {...register("titulo")}
                placeholder="Ej. Revisar inversor con falla intermitente"
                className={cn(
                  "w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2 text-sm",
                  errors.titulo ? "border-[var(--color-danger-500)]" : "border-[var(--color-border)]"
                )}
              />
              {errors.titulo && (
                <p className="mt-1 text-xs text-[var(--color-danger-600)]">{errors.titulo.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Descripción
              </label>
              <textarea
                {...register("descripcion")}
                rows={4}
                placeholder="Detalles del problema, contexto, observaciones…"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Prioridad
                </label>
                <select
                  {...register("prioridad")}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                >
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Tipo
                </label>
                <select
                  {...register("tipo")}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                >
                  <option value="correctivo">Correctivo</option>
                  <option value="preventivo">Preventivo</option>
                  <option value="inspeccion">Inspección</option>
                  <option value="instalacion">Instalación</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Técnico asignado <span className="font-normal text-[var(--color-text-secondary)]">(opcional)</span>
              </label>
              <Controller
                control={control}
                name="tecnico_id"
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value ?? 0}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  >
                    <option value={0}>Sin asignar por ahora</option>
                    {(tecnicos ?? []).map((t) => (
                      <option key={t.usuarioId ?? t.id} value={t.usuarioId ?? t.id}>
                        {t.nombre}{t.disponible ? "" : " · No disponible"}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50"
              >
                {isPending ? "Creando…" : "Crear orden"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
