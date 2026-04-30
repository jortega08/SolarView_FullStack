import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import {
  Camera,
  Cpu,
  Eye,
  ImagePlus,
  Pencil,
  Plus,
  Radio,
  Save,
  Search,
  Trash2,
  Unlink,
} from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { Sheet } from "@/components/overlays/Sheet"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { StatusBadge } from "@/components/status/StatusBadge"
import { formatDate } from "@/lib/format"
import { useCiudades, useEmpresasCrud } from "@/hooks/useCrudCatalogos"
import {
  useInstalacionMutations,
  useInstalacionesCrud,
  useSensorMutations,
  useSensores,
} from "@/hooks/useInstalacionesCrud"
import type { InstalacionCrud, SensorInstalacion } from "@/types/domain"
import type { InstalacionPayload, SensorPayload } from "@/services/instalaciones-crud.service"

const TIPOS_SISTEMA = [
  { value: "hibrido", label: "Hibrido" },
  { value: "off_grid", label: "Off grid" },
  { value: "grid_tie", label: "Grid tie" },
]

const ESTADOS_INSTALACION = [
  { value: "activa", label: "Activa" },
  { value: "inactiva", label: "Inactiva" },
  { value: "mantenimiento", label: "Mantenimiento" },
]

const TIPOS_SENSOR = [
  "gateway",
  "inversor",
  "medidor",
  "bateria",
  "irradiancia",
  "temperatura",
  "otro",
]

interface InstalacionFormState {
  empresa: string
  nombre: string
  direccion: string
  ciudad: string
  tipo_sistema: string
  capacidad_panel_kw: string
  capacidad_bateria_kwh: string
  fecha_instalacion: string
  estado: string
  imagen: File | null
}

interface SensorFormState {
  nombre: string
  codigo: string
  tipo: string
  unidad: string
  estado: string
  notas: string
}

export default function InstalacionesListPage() {
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<InstalacionCrud | null>(null)
  const [creating, setCreating] = useState(false)
  const [sensorTarget, setSensorTarget] = useState<InstalacionCrud | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const { data: instalaciones = [], isLoading, isError, refetch } = useInstalacionesCrud()
  const { data: sensores = [] } = useSensores()
  const { crear, actualizar, eliminar } = useInstalacionMutations()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return instalaciones
    return instalaciones.filter((inst) =>
      [
        inst.nombre,
        inst.empresaNombre ?? "",
        inst.ciudadNombre ?? "",
        inst.direccion,
        inst.tipoSistema,
        inst.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [instalaciones, query])

  const sensorCountByInstallation = useMemo(() => {
    const map = new Map<number, number>()
    sensores.forEach((sensor) => {
      if (!sensor.instalacionId) return
      map.set(sensor.instalacionId, (map.get(sensor.instalacionId) ?? 0) + 1)
    })
    return map
  }, [sensores])

  const columns: DataTableColumn<InstalacionCrud>[] = [
    {
      id: "nombre",
      header: "Instalacion",
      cell: (inst) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="h-12 w-16 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]">
            {inst.imagenUrl ? (
              <img src={inst.imagenUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Camera className="h-4 w-4 text-[var(--color-neutral-400)]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
              {inst.nombre}
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {inst.empresaNombre ?? "Sin empresa"} - {inst.ciudadNombre ?? "Sin ciudad"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "estado",
      header: "Estado",
      cell: (inst) => <StatusBadge estado={inst.estado} />,
    },
    {
      id: "tipo",
      header: "Tipo",
      cell: (inst) => (
        <span className="text-xs capitalize text-[var(--color-text-secondary)]">
          {inst.tipoSistema.replace("_", " ")}
        </span>
      ),
    },
    {
      id: "capacidad",
      header: "Capacidad",
      cell: (inst) => (
        <span className="tabular text-xs text-[var(--color-text-secondary)]">
          {inst.capacidadPanelKw} kWp / {inst.capacidadBateriaKwh} kWh
        </span>
      ),
    },
    {
      id: "sensores",
      header: "Sensores",
      cell: (inst) => (
        <button
          type="button"
          onClick={() => setSensorTarget(inst)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-50)]"
        >
          <Radio className="h-3.5 w-3.5" />
          {sensorCountByInstallation.get(inst.id) ?? 0}
        </button>
      ),
    },
    {
      id: "fecha",
      header: "Instalada",
      cell: (inst) => (
        <span className="tabular text-xs text-[var(--color-text-secondary)]">
          {inst.fechaInstalacion ? formatDate(inst.fechaInstalacion) : "N/D"}
        </span>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "text-right",
      headerClassName: "text-right",
      cell: (inst) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/instalaciones/${inst.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setEditing(inst)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Eliminar ${inst.nombre}?`)) void eliminar.mutateAsync(inst.id)
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const onSubmit = async (payload: InstalacionPayload) => {
    setLocalError(null)
    try {
      if (editing) {
        await actualizar.mutateAsync({ id: editing.id, payload })
        setEditing(null)
      } else {
        await crear.mutateAsync(payload)
        setCreating(false)
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo guardar la instalacion")
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Inventario"
        title="Instalaciones"
        description="CRUD operativo de instalaciones, fotos de sitio y sensores asociados."
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
          >
            <Plus className="h-4 w-4" />
            Nueva instalacion
          </button>
        }
      />

      <div className="flex h-10 items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 shadow-[var(--shadow-card)]">
        <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por instalacion, empresa, ciudad, direccion o tipo"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      {localError && <ErrorState message={localError} onRetry={() => setLocalError(null)} />}

      {isError ? (
        <ErrorState message="No se pudieron cargar las instalaciones" onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          loading={isLoading}
          getRowKey={(inst) => inst.id}
          emptyTitle="Sin instalaciones"
          emptyDescription="Crea una instalacion o ajusta los filtros para verla aqui."
        />
      )}

      <InstalacionFormSheet
        open={creating || Boolean(editing)}
        instalacion={editing}
        saving={crear.isPending || actualizar.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setEditing(null)
          }
        }}
        onSubmit={onSubmit}
      />

      <SensoresSheet
        instalacion={sensorTarget}
        sensores={sensores}
        onOpenChange={(open) => {
          if (!open) setSensorTarget(null)
        }}
      />
    </div>
  )
}

function InstalacionFormSheet({
  open,
  instalacion,
  saving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  instalacion: InstalacionCrud | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: InstalacionPayload) => Promise<void>
}) {
  const { data: empresas = [] } = useEmpresasCrud()
  const { data: ciudades = [] } = useCiudades()
  const [form, setForm] = useState<InstalacionFormState>(() => toInstalacionForm(instalacion))

  useEffect(() => {
    setForm(toInstalacionForm(instalacion))
  }, [instalacion, open])

  const preview = useMemo(
    () => (form.imagen ? URL.createObjectURL(form.imagen) : instalacion?.imagenUrl ?? null),
    [form.imagen, instalacion?.imagenUrl]
  )

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit({
      empresa: Number(form.empresa),
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      ciudad: form.ciudad ? Number(form.ciudad) : null,
      tipo_sistema: form.tipo_sistema,
      capacidad_panel_kw: Number(form.capacidad_panel_kw || 0),
      capacidad_bateria_kwh: Number(form.capacidad_bateria_kwh || 0),
      fecha_instalacion: form.fecha_instalacion || null,
      estado: form.estado,
      imagen: form.imagen,
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={instalacion ? "Editar instalacion" : "Nueva instalacion"}
      description="Datos del sitio, capacidad y foto principal"
      className="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <label className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-neutral-50)]">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                <ImagePlus className="h-6 w-6" />
                Agregar foto
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((current) => ({ ...current, imagen: event.target.files?.[0] ?? null }))
              }
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input required value={form.nombre} onChange={(e) => setFormField(setForm, "nombre", e.target.value)} className="input-ui" />
            </Field>
            <Field label="Empresa">
              <select required value={form.empresa} onChange={(e) => setFormField(setForm, "empresa", e.target.value)} className="input-ui">
                <option value="">Seleccionar empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Ciudad">
              <select value={form.ciudad} onChange={(e) => setFormField(setForm, "ciudad", e.target.value)} className="input-ui">
                <option value="">Sin ciudad</option>
                {ciudades.map((ciudad) => (
                  <option key={ciudad.id} value={ciudad.id}>{ciudad.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.estado} onChange={(e) => setFormField(setForm, "estado", e.target.value)} className="input-ui">
                {ESTADOS_INSTALACION.map((estado) => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de sistema">
              <select value={form.tipo_sistema} onChange={(e) => setFormField(setForm, "tipo_sistema", e.target.value)} className="input-ui">
                {TIPOS_SISTEMA.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Fecha instalacion">
              <input type="date" value={form.fecha_instalacion} onChange={(e) => setFormField(setForm, "fecha_instalacion", e.target.value)} className="input-ui" />
            </Field>
            <Field label="Capacidad panel kWp">
              <input type="number" min="0" step="0.01" value={form.capacidad_panel_kw} onChange={(e) => setFormField(setForm, "capacidad_panel_kw", e.target.value)} className="input-ui" />
            </Field>
            <Field label="Capacidad bateria kWh">
              <input type="number" min="0" step="0.01" value={form.capacidad_bateria_kwh} onChange={(e) => setFormField(setForm, "capacidad_bateria_kwh", e.target.value)} className="input-ui" />
            </Field>
          </div>
        </div>

        <Field label="Direccion">
          <input value={form.direccion} onChange={(e) => setFormField(setForm, "direccion", e.target.value)} className="input-ui" />
        </Field>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
          <button type="button" onClick={() => onOpenChange(false)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </form>
    </Sheet>
  )
}

function SensoresSheet({
  instalacion,
  sensores,
  onOpenChange,
}: {
  instalacion: InstalacionCrud | null
  sensores: SensorInstalacion[]
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] = useState<SensorFormState>({
    nombre: "",
    codigo: "",
    tipo: "medidor",
    unidad: "kW",
    estado: "activo",
    notas: "",
  })
  const { crear, actualizar, eliminar } = useSensorMutations()

  const assigned = sensores.filter((sensor) => sensor.instalacionId === instalacion?.id)
  const available = sensores.filter((sensor) => sensor.instalacionId == null)

  const createSensor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!instalacion) return
    const payload: SensorPayload = {
      instalacion: instalacion.id,
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      tipo: form.tipo,
      unidad: form.unidad.trim(),
      estado: form.estado,
      notas: form.notas.trim(),
    }
    await crear.mutateAsync(payload)
    setForm({ nombre: "", codigo: "", tipo: "medidor", unidad: "kW", estado: "activo", notas: "" })
  }

  return (
    <Sheet
      open={Boolean(instalacion)}
      onOpenChange={onOpenChange}
      title={instalacion?.nombre ?? "Sensores"}
      description="Asignacion y CRUD de sensores de campo"
      className="max-w-3xl"
    >
      {instalacion ? (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Sensores asignados</h3>
            {assigned.length === 0 ? (
              <EmptyState icon={Radio} title="Sin sensores asignados" className="py-6" />
            ) : (
              <div className="space-y-2">
                {assigned.map((sensor) => (
                  <SensorRow
                    key={sensor.id}
                    sensor={sensor}
                    actionIcon={<Unlink className="h-4 w-4" />}
                    actionLabel="Desasignar"
                    onAction={() => actualizar.mutate({ id: sensor.id, payload: { instalacion: null } })}
                    onDelete={() => eliminar.mutate(sensor.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Disponibles para asignar</h3>
            {available.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No hay sensores libres.</p>
            ) : (
              <div className="space-y-2">
                {available.map((sensor) => (
                  <SensorRow
                    key={sensor.id}
                    sensor={sensor}
                    actionIcon={<Radio className="h-4 w-4" />}
                    actionLabel="Asignar"
                    onAction={() => actualizar.mutate({ id: sensor.id, payload: { instalacion: instalacion.id } })}
                    onDelete={() => eliminar.mutate(sensor.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <form onSubmit={createSensor} className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <Cpu className="h-4 w-4" />
              Nuevo sensor
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre"><input required value={form.nombre} onChange={(e) => setFormField(setForm, "nombre", e.target.value)} className="input-ui" /></Field>
              <Field label="Codigo"><input required value={form.codigo} onChange={(e) => setFormField(setForm, "codigo", e.target.value)} className="input-ui" /></Field>
              <Field label="Tipo">
                <select value={form.tipo} onChange={(e) => setFormField(setForm, "tipo", e.target.value)} className="input-ui">
                  {TIPOS_SENSOR.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </Field>
              <Field label="Unidad"><input value={form.unidad} onChange={(e) => setFormField(setForm, "unidad", e.target.value)} className="input-ui" /></Field>
            </div>
            <Field label="Notas"><textarea value={form.notas} onChange={(e) => setFormField(setForm, "notas", e.target.value)} className="input-ui min-h-20" /></Field>
            <button type="submit" className="btn-primary"><Plus className="h-4 w-4" />Crear y asignar</button>
          </form>
        </div>
      ) : null}
    </Sheet>
  )
}

function SensorRow({
  sensor,
  actionIcon,
  actionLabel,
  onAction,
  onDelete,
}: {
  sensor: SensorInstalacion
  actionIcon: ReactNode
  actionLabel: string
  onAction: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{sensor.nombre}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {sensor.codigo} - {sensor.tipo} - {sensor.estado}
        </p>
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={onAction} className="btn-icon" title={actionLabel}>{actionIcon}</button>
        <button type="button" onClick={onDelete} className="btn-icon-danger" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">{label}</span>
      {children}
    </label>
  )
}

function toInstalacionForm(instalacion: InstalacionCrud | null): InstalacionFormState {
  return {
    empresa: instalacion ? String(instalacion.empresaId) : "",
    nombre: instalacion?.nombre ?? "",
    direccion: instalacion?.direccion ?? "",
    ciudad: instalacion?.ciudadId ? String(instalacion.ciudadId) : "",
    tipo_sistema: instalacion?.tipoSistema ?? "hibrido",
    capacidad_panel_kw: instalacion ? String(instalacion.capacidadPanelKw) : "0",
    capacidad_bateria_kwh: instalacion ? String(instalacion.capacidadBateriaKwh) : "0",
    fecha_instalacion: instalacion?.fechaInstalacion ?? "",
    estado: instalacion?.estado ?? "activa",
    imagen: null,
  }
}

function setFormField<T extends object>(
  setter: Dispatch<SetStateAction<T>>,
  key: keyof T,
  value: string
) {
  setter((current) => ({ ...current, [key]: value }))
}
