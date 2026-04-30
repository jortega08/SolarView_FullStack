import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import { FileText, GraduationCap, RefreshCw, Save, Upload, UserCheck } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { useCiudades } from "@/hooks/useCrudCatalogos"
import {
  useEspecialidades,
  useMiPerfilTecnico,
  usePerfilProfesionalMutation,
} from "@/hooks/useTecnicos"
import type { CiudadBasica, Especialidad, Tecnico } from "@/types/domain"
import type { PerfilProfesionalPayload } from "@/services/tecnicos.service"

interface PerfilFormState {
  telefono: string
  especialidades: string[]
  zonas: string[]
  disponible: boolean
  area_profesional: string
  resumen_profesional: string
  estudios: string
  licencia_vence: string
  notas: string
  hoja_vida: File | null
}

export default function PerfilProfesionalPage() {
  const { data: perfil, isLoading, isError, refetch } = useMiPerfilTecnico()
  const { data: especialidades = [] } = useEspecialidades()
  const { data: ciudades = [] } = useCiudades()
  const actualizar = usePerfilProfesionalMutation()
  const [form, setForm] = useState<PerfilFormState>(() => toPerfilForm(null))
  const [localError, setLocalError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(toPerfilForm(perfil ?? null))
  }, [perfil])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    setSaved(false)
    const payload: PerfilProfesionalPayload = {
      telefono: form.telefono.trim(),
      especialidades: form.especialidades.map(Number),
      zonas: form.zonas.map(Number),
      disponible: form.disponible,
      area_profesional: form.area_profesional.trim(),
      resumen_profesional: form.resumen_profesional.trim(),
      estudios: parseStudyLines(form.estudios),
      licencia_vence: form.licencia_vence || null,
      notas: form.notas.trim(),
    }
    if (form.hoja_vida) payload.hoja_vida = form.hoja_vida

    try {
      await actualizar.mutateAsync(payload)
      setSaved(true)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo guardar el perfil")
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Perfil tecnico"
        title="Mi perfil profesional"
        description="Hoja de vida, estudios, area, zonas de cobertura y disponibilidad."
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[520px] rounded-[var(--radius-lg)]" />
          <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
        </div>
      ) : isError || !perfil ? (
        <ErrorState
          message="No se encontro un perfil tecnico asociado a este usuario."
          onRetry={() => refetch()}
        />
      ) : (
        <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            {localError && <ErrorState message={localError} onRetry={() => setLocalError(null)} />}
            {saved && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-energy-200)] bg-[var(--color-energy-50)] px-3 py-2 text-sm font-medium text-[var(--color-energy-700)]">
                Perfil actualizado.
              </div>
            )}

            <section className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:grid-cols-2">
              <ProfileField label="Telefono">
                <input
                  value={form.telefono}
                  onChange={(e) => setPerfilField(setForm, "telefono", e.target.value)}
                  className="input-ui"
                />
              </ProfileField>
              <ProfileField label="Licencia vence">
                <input
                  type="date"
                  value={form.licencia_vence}
                  onChange={(e) => setPerfilField(setForm, "licencia_vence", e.target.value)}
                  className="input-ui"
                />
              </ProfileField>
              <ProfileField label="Area profesional">
                <input
                  value={form.area_profesional}
                  onChange={(e) => setPerfilField(setForm, "area_profesional", e.target.value)}
                  className="input-ui"
                />
              </ProfileField>
              <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-2">
                <span>
                  <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                    Disponible
                  </span>
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    Visible para despacho y sugerencias
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setPerfilField(setForm, "disponible", e.target.checked)}
                  className="h-4 w-4"
                />
              </label>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <ProfileCatalogSelector
                title="Especialidades"
                empty="No hay especialidades disponibles."
                items={especialidades}
                selected={form.especialidades}
                getId={(item) => item.id}
                getLabel={(item) => item.nombre}
                onToggle={(id) =>
                  setForm((current) => ({
                    ...current,
                    especialidades: toggleValue(current.especialidades, id),
                  }))
                }
              />
              <ProfileCatalogSelector
                title="Zonas"
                empty="No hay ciudades disponibles."
                items={ciudades}
                selected={form.zonas}
                getId={(item) => item.id}
                getLabel={(item) => item.nombre}
                onToggle={(id) =>
                  setForm((current) => ({ ...current, zonas: toggleValue(current.zonas, id) }))
                }
              />
            </section>

            <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
              <ProfileField label="Resumen profesional">
                <textarea
                  value={form.resumen_profesional}
                  onChange={(e) =>
                    setPerfilField(setForm, "resumen_profesional", e.target.value)
                  }
                  className="input-ui min-h-28"
                />
              </ProfileField>
              <ProfileField label="Estudios">
                <textarea
                  value={form.estudios}
                  onChange={(e) => setPerfilField(setForm, "estudios", e.target.value)}
                  className="input-ui min-h-28"
                  placeholder="Un estudio por linea"
                />
              </ProfileField>
              <ProfileField label="Notas">
                <textarea
                  value={form.notas}
                  onChange={(e) => setPerfilField(setForm, "notas", e.target.value)}
                  className="input-ui min-h-24"
                />
              </ProfileField>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
                  <UserCheck className="h-5 w-5 text-[var(--color-primary-700)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                    {perfil.nombre}
                  </h2>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">
                    {perfil.empresaNombre ?? "Sin empresa"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <InfoRow label="Correo" value={perfil.email ?? "N/D"} />
                <InfoRow label="Cedula" value={perfil.cedula ?? "N/D"} />
                <InfoRow label="Area" value={form.area_profesional || "Sin area"} />
              </div>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <FileText className="h-4 w-4" />
                Hoja de vida
              </div>
              {perfil.hojaVidaUrl && (
                <a
                  href={perfil.hojaVidaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary-700)] hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver archivo actual
                </a>
              )}
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-neutral-50)] px-4 py-8 text-center text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-neutral-100)]">
                <Upload className="h-5 w-5" />
                {form.hoja_vida ? form.hoja_vida.name : "Subir PDF, DOC o DOCX"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(e) =>
                    setPerfilField(setForm, "hoja_vida", e.target.files?.[0] ?? null)
                  }
                />
              </label>
            </section>

            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <GraduationCap className="h-4 w-4" />
                Estudios visibles
              </div>
              {parseStudyLines(form.estudios).length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">Sin estudios registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {parseStudyLines(form.estudios).map((item) => (
                    <li key={item} className="text-xs text-[var(--color-text-secondary)]">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <button type="submit" disabled={actualizar.isPending} className="btn-primary w-full">
              <Save className="h-4 w-4" />
              Guardar perfil
            </button>
          </aside>
        </form>
      )}
    </div>
  )
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  )
}

function ProfileCatalogSelector<T extends CiudadBasica | Especialidad>({
  title,
  empty,
  items,
  selected,
  getId,
  getLabel,
  onToggle,
}: {
  title: string
  empty: string
  items: T[]
  selected: string[]
  getId: (item: T) => number
  getLabel: (item: T) => string
  onToggle: (id: string) => void
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const id = String(getId(item))
            const checked = selected.includes(id)
            return (
              <label
                key={id}
                className={
                  checked
                    ? "cursor-pointer rounded-full border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] px-3 py-1 text-xs font-medium text-[var(--color-primary-700)]"
                    : "cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(id)}
                  className="sr-only"
                />
                {getLabel(item)}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="min-w-0 truncate font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

function toPerfilForm(perfil: Tecnico | null): PerfilFormState {
  return {
    telefono: perfil?.telefono ?? "",
    especialidades: perfil?.especialidadesIds.map(String) ?? [],
    zonas: perfil?.zonasIds.map(String) ?? [],
    disponible: perfil?.disponible ?? true,
    area_profesional: perfil?.areaProfesional ?? "",
    resumen_profesional: perfil?.resumenProfesional ?? "",
    estudios: perfil?.estudios.join("\n") ?? "",
    licencia_vence: perfil?.licenciaVence ?? "",
    notas: perfil?.notas ?? "",
    hoja_vida: null,
  }
}

function parseStudyLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function toggleValue(values: string[], id: string) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
}

function setPerfilField<K extends keyof PerfilFormState>(
  setter: Dispatch<SetStateAction<PerfilFormState>>,
  key: K,
  value: PerfilFormState[K]
) {
  setter((current) => ({ ...current, [key]: value }))
}
