import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import {
  FileText, GraduationCap, RefreshCw, Save, Upload, UserCheck,
  Plus, Trash2, Award, Wrench,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { useCiudades } from "@/hooks/useCrudCatalogos"
import {
  useEspecialidades,
  useMiPerfilTecnico,
  usePerfilProfesionalMutation,
} from "@/hooks/useTecnicos"
import type { Certificacion, CiudadBasica, Especialidad, Tecnico } from "@/types/domain"
import type { PerfilProfesionalPayload } from "@/services/tecnicos.service"
import { cn } from "@/lib/cn"

/* ─── Constantes ─────────────────────────────────────────────────────── */

const NIVELES = [
  { value: "", label: "Sin especificar" },
  { value: "bachiller", label: "Bachiller" },
  { value: "tecnico", label: "Técnico" },
  { value: "tecnologo", label: "Tecnólogo" },
  { value: "profesional", label: "Profesional" },
  { value: "especializacion", label: "Especialización" },
  { value: "maestria", label: "Maestría" },
  { value: "doctorado", label: "Doctorado" },
]

const CAPACIDADES = [
  { value: "campo", label: "Trabajo en campo" },
  { value: "supervision", label: "Solo supervisión" },
  { value: "ambas", label: "Supervisión y campo" },
]

/* ─── Tipos del formulario ───────────────────────────────────────────── */

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
  // Nuevos campos de formación
  titulo_academico: string
  nivel_educativo: string
  certificaciones: Certificacion[]
  capacidad_operacion: string
}

/* ─── Componentes de apoyo ───────────────────────────────────────────── */

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] space-y-4">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
        <Icon className="h-4 w-4 text-[var(--color-primary-600)]" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0 block">
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
                className={checked
                  ? "cursor-pointer rounded-full border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] px-3 py-1 text-xs font-medium text-[var(--color-primary-700)]"
                  : "cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggle(id)} className="sr-only" />
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

/* ─── Editor de Certificaciones ──────────────────────────────────────── */

function CertificacionesEditor({
  value,
  onChange,
}: {
  value: Certificacion[]
  onChange: (certs: Certificacion[]) => void
}) {
  const add = () =>
    onChange([...value, { nombre: "", institucion: "", ano: "" }])

  const remove = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i))

  const update = (i: number, field: keyof Certificacion, v: string) =>
    onChange(value.map((c, idx) => (idx === i ? { ...c, [field]: v } : c)))

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">Sin certificaciones registradas.</p>
      )}
      {value.map((cert, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-end">
          <div>
            {i === 0 && <span className="mb-1 block text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">Nombre</span>}
            <input
              value={cert.nombre}
              onChange={(e) => update(i, "nombre", e.target.value)}
              placeholder="Ej: RETIE"
              className="input-ui"
            />
          </div>
          <div>
            {i === 0 && <span className="mb-1 block text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">Institución</span>}
            <input
              value={cert.institucion ?? ""}
              onChange={(e) => update(i, "institucion", e.target.value)}
              placeholder="ICONTEC, SENA…"
              className="input-ui"
            />
          </div>
          <div>
            {i === 0 && <span className="mb-1 block text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">Año</span>}
            <input
              value={cert.ano ?? ""}
              onChange={(e) => update(i, "ano", e.target.value)}
              placeholder="2023"
              maxLength={4}
              className="input-ui"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className={cn("flex items-center justify-center rounded-[var(--radius-md)] p-1.5 text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]", i === 0 ? "mt-5" : "")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)]"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar certificación
      </button>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

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
    titulo_academico: perfil?.tituloAcademico ?? "",
    nivel_educativo: perfil?.nivelEducativo ?? "",
    certificaciones: perfil?.certificaciones ?? [],
    capacidad_operacion: perfil?.capacidadOperacion ?? "campo",
  }
}

function parseStudyLines(value: string) {
  return value.split("\n").map((l) => l.trim()).filter(Boolean)
}

function toggleValue(values: string[], id: string) {
  return values.includes(id) ? values.filter((v) => v !== id) : [...values, id]
}

function setPerfilField<K extends keyof PerfilFormState>(
  setter: Dispatch<SetStateAction<PerfilFormState>>,
  key: K,
  value: PerfilFormState[K]
) {
  setter((current) => ({ ...current, [key]: value }))
}

/* ─── Página principal ───────────────────────────────────────────────── */

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
    const certs = form.certificaciones.filter((c) => c.nombre.trim())
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
      titulo_academico: form.titulo_academico.trim(),
      nivel_educativo: form.nivel_educativo,
      certificaciones: certs,
      capacidad_operacion: form.capacidad_operacion,
    }
    if (form.hoja_vida) payload.hoja_vida = form.hoja_vida

    try {
      await actualizar.mutateAsync(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo guardar el perfil")
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Perfil técnico"
        title="Mi perfil profesional"
        description="Hoja de vida, formación, certificaciones, especialidades y disponibilidad."
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
          <Skeleton className="h-[600px] rounded-[var(--radius-lg)]" />
          <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
        </div>
      ) : isError || !perfil ? (
        <ErrorState
          message="No se encontró un perfil técnico asociado a este usuario."
          onRetry={() => refetch()}
        />
      ) : (
        <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── Columna principal ── */}
          <div className="space-y-5">
            {localError && <ErrorState message={localError} onRetry={() => setLocalError(null)} />}
            {saved && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-energy-200)] bg-[var(--color-energy-50)] px-4 py-2.5 text-sm font-medium text-[var(--color-energy-700)]">
                ✓ Perfil actualizado correctamente.
              </div>
            )}

            {/* Datos generales */}
            <SectionCard icon={UserCheck} title="Datos generales">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileField label="Teléfono">
                  <input
                    value={form.telefono}
                    onChange={(e) => setPerfilField(setForm, "telefono", e.target.value)}
                    className="input-ui"
                    placeholder="+57 300 000 0000"
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
                <ProfileField label="Área profesional">
                  <input
                    value={form.area_profesional}
                    onChange={(e) => setPerfilField(setForm, "area_profesional", e.target.value)}
                    className="input-ui"
                    placeholder="Ej: Sistemas fotovoltaicos"
                  />
                </ProfileField>

                {/* Capacidad de operación */}
                <ProfileField label="Capacidad de operación">
                  <div className="flex gap-2 mt-1">
                    {CAPACIDADES.map(({ value, label }) => (
                      <label
                        key={value}
                        className={cn(
                          "flex-1 cursor-pointer rounded-[var(--radius-md)] border px-3 py-2 text-xs font-medium text-center transition-all",
                          form.capacidad_operacion === value
                            ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)]"
                        )}
                      >
                        <input
                          type="radio"
                          name="capacidad_operacion"
                          value={value}
                          checked={form.capacidad_operacion === value}
                          onChange={() => setPerfilField(setForm, "capacidad_operacion", value)}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </ProfileField>
              </div>

              {/* Toggle disponible */}
              <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-2.5">
                <span>
                  <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Disponible para asignación</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">Visible en despacho y sugerencias del sistema</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setPerfilField(setForm, "disponible", e.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary-600)]"
                />
              </label>
            </SectionCard>

            {/* Formación académica */}
            <SectionCard icon={GraduationCap} title="Formación académica">
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileField label="Título académico">
                  <input
                    value={form.titulo_academico}
                    onChange={(e) => setPerfilField(setForm, "titulo_academico", e.target.value)}
                    className="input-ui"
                    placeholder="Ej: Ingeniero Electrónico"
                  />
                </ProfileField>
                <ProfileField label="Nivel educativo">
                  <select
                    value={form.nivel_educativo}
                    onChange={(e) => setPerfilField(setForm, "nivel_educativo", e.target.value)}
                    className="input-ui"
                  >
                    {NIVELES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </ProfileField>
              </div>

              <ProfileField label="Estudios adicionales">
                <textarea
                  value={form.estudios}
                  onChange={(e) => setPerfilField(setForm, "estudios", e.target.value)}
                  className="input-ui min-h-24"
                  placeholder="Un estudio por línea. Ej: Técnico en energías renovables - SENA 2021"
                />
              </ProfileField>
            </SectionCard>

            {/* Certificaciones */}
            <SectionCard icon={Award} title="Certificaciones">
              <CertificacionesEditor
                value={form.certificaciones}
                onChange={(certs) => setPerfilField(setForm, "certificaciones", certs)}
              />
            </SectionCard>

            {/* Especialidades y Zonas */}
            <div className="grid gap-4 lg:grid-cols-2">
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
                title="Zonas de cobertura"
                empty="No hay ciudades disponibles."
                items={ciudades}
                selected={form.zonas}
                getId={(item) => item.id}
                getLabel={(item) => item.nombre}
                onToggle={(id) =>
                  setForm((current) => ({ ...current, zonas: toggleValue(current.zonas, id) }))
                }
              />
            </div>

            {/* Resumen y notas */}
            <SectionCard icon={Wrench} title="Resumen profesional y notas">
              <ProfileField label="Resumen profesional">
                <textarea
                  value={form.resumen_profesional}
                  onChange={(e) => setPerfilField(setForm, "resumen_profesional", e.target.value)}
                  className="input-ui min-h-28"
                  placeholder="Describe tu experiencia, habilidades y enfoque profesional…"
                />
              </ProfileField>
              <ProfileField label="Notas internas">
                <textarea
                  value={form.notas}
                  onChange={(e) => setPerfilField(setForm, "notas", e.target.value)}
                  className="input-ui min-h-20"
                  placeholder="Observaciones visibles solo para administradores…"
                />
              </ProfileField>
            </SectionCard>
          </div>

          {/* ── Columna lateral ── */}
          <aside className="space-y-4">
            {/* Resumen de identidad */}
            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-sm font-bold text-white">
                  {perfil.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
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
                <InfoRow label="Cédula" value={perfil.cedula ?? "N/D"} />
                <InfoRow label="Área" value={form.area_profesional || "Sin área"} />
                {form.titulo_academico && (
                  <InfoRow label="Título" value={form.titulo_academico} />
                )}
                {form.nivel_educativo && (
                  <InfoRow
                    label="Nivel"
                    value={NIVELES.find(n => n.value === form.nivel_educativo)?.label ?? form.nivel_educativo}
                  />
                )}
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--color-text-muted)]">Estado</span>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                    form.disponible
                      ? "bg-[var(--color-energy-50)] text-[var(--color-energy-700)]"
                      : "bg-[var(--color-danger-50)] text-[var(--color-danger-600)]"
                  )}>
                    {form.disponible ? "● Disponible" : "○ No disponible"}
                  </span>
                </div>
              </div>
            </section>

            {/* Hoja de vida */}
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

            {/* Certificaciones preview */}
            {form.certificaciones.filter(c => c.nombre.trim()).length > 0 && (
              <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <Award className="h-4 w-4" />
                  Certificaciones
                </div>
                <ul className="space-y-2">
                  {form.certificaciones.filter(c => c.nombre.trim()).map((c, i) => (
                    <li key={i} className="flex flex-col text-xs">
                      <span className="font-medium text-[var(--color-text-primary)]">{c.nombre}</span>
                      {(c.institucion || c.ano) && (
                        <span className="text-[var(--color-text-muted)]">
                          {[c.institucion, c.ano].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Estudios visibles */}
            {parseStudyLines(form.estudios).length > 0 && (
              <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <GraduationCap className="h-4 w-4" />
                  Estudios
                </div>
                <ul className="space-y-1.5">
                  {parseStudyLines(form.estudios).map((item) => (
                    <li key={item} className="text-xs text-[var(--color-text-secondary)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <button
              type="submit"
              disabled={actualizar.isPending}
              className="btn-primary w-full"
            >
              {actualizar.isPending ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Guardando…</>
              ) : (
                <><Save className="h-4 w-4" />Guardar perfil</>
              )}
            </button>
          </aside>
        </form>
      )}
    </div>
  )
}
