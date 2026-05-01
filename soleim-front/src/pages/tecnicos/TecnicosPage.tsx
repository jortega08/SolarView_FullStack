import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import { Link } from "react-router-dom"
import {
  BriefcaseBusiness,
  ClipboardList,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { MetricCard } from "@/components/data/MetricCard"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { Sheet } from "@/components/overlays/Sheet"
import { useCiudades, useEmpresasCrud } from "@/hooks/useCrudCatalogos"
import { useEspecialidades, useTecnicoMutations, useTecnicos } from "@/hooks/useTecnicos"
import { catalogosService } from "@/services/catalogos.service"
import type { TecnicoPayload } from "@/services/tecnicos.service"
import type { CiudadBasica, EmpresaBasica, Especialidad, Tecnico } from "@/types/domain"
import { TechnicianTable } from "@/features/tecnicos/TechnicianTable"
import { TechnicianAvailabilityPanel } from "@/features/tecnicos/TechnicianAvailabilityPanel"
import { TechnicianAssignmentSuggestion } from "@/features/tecnicos/TechnicianAssignmentSuggestion"
import { TecnicoDetalleSheet } from "@/features/tecnicos/TecnicoDetalleSheet"

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
}

type TecnicoPerfilFormPayload = Partial<TecnicoPayload> & {
  empresa: number
  cedula: string
  disponible: boolean
  especialidades: number[]
  zonas: number[]
}

interface TecnicoFormSubmit {
  nuevoUsuario: {
    nombre: string
    email: string
    contrasena: string
    rol: string
  } | null
  perfil: TecnicoPerfilFormPayload
}

export default function TecnicosPage() {
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

  const submitTecnico = async ({ nuevoUsuario, perfil }: TecnicoFormSubmit) => {
    setLocalError(null)
    try {
      if (editing) {
        await actualizar.mutateAsync({ id: editing.id, payload: perfil })
        setEditing(null)
        return
      }

      if (!nuevoUsuario) throw new Error("Faltan datos del usuario.")
      const usuario = await catalogosService.crearUsuario(nuevoUsuario)
      const usuarioId = usuario.idusuario ?? usuario.id
      if (!usuarioId) throw new Error("No se recibio el usuario creado.")
      await crear.mutateAsync({ ...perfil, usuario: usuarioId })
      setCreating(false)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo guardar el tecnico")
    }
  }

  const deleteTecnico = async (tecnico: Tecnico) => {
    if (!window.confirm(`Eliminar el perfil de ${tecnico.nombre}?`)) return
    setLocalError(null)
    try {
      await eliminar.mutateAsync(tecnico.id)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo eliminar el tecnico")
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operación técnica"
        title="Técnicos"
        description="Disponibilidad, especialidades, zonas de cobertura y carga operativa."
        actions={
          <>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
            >
              <Plus className="h-4 w-4" />
              Nuevo tecnico
            </button>
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, disponibilidad: "disponible" }))}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
            >
              <UserCheck className="h-4 w-4" />
              Ver disponibles
            </button>
            <Link
              to="/ordenes"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)]"
            >
              <ClipboardList className="h-4 w-4" />
              Asignar a orden
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
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
          <MetricCard title="Total técnicos" value={String(metrics.total)} icon={Users} />
          <MetricCard
            title="Disponibles"
            value={String(metrics.disponibles)}
            icon={UserCheck}
            iconBg="bg-[var(--color-energy-50)]"
            iconColor="text-[var(--color-energy-700)]"
          />
          <MetricCard
            title="En campo"
            value={String(metrics.noDisponibles)}
            icon={BriefcaseBusiness}
            iconBg="bg-[var(--color-warning-50)]"
            iconColor="text-[var(--color-warning-700)]"
          />
          <MetricCard
            title="Especialidades"
            value={String(metrics.especialidades)}
            delta="Cobertura visible"
            icon={ShieldAlert}
            iconBg="bg-[var(--color-sla-50)]"
            iconColor="text-[var(--color-sla-700)]"
          />
          <MetricCard
            title="Carga promedio"
            value={metrics.cargaPromedio == null ? "N/D" : `${metrics.cargaPromedio}`}
            delta={metrics.cargaPromedio == null ? "No expuesta por backend" : "Órdenes activas"}
            icon={ClipboardList}
          />
          <MetricCard
            title="Licencia próxima"
            value={metrics.licenciasProximas == null ? "N/D" : String(metrics.licenciasProximas)}
            delta="Próximos 30 días"
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
        <ErrorState message="No se pudieron cargar los técnicos" onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-[var(--color-text-secondary)]">
                <span className="tabular font-semibold text-[var(--color-text-primary)]">
                  {filtered.length}
                </span>{" "}
                técnicos visibles
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
                Limpiar filtros
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
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setEditing(null)
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
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1.5fr]">
        <Field label="Disponibilidad">
          <select
            value={filters.disponibilidad}
            onChange={(e) => onChange((f) => ({ ...f, disponibilidad: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">Toda disponibilidad</option>
            <option value="disponible">Disponible</option>
            <option value="no_disponible">No disponible</option>
          </select>
        </Field>
        <Field label="Especialidad">
          <select
            value={filters.especialidad}
            onChange={(e) => onChange((f) => ({ ...f, especialidad: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">Todas</option>
            {especialidades.map((especialidad) => (
              <option key={especialidad} value={especialidad}>
                {especialidad}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Zona">
          <select
            value={filters.zona}
            onChange={(e) => onChange((f) => ({ ...f, zona: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">Todas</option>
            {zonas.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Empresa">
          <select
            value={filters.empresa}
            onChange={(e) => onChange((f) => ({ ...f, empresa: e.target.value }))}
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none"
          >
            <option value="">Todas</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Búsqueda">
          <div className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2">
            <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              value={filters.busqueda}
              onChange={(e) => onChange((f) => ({ ...f, busqueda: e.target.value }))}
              placeholder="Nombre, correo, documento"
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

function TecnicoFormSheet({
  open,
  tecnico,
  saving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  tecnico: Tecnico | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: TecnicoFormSubmit) => Promise<void>
}) {
  const { data: empresas = [] } = useEmpresasCrud()
  const { data: ciudades = [] } = useCiudades()
  const { data: especialidades = [] } = useEspecialidades()
  const [form, setForm] = useState<TecnicoFormState>(() => toTecnicoForm(tecnico))
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
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar tecnico" : "Nuevo tecnico"}
      description="Cuenta, disponibilidad, especialidades y perfil profesional"
      className="max-w-4xl"
    >
      <form onSubmit={submit} className="space-y-5">
        {!isEditing && (
          <section className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-3 sm:grid-cols-3">
            <Field label="Nombre">
              <input
                required
                value={form.nombre}
                onChange={(e) => setTecnicoField(setForm, "nombre", e.target.value)}
                className="input-ui"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setTecnicoField(setForm, "email", e.target.value)}
                className="input-ui"
              />
            </Field>
            <Field label="Contrasena temporal">
              <input
                required
                minLength={8}
                type="password"
                value={form.contrasena}
                onChange={(e) => setTecnicoField(setForm, "contrasena", e.target.value)}
                className="input-ui"
              />
            </Field>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          <Field label="Empresa">
            <select
              required
              value={form.empresa}
              onChange={(e) => setTecnicoField(setForm, "empresa", e.target.value)}
              className="input-ui"
            >
              <option value="">Seleccionar empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cedula">
            <input
              required
              value={form.cedula}
              onChange={(e) => setTecnicoField(setForm, "cedula", e.target.value)}
              className="input-ui"
            />
          </Field>
          <Field label="Telefono">
            <input
              value={form.telefono}
              onChange={(e) => setTecnicoField(setForm, "telefono", e.target.value)}
              className="input-ui"
            />
          </Field>
          <Field label="Licencia vence">
            <input
              type="date"
              value={form.licencia_vence}
              onChange={(e) => setTecnicoField(setForm, "licencia_vence", e.target.value)}
              className="input-ui"
            />
          </Field>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <CatalogSelector
            title="Especialidades"
            empty="No hay especialidades creadas."
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
            title="Zonas"
            empty="No hay ciudades creadas."
            items={ciudades}
            selected={form.zonas}
            getId={(item) => item.id}
            getLabel={(item) => item.nombre}
            onToggle={(id) =>
              setForm((current) => ({ ...current, zonas: toggleValue(current.zonas, id) }))
            }
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Field label="Area profesional">
            <input
              value={form.area_profesional}
              onChange={(e) => setTecnicoField(setForm, "area_profesional", e.target.value)}
              className="input-ui"
              placeholder="Fotovoltaica, redes, baterias"
            />
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <span>
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                Disponible para despacho
              </span>
              <span className="block text-xs text-[var(--color-text-muted)]">
                Controla si aparece en sugerencias operativas
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.disponible}
              onChange={(e) => setTecnicoField(setForm, "disponible", e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </section>

        <Field label="Resumen profesional">
          <textarea
            value={form.resumen_profesional}
            onChange={(e) => setTecnicoField(setForm, "resumen_profesional", e.target.value)}
            className="input-ui min-h-24"
          />
        </Field>
        <Field label="Estudios">
          <textarea
            value={form.estudios}
            onChange={(e) => setTecnicoField(setForm, "estudios", e.target.value)}
            className="input-ui min-h-24"
            placeholder="Un estudio por linea"
          />
        </Field>
        <Field label="Notas">
          <textarea
            value={form.notas}
            onChange={(e) => setTecnicoField(setForm, "notas", e.target.value)}
            className="input-ui min-h-20"
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
          <button type="button" onClick={() => onOpenChange(false)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            Guardar
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
