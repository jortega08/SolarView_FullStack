import {
  useEffect,
  useRef,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import { Link } from "react-router-dom"
import {
  Award,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  GraduationCap,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { MetricCard } from "@/components/data/MetricCard"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { Sheet } from "@/components/overlays/Sheet"
import { useCiudades, useEmpresasCrud } from "@/hooks/useCrudCatalogos"
import { useEspecialidades, useTecnicoMutations, useTecnicos } from "@/hooks/useTecnicos"
import { catalogosService } from "@/services/catalogos.service"
import { tecnicosService, type TecnicoPayload } from "@/services/tecnicos.service"
import type { Certificacion, CiudadBasica, EmpresaBasica, Especialidad, Tecnico } from "@/types/domain"
import { TechnicianTable } from "@/features/tecnicos/TechnicianTable"
import { TechnicianAvailabilityPanel } from "@/features/tecnicos/TechnicianAvailabilityPanel"
import { TechnicianAssignmentSuggestion } from "@/features/tecnicos/TechnicianAssignmentSuggestion"
import { TecnicoDetalleSheet } from "@/features/tecnicos/TecnicoDetalleSheet"
import { useI18n } from "@/contexts/I18nContext"
import { usePermissions } from "@/hooks/usePermissions"

interface FiltersState {
  disponibilidad: string
  especialidad: string
  zona: string
  busqueda: string
  empresa: string
}

interface TecnicoFormState {
  nombre: string
  email: string
  contrasena: string
  empresa: string
  cedula: string
  telefono: string
  especialidades: string[]
  zonas: string[]
  disponible: boolean
  area_profesional: string
  resumen_profesional: string
  estudios: string
  licencia_vence: string
  notas: string
  // Formación académica
  titulo_academico: string
  nivel_educativo: string
  capacidad_operacion: string
  certificaciones: Certificacion[]
  hoja_vida: File | null
}

type TecnicoPerfilFormPayload = Partial<TecnicoPayload> & {
  empresa: number
  cedula: string
  disponible: boolean
  especialidades: number[]
  zonas: number[]
}

// Valores exactos que acepta el backend (clave → etiqueta)
const NIVELES_EDUCATIVOS: { value: string; label: string }[] = [
  { value: "bachiller",       label: "Bachiller" },
  { value: "tecnico",         label: "Técnico" },
  { value: "tecnologo",       label: "Tecnólogo" },
  { value: "profesional",     label: "Profesional" },
  { value: "especializacion", label: "Especialización" },
  { value: "maestria",        label: "Maestría" },
  { value: "doctorado",       label: "Doctorado" },
]

const CAPACIDADES_OPERACION: { value: string; label: string }[] = [
  { value: "supervision", label: "Solo supervisión" },
  { value: "campo",       label: "Trabajo en campo" },
  { value: "ambas",       label: "Supervisión y campo" },
]

interface TecnicoFormSubmit {
  nuevoUsuario: {
    nombre: string
    email: string
    contrasena: string
    rol: string
  } | null
  perfil: TecnicoPerfilFormPayload
  hojaVida: File | null
}

export default function TecnicosPage() {
  const { t } = useI18n()
  const { tecnicos: permTecnicos } = usePermissions()
  const [filters, setFilters] = useState<FiltersState>({
    disponibilidad: "",
    especialidad: "",
    zona: "",
    busqueda: "",
    empresa: "",
  })
  const [selected, setSelected] = useState<Tecnico | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Tecnico | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const { data: tecnicos = [], isLoading, isError, refetch } = useTecnicos()
  const { data: especialidades = [] } = useEspecialidades()
  const { crear, actualizar, eliminar } = useTecnicoMutations()

  const options = useMemo(() => {
    const zonas = Array.from(new Set(tecnicos.flatMap((t) => t.zonas))).sort()
    const empresas = Array.from(
      new Map(
        tecnicos
          .filter((t) => t.empresaId && t.empresaNombre)
          .map((t) => [String(t.empresaId), t.empresaNombre as string])
      )
    ).map(([id, nombre]) => ({ id, nombre }))
    const especialidadesDerivadas = Array.from(
      new Set(tecnicos.flatMap((t) => t.especialidades))
    ).sort()

    return {
      zonas,
      empresas,
      especialidades:
        especialidades.length > 0
          ? especialidades.map((e) => e.nombre)
          : especialidadesDerivadas,
    }
  }, [especialidades, tecnicos])

  const filtered = useMemo(() => {
    const q = filters.busqueda.trim().toLowerCase()
    return tecnicos.filter((t) => {
      if (filters.disponibilidad === "disponible" && !t.disponible) return false
      if (filters.disponibilidad === "no_disponible" && t.disponible) return false
      if (filters.especialidad && !matches(t.especialidades, filters.especialidad)) return false
      if (filters.zona && !matches(t.zonas, filters.zona)) return false
      if (filters.empresa && String(t.empresaId) !== filters.empresa) return false
      if (q) {
        const haystack = [
          t.nombre,
          t.email ?? "",
          t.cedula ?? "",
          t.telefono ?? "",
          t.empresaNombre ?? "",
          t.especialidad ?? "",
          t.zona ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [filters, tecnicos])

  const metrics = useMemo(() => getMetrics(tecnicos), [tecnicos])

  const openDetail = (tecnico: Tecnico) => {
    setSelected(tecnico)
    setSheetOpen(true)
  }

  const submitTecnico = async ({ nuevoUsuario, perfil, hojaVida }: TecnicoFormSubmit) => {
    setLocalError(null)
    try {
      if (editing) {
        await actualizar.mutateAsync({ id: editing.id, payload: perfil })
        if (hojaVida instanceof File) {
          await tecnicosService.actualizarHojaVida(editing.id, hojaVida)
        }
        setEditing(null)
        return
      }

      if (!nuevoUsuario) throw new Error("Faltan datos del usuario.")
      const usuario = await catalogosService.crearUsuario(nuevoUsuario)
      const usuarioId = usuario.idusuario ?? usuario.id
      if (!usuarioId) throw new Error("No se recibio el usuario creado.")
      const creado = await crear.mutateAsync({ ...perfil, usuario: usuarioId })
      const creadoId = creado?.idperfil ?? creado?.id
      if (hojaVida instanceof File && creadoId) {
        await tecnicosService.actualizarHojaVida(creadoId, hojaVida)
      }
      setCreating(false)
    } catch (error) {
      const msg = extractApiError(error)
      setLocalError(msg)
    }
  }

  const deleteTecnico = async (tecnico: Tecnico) => {
    if (!window.confirm(`Eliminar el perfil de ${tecnico.nombre}?`)) return
    setLocalError(null)
    try {
      await eliminar.mutateAsync(tecnico.id)
    } catch (error) {
      setLocalError(extractApiError(error))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("tech.eyebrow")}
        title={t("tech.title")}
        description={t("tech.desc")}
        actions={
          <>
            {permTecnicos.crear && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
              >
                <Plus className="h-4 w-4" />
                {t("tech.btn.new")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, disponibilidad: "disponible" }))}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
            >
              <UserCheck className="h-4 w-4" />
              {t("tech.btn.available")}
            </button>
            <Link
              to="/ordenes"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
            >
              <ClipboardList className="h-4 w-4" />
              {t("tech.btn.assign")}
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
            >
              <RefreshCw className="h-4 w-4" />
              {t("tech.btn.refresh")}
            </button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard title={t("tech.metric.total")} value={String(metrics.total)} icon={Users} />
          <MetricCard
            title={t("tech.metric.available")}
            value={String(metrics.disponibles)}
            icon={UserCheck}
            iconBg="bg-[var(--color-energy-50)]"
            iconColor="text-[var(--color-energy-700)]"
          />
          <MetricCard
            title={t("tech.metric.field")}
            value={String(metrics.noDisponibles)}
            icon={BriefcaseBusiness}
            iconBg="bg-[var(--color-warning-50)]"
            iconColor="text-[var(--color-warning-700)]"
          />
          <MetricCard
            title={t("tech.metric.specialties")}
            value={String(metrics.especialidades)}
            delta={t("tech.metric.specialties.delta")}
            icon={ShieldAlert}
            iconBg="bg-[var(--color-sla-50)]"
            iconColor="text-[var(--color-sla-700)]"
          />
          <MetricCard
            title={t("tech.metric.load")}
            value={metrics.cargaPromedio == null ? "N/D" : `${metrics.cargaPromedio}`}
            delta={metrics.cargaPromedio == null ? t("tech.metric.load.na") : t("tech.metric.load.delta")}
            icon={ClipboardList}
          />
          <MetricCard
            title={t("tech.metric.license")}
            value={metrics.licenciasProximas == null ? "N/D" : String(metrics.licenciasProximas)}
            delta={t("tech.metric.license.delta")}
            icon={ShieldAlert}
            iconBg="bg-[var(--color-danger-50)]"
            iconColor="text-[var(--color-danger-600)]"
          />
        </div>
      )}

      <Filters
        filters={filters}
        onChange={setFilters}
        especialidades={options.especialidades}
        zonas={options.zonas}
        empresas={options.empresas}
      />

      {localError && <ErrorState message={localError} onRetry={() => setLocalError(null)} />}

      {isError ? (
        <ErrorState message={t("tech.error.load")} onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-[var(--color-text-secondary)]">
                <span className="tabular font-semibold text-[var(--color-text-primary)]">
                  {filtered.length}
                </span>{" "}
                {t("tech.visible")}
              </p>
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    disponibilidad: "",
                    especialidad: "",
                    zona: "",
                    busqueda: "",
                    empresa: "",
                  })
                }
                className="text-xs font-medium text-[var(--color-primary-700)] hover:underline"
              >
                {t("tech.clear_filters")}
              </button>
            </div>
            <TechnicianTable
              tecnicos={filtered}
              loading={isLoading}
              onView={openDetail}
              onEdit={setEditing}
              onDelete={deleteTecnico}
            />
          </div>
          <aside className="space-y-5">
            <TechnicianAvailabilityPanel tecnicos={tecnicos} onView={openDetail} />
            <TechnicianAssignmentSuggestion
              tecnicos={tecnicos}
              requiredSpecialty={filters.especialidad}
              zone={filters.zona}
              onView={openDetail}
            />
          </aside>
        </div>
      )}

      <TecnicoDetalleSheet
        tecnico={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <TecnicoFormSheet
        open={creating || Boolean(editing)}
        tecnico={editing}
        saving={crear.isPending || actualizar.isPending}
        error={localError}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setEditing(null)
            setLocalError(null)
          }
        }}
        onSubmit={submitTecnico}
      />
    </div>
  )
}

function Filters({
  filters,
  onChange,
  especialidades,
  zonas,
  empresas,
}: {
  filters: FiltersState
  onChange: Dispatch<SetStateAction<FiltersState>>
  especialidades: string[]
  zonas: string[]
  empresas: Array<{ id: string; nombre: string }>
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1.5fr]">
        <Field label={t("tech.filter.availability")}>
          <select
            value={filters.disponibilidad}
            onChange={(e) => onChange((f) => ({ ...f, disponibilidad: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">{t("tech.filter.all_avail")}</option>
            <option value="disponible">{t("tech.filter.avail")}</option>
            <option value="no_disponible">{t("tech.filter.unavail")}</option>
          </select>
        </Field>
        <Field label={t("tech.filter.specialty")}>
          <select
            value={filters.especialidad}
            onChange={(e) => onChange((f) => ({ ...f, especialidad: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">{t("tech.filter.all_spec")}</option>
            {especialidades.map((especialidad) => (
              <option key={especialidad} value={especialidad}>
                {especialidad}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("tech.filter.zone")}>
          <select
            value={filters.zona}
            onChange={(e) => onChange((f) => ({ ...f, zona: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">{t("tech.filter.all_zones")}</option>
            {zonas.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("tech.filter.company")}>
          <select
            value={filters.empresa}
            onChange={(e) => onChange((f) => ({ ...f, empresa: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">{t("tech.filter.all_comp")}</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("tech.filter.search")}>
          <div className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2">
            <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              value={filters.busqueda}
              onChange={(e) => onChange((f) => ({ ...f, busqueda: e.target.value }))}
              placeholder={t("tech.filter.search.ph")}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: (props: { className?: string }) => ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-[var(--color-primary-600)]" />
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  )
}

function TecnicoFormSheet({
  open,
  tecnico,
  saving,
  error,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  tecnico: Tecnico | null
  saving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: TecnicoFormSubmit) => Promise<void>
}) {
  const { t } = useI18n()
  const { data: empresas = [] } = useEmpresasCrud()
  const { data: ciudades = [] } = useCiudades()
  const { data: especialidades = [] } = useEspecialidades()
  const [form, setForm] = useState<TecnicoFormState>(() => toTecnicoForm(tecnico))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = Boolean(tecnico)

  useEffect(() => {
    setForm(toTecnicoForm(tecnico))
  }, [tecnico, open])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const perfil: TecnicoPerfilFormPayload = {
      empresa: Number(form.empresa),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      especialidades: form.especialidades.map(Number),
      zonas: form.zonas.map(Number),
      disponible: form.disponible,
      area_profesional: form.area_profesional.trim(),
      resumen_profesional: form.resumen_profesional.trim(),
      estudios: parseStudyLines(form.estudios),
      licencia_vence: form.licencia_vence || null,
      notas: form.notas.trim(),
      titulo_academico: form.titulo_academico.trim() || undefined,
      nivel_educativo: form.nivel_educativo || undefined,
      certificaciones: form.certificaciones.filter((c) => c.nombre.trim()),
      capacidad_operacion: form.capacidad_operacion.trim() || undefined,
    }

    void onSubmit({
      nuevoUsuario: isEditing
        ? null
        : {
            nombre: form.nombre.trim(),
            email: form.email.trim(),
            contrasena: form.contrasena,
            rol: "user",
          },
      perfil,
      hojaVida: form.hoja_vida,
    })
  }

  const addCert = () =>
    setForm((f) => ({
      ...f,
      certificaciones: [...f.certificaciones, { nombre: "", institucion: "", ano: "" }],
    }))

  const removeCert = (index: number) =>
    setForm((f) => ({
      ...f,
      certificaciones: f.certificaciones.filter((_, i) => i !== index),
    }))

  const updateCert = (index: number, field: keyof Certificacion, value: string) =>
    setForm((f) => ({
      ...f,
      certificaciones: f.certificaciones.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }))

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? t("tech.form.edit") : t("tech.form.new")}
      description={t("tech.form.desc")}
      className="max-w-4xl"
    >
      <form onSubmit={submit} className="space-y-6">

        {/* ── Datos de acceso ─────────────────────────────── */}
        {!isEditing && (
          <section>
            <SectionLabel icon={Users} label="Datos de acceso" />
            <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-3 sm:grid-cols-3">
              <Field label={t("tech.form.name")}>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setTecnicoField(setForm, "nombre", e.target.value)}
                  className="input-ui"
                />
              </Field>
              <Field label={t("tech.form.email")}>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setTecnicoField(setForm, "email", e.target.value)}
                  className="input-ui"
                />
              </Field>
              <Field label={t("tech.form.password")}>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={form.contrasena}
                  onChange={(e) => setTecnicoField(setForm, "contrasena", e.target.value)}
                  className="input-ui"
                  placeholder="Mín. 8 caracteres"
                />
                <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                  Debe tener al menos 8 caracteres, una mayúscula y un número.
                </p>
              </Field>
            </div>
          </section>
        )}

        {/* ── Información básica ──────────────────────────── */}
        <section>
          <SectionLabel icon={BriefcaseBusiness} label="Información básica" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("tech.form.company")}>
              <select
                required
                value={form.empresa}
                onChange={(e) => setTecnicoField(setForm, "empresa", e.target.value)}
                className="input-ui"
              >
                <option value="">{t("tech.form.select_company")}</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("tech.form.id")}>
              <input
                required
                value={form.cedula}
                onChange={(e) => setTecnicoField(setForm, "cedula", e.target.value)}
                className="input-ui"
              />
            </Field>
            <Field label={t("tech.form.phone")}>
              <input
                value={form.telefono}
                onChange={(e) => setTecnicoField(setForm, "telefono", e.target.value)}
                className="input-ui"
              />
            </Field>
            <Field label={t("tech.form.license")}>
              <input
                type="date"
                value={form.licencia_vence}
                onChange={(e) => setTecnicoField(setForm, "licencia_vence", e.target.value)}
                className="input-ui"
              />
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:col-span-2">
              <span>
                <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                  {t("tech.form.dispatch")}
                </span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  {t("tech.form.dispatch.desc")}
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(e) => setTecnicoField(setForm, "disponible", e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary-600)]"
              />
            </label>
          </div>
        </section>

        {/* ── Especialidades & Zonas ──────────────────────── */}
        <section>
          <SectionLabel icon={ShieldAlert} label="Especialidades y zonas de trabajo" />
          <div className="grid gap-4 lg:grid-cols-2">
            <CatalogSelector
              title={t("tech.form.specialties")}
              empty={t("tech.form.no_spec")}
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
            <CatalogSelector
              title={t("tech.form.zones")}
              empty={t("tech.form.no_cities")}
              items={ciudades}
              selected={form.zonas}
              getId={(item) => item.id}
              getLabel={(item) => item.nombre}
              onToggle={(id) =>
                setForm((current) => ({ ...current, zonas: toggleValue(current.zonas, id) }))
              }
            />
          </div>
        </section>

        {/* ── Formación académica ─────────────────────────── */}
        <section>
          <SectionLabel icon={GraduationCap} label="Formación académica" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nivel educativo">
              <select
                value={form.nivel_educativo}
                onChange={(e) => setTecnicoField(setForm, "nivel_educativo", e.target.value)}
                className="input-ui"
              >
                <option value="">Seleccionar nivel…</option>
                {NIVELES_EDUCATIVOS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Título académico">
              <input
                value={form.titulo_academico}
                onChange={(e) => setTecnicoField(setForm, "titulo_academico", e.target.value)}
                placeholder="Ej: Ing. Electricista"
                className="input-ui"
              />
            </Field>
            <Field label={t("tech.form.area")}>
              <input
                value={form.area_profesional}
                onChange={(e) => setTecnicoField(setForm, "area_profesional", e.target.value)}
                className="input-ui"
                placeholder={t("tech.form.area.ph")}
              />
            </Field>
            <Field label="Capacidad de operación">
              <select
                value={form.capacidad_operacion}
                onChange={(e) => setTecnicoField(setForm, "capacidad_operacion", e.target.value)}
                className="input-ui"
              >
                <option value="">Seleccionar tipo…</option>
                {CAPACIDADES_OPERACION.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* ── Certificaciones ─────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-[var(--color-primary-600)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Certificaciones
            </span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <button
              type="button"
              onClick={addCert}
              className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-700)] transition-colors"
            >
              <Plus className="h-3 w-3" />
              Añadir
            </button>
          </div>

          {form.certificaciones.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-neutral-50)] px-4 py-3 text-xs text-[var(--color-text-muted)] text-center">
              Sin certificaciones. Haz clic en "Añadir" para agregar una.
            </p>
          ) : (
            <div className="space-y-2">
              {form.certificaciones.map((cert, index) => (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-[1fr_1fr_80px_32px] items-end rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-2.5"
                >
                  <Field label="Nombre del certificado">
                    <input
                      value={cert.nombre}
                      onChange={(e) => updateCert(index, "nombre", e.target.value)}
                      placeholder="Ej: RETIE 2024"
                      className="input-ui"
                    />
                  </Field>
                  <Field label="Institución">
                    <input
                      value={cert.institucion ?? ""}
                      onChange={(e) => updateCert(index, "institucion", e.target.value)}
                      placeholder="Ej: ICONTEC"
                      className="input-ui"
                    />
                  </Field>
                  <Field label="Año">
                    <input
                      value={cert.ano ?? ""}
                      onChange={(e) => updateCert(index, "ano", e.target.value)}
                      placeholder="2024"
                      maxLength={4}
                      className="input-ui"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => removeCert(index)}
                    className="mb-0.5 flex h-9 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Perfil profesional ──────────────────────────── */}
        <section>
          <SectionLabel icon={UserCheck} label="Perfil profesional" />
          <div className="space-y-3">
            <Field label={t("tech.form.summary")}>
              <textarea
                value={form.resumen_profesional}
                onChange={(e) => setTecnicoField(setForm, "resumen_profesional", e.target.value)}
                className="input-ui min-h-24"
                placeholder="Resumen de experiencia y habilidades clave…"
              />
            </Field>
            <Field label={t("tech.form.studies")}>
              <textarea
                value={form.estudios}
                onChange={(e) => setTecnicoField(setForm, "estudios", e.target.value)}
                className="input-ui min-h-20"
                placeholder={t("tech.form.studies.ph")}
              />
            </Field>
          </div>
        </section>

        {/* ── Hoja de vida ────────────────────────────────── */}
        <section>
          <SectionLabel icon={FileText} label="Hoja de vida (CV)" />
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-neutral-50)] p-4">
            {/* Existing file link when editing */}
            {isEditing && tecnico?.hojaVidaUrl && !form.hoja_vida && (
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--color-primary-600)]" />
                <a
                  href={tecnico.hojaVidaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[var(--color-primary-600)] hover:underline"
                >
                  Ver CV actual
                </a>
                <span className="text-xs text-[var(--color-text-muted)]">
                  — sube un nuevo archivo para reemplazarlo
                </span>
              </div>
            )}

            {form.hoja_vida ? (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--color-primary-600)]" />
                <span className="flex-1 truncate text-xs font-medium text-[var(--color-text-primary)]">
                  {form.hoja_vida.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTecnicoField(setForm, "hoja_vida", null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="rounded-full p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger-600)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary-600)] transition-colors"
              >
                <FileText className="h-8 w-8 opacity-40" />
                <span className="text-xs font-medium">Haz clic para subir CV (PDF, max 5 MB)</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setTecnicoField(setForm, "hoja_vida", file)
              }}
            />
          </div>
        </section>

        {/* ── Notas internas ──────────────────────────────── */}
        <section>
          <SectionLabel icon={ClipboardList} label="Notas internas" />
          <Field label={t("tech.form.notes")}>
            <textarea
              value={form.notas}
              onChange={(e) => setTecnicoField(setForm, "notas", e.target.value)}
              className="input-ui min-h-20"
              placeholder="Observaciones internas sobre el técnico…"
            />
          </Field>
        </section>

        {/* ── Error del API ───────────────────────────────── */}
        {error && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-4 py-3 text-sm text-[var(--color-danger-600)]">
            <span className="font-semibold">Error al guardar: </span>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
          <button type="button" onClick={() => onOpenChange(false)} className="btn-secondary">
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? "Guardando…" : t("common.save.short")}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

function CatalogSelector<T extends EmpresaBasica | CiudadBasica | Especialidad>({
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
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
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
                    ? "cursor-pointer inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--color-primary-600)] bg-[var(--color-primary-600)] px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all"
                    : "cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-solar-500)] hover:text-[var(--color-text-primary)] transition-all"
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(id)}
                  className="sr-only"
                />
                {checked && (
                  <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {getLabel(item)}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function toTecnicoForm(tecnico: Tecnico | null): TecnicoFormState {
  return {
    nombre: tecnico?.nombre ?? "",
    email: tecnico?.email ?? "",
    contrasena: "",
    empresa: tecnico?.empresaId ? String(tecnico.empresaId) : "",
    cedula: tecnico?.cedula ?? "",
    telefono: tecnico?.telefono ?? "",
    especialidades: tecnico?.especialidadesIds.map(String) ?? [],
    zonas: tecnico?.zonasIds.map(String) ?? [],
    disponible: tecnico?.disponible ?? true,
    area_profesional: tecnico?.areaProfesional ?? "",
    resumen_profesional: tecnico?.resumenProfesional ?? "",
    estudios: tecnico?.estudios.join("\n") ?? "",
    licencia_vence: tecnico?.licenciaVence ?? "",
    notas: tecnico?.notas ?? "",
    // Formación académica
    titulo_academico: tecnico?.tituloAcademico ?? "",
    nivel_educativo: tecnico?.nivelEducativo ?? "",
    certificaciones: tecnico?.certificaciones ?? [],
    capacidad_operacion: tecnico?.capacidadOperacion ?? "",
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

function setTecnicoField<K extends keyof TecnicoFormState>(
  setter: Dispatch<SetStateAction<TecnicoFormState>>,
  key: K,
  value: TecnicoFormState[K]
) {
  setter((current) => ({ ...current, [key]: value }))
}

function matches(values: string[], expected: string) {
  const q = expected.trim().toLowerCase()
  return values.some((value) => value.toLowerCase().includes(q))
}

function getMetrics(tecnicos: Tecnico[]) {
  const cargas = tecnicos
    .map((t) => t.cargaTrabajo)
    .filter((value): value is number => value != null)
  const licencias = tecnicos
    .map((t) => t.licenciaVence)
    .filter((value): value is string => Boolean(value))

  return {
    total: tecnicos.length,
    disponibles: tecnicos.filter((t) => t.disponible).length,
    noDisponibles: tecnicos.filter((t) => !t.disponible).length,
    especialidades: new Set(tecnicos.flatMap((t) => t.especialidades)).size,
    cargaPromedio: cargas.length
      ? Math.round(cargas.reduce((sum, value) => sum + value, 0) / cargas.length)
      : null,
    licenciasProximas: licencias.length ? countLicensesExpiring(licencias) : null,
  }
}

function countLicensesExpiring(dates: string[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today)
  limit.setDate(limit.getDate() + 30)
  return dates.filter((date) => {
    const parsed = new Date(date)
    return parsed >= today && parsed <= limit
  }).length
}

/**
 * Extrae el mensaje de error real desde una respuesta Axios.
 * Si el backend devuelve { detail: "..." } o { email: ["..."] } lo muestra.
 * Fallback: el message genérico de JS Error.
 */
function extractApiError(error: unknown): string {
  if (error && typeof error === "object") {
    // Axios error con respuesta del servidor
    const axiosError = error as { response?: { data?: unknown }; message?: string }
    const data = axiosError.response?.data
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>
      // Django REST Framework: { detail: "..." }
      if (typeof d.detail === "string") return d.detail
      // Errores de campo: { email: ["ya existe"], nombre: ["requerido"] }
      const fieldErrors = Object.entries(d)
        .map(([field, msgs]) => {
          const list = Array.isArray(msgs) ? msgs.join(", ") : String(msgs)
          return `${field}: ${list}`
        })
        .join(" | ")
      if (fieldErrors) return fieldErrors
    }
    if (typeof axiosError.message === "string") return axiosError.message
  }
  return "No se pudo guardar el técnico"
}
