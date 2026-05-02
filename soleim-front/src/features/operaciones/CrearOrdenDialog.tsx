import * as Dialog from "@radix-ui/react-dialog"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Sparkles, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { useCrearOrden } from "@/hooks/useOrdenes"
import { useTecnicos, useTecnicosSugeridos } from "@/hooks/useTecnicos"
import { cn } from "@/lib/cn"
import type { Tecnico } from "@/types/domain"

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

/* ─── Tarjeta de técnico sugerido ───────────────────────────────────── */

function TecnicoCard({
  tecnico,
  selected,
  onClick,
}: {
  tecnico: Tecnico
  selected: boolean
  onClick: () => void
}) {
  const scoreColor =
    (tecnico.score ?? 0) >= 50 ? "text-green-600 bg-green-50" :
    (tecnico.score ?? 0) >= 25 ? "text-yellow-600 bg-yellow-50" :
    "text-[var(--color-text-muted)] bg-[var(--color-neutral-100)]"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 w-full rounded-[var(--radius-md)] border p-3 text-left transition-all",
        selected
          ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)]"
          : "border-[var(--color-border)] hover:border-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-50)]"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
        selected ? "bg-[var(--color-primary-600)]" : "bg-[var(--color-neutral-400)]"
      )}>
        {tecnico.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{tecnico.nombre}</p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">
          {tecnico.especialidades.length > 0
            ? tecnico.especialidades.slice(0, 2).join(", ")
            : tecnico.areaProfesional ?? "Sin especialidad"}
        </p>
        {/* Razones */}
        {tecnico.razones && tecnico.razones.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tecnico.razones.slice(0, 3).map((r, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-[var(--color-primary-50)] border border-[var(--color-primary-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary-700)]">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Score + disponibilidad */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {tecnico.score != null && (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", scoreColor)}>
            {tecnico.score}pts
          </span>
        )}
        <span className={cn(
          "text-[10px] font-medium",
          tecnico.disponible ? "text-green-600" : "text-[var(--color-danger-500)]"
        )}>
          {tecnico.disponible ? "● Disponible" : "○ Ocupado"}
        </span>
        {tecnico.cargaTrabajo != null && (
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {tecnico.cargaTrabajo} orden{tecnico.cargaTrabajo !== 1 ? "es" : ""} activa{tecnico.cargaTrabajo !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  )
}

/* ─── Diálogo principal ─────────────────────────────────────────────── */

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
  const [selectedInstalacion, setSelectedInstalacion] = useState<number>(defaultInstalacion ?? 0)

  const { data: sugeridos, isLoading: loadingSugeridos } = useTecnicosSugeridos(
    selectedInstalacion > 0 ? selectedInstalacion : undefined
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
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

  const tecnicoIdActual = watch("tecnico_id")

  useEffect(() => {
    if (open) {
      const inst = defaultInstalacion ?? 0
      setSelectedInstalacion(inst)
      reset({
        instalacion: inst,
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-overlay)] max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4 flex-shrink-0">
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

          {/* Scrollable body */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-5 py-4 overflow-y-auto">

            {/* Instalación */}
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
                    onChange={(e) => {
                      field.onChange(e)
                      setSelectedInstalacion(Number(e.target.value))
                      setValue("tecnico_id", 0)
                    }}
                    className={cn(
                      "w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2 text-sm",
                      errors.instalacion ? "border-[var(--color-danger-500)]" : "border-[var(--color-border)]"
                    )}
                  >
                    <option value="">Selecciona una instalación…</option>
                    {(instalaciones ?? []).map((i) => (
                      <option key={i.id} value={i.id}>{i.nombre}</option>
                    ))}
                  </select>
                )}
              />
              {errors.instalacion && (
                <p className="mt-1 text-xs text-[var(--color-danger-600)]">{errors.instalacion.message}</p>
              )}
            </div>

            {/* Título */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Título</label>
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

            {/* Descripción */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Descripción</label>
              <textarea
                {...register("descripcion")}
                rows={3}
                placeholder="Detalles del problema, contexto, observaciones…"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>

            {/* Prioridad + Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Prioridad</label>
                <select {...register("prioridad")} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Tipo</label>
                <select {...register("tipo")} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  <option value="correctivo">Correctivo</option>
                  <option value="preventivo">Preventivo</option>
                  <option value="inspeccion">Inspección</option>
                  <option value="instalacion">Instalación</option>
                </select>
              </div>
            </div>

            {/* Técnico — Sugeridos + selector manual */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">
                Técnico asignado <span className="font-normal">(opcional)</span>
              </label>

              {/* Sugeridos — solo si hay instalación seleccionada */}
              {selectedInstalacion > 0 && (
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary-500)]" />
                    Sugeridos por el sistema
                    {loadingSugeridos && (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-primary-300)] border-t-transparent" />
                    )}
                  </div>

                  {!loadingSugeridos && (!sugeridos || sugeridos.length === 0) && (
                    <p className="text-xs text-[var(--color-text-muted)] italic">
                      No hay técnicos disponibles para esta instalación.
                    </p>
                  )}

                  <div className="space-y-2">
                    {(sugeridos ?? []).map((tec) => (
                      <TecnicoCard
                        key={tec.usuarioId ?? tec.id}
                        tecnico={tec}
                        selected={(tecnicoIdActual ?? 0) === (tec.usuarioId ?? tec.id)}
                        onClick={() => {
                          const val = tec.usuarioId ?? tec.id
                          setValue(
                            "tecnico_id",
                            (tecnicoIdActual ?? 0) === val ? 0 : val,
                            { shouldValidate: true }
                          )
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Selector manual (todos los técnicos) */}
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] list-none">
                  <User className="h-3.5 w-3.5" />
                  {selectedInstalacion > 0 ? "O seleccionar manualmente…" : "Seleccionar técnico"}
                  <span className="ml-auto text-[var(--color-text-muted)] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-2">
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
              </details>
            </div>

            {/* Acciones */}
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
