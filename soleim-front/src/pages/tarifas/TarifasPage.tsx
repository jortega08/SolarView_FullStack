import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import { DollarSign, Pencil, Plus, Save, Search, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { DataTable, type DataTableColumn } from "@/components/data/DataTable"
import { Sheet } from "@/components/overlays/Sheet"
import { ErrorState } from "@/components/feedback/ErrorState"
import { formatDate } from "@/lib/format"
import { useCiudades } from "@/hooks/useCrudCatalogos"
import { useInstalacionesCrud } from "@/hooks/useInstalacionesCrud"
import { useTarifaMutations, useTarifas } from "@/hooks/useTarifasCrud"
import type { Tarifa } from "@/types/domain"
import type { TarifaPayload } from "@/services/tarifas.service"

const MONEDAS = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "USD", label: "USD — Dólar" },
  { value: "MXN", label: "MXN — Peso mexicano" },
]

interface TarifaFormState {
  nombre: string
  scope: "ciudad" | "instalacion" | "global"
  ciudad: string
  instalacion: string
  valor_kwh: string
  moneda: string
  vigente_desde: string
  vigente_hasta: string
}

function toForm(t: Tarifa | null): TarifaFormState {
  return {
    nombre: t?.nombre ?? "",
    scope: t?.scope ?? "ciudad",
    ciudad: t?.ciudadId ? String(t.ciudadId) : "",
    instalacion: t?.instalacionId ? String(t.instalacionId) : "",
    valor_kwh: t ? String(t.valorKwh) : "",
    moneda: t?.moneda ?? "COP",
    vigente_desde: t?.vigenteDesde ? toDatetimeLocal(t.vigenteDesde) : nowDatetimeLocal(),
    vigente_hasta: t?.vigenteHasta ? toDatetimeLocal(t.vigenteHasta) : "",
  }
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ""
  const tz = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tz).toISOString().slice(0, 16)
}

function nowDatetimeLocal(): string {
  return toDatetimeLocal(new Date().toISOString())
}

function fromDatetimeLocal(local: string): string {
  if (!local) return ""
  return new Date(local).toISOString()
}

export default function TarifasPage() {
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Tarifa | null>(null)
  const [creating, setCreating] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { data: tarifas = [], isLoading, isError, refetch } = useTarifas()
  const { crear, actualizar, eliminar } = useTarifaMutations()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tarifas
    return tarifas.filter((t) =>
      [
        t.nombre,
        t.ciudadNombre ?? "",
        t.instalacionNombre ?? "",
        t.moneda,
        String(t.valorKwh),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [tarifas, query])

  const columns: DataTableColumn<Tarifa>[] = [
    {
      id: "nombre",
      header: "Tarifa",
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
            {t.nombre}
          </p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">
            {scopeLabel(t)}
          </p>
        </div>
      ),
    },
    {
      id: "valor",
      header: "Valor kWh",
      cell: (t) => (
        <span className="tabular text-xs font-semibold text-[var(--color-text-primary)]">
          {t.valorKwh.toLocaleString("es-CO", { maximumFractionDigits: 2 })} {t.moneda}
        </span>
      ),
    },
    {
      id: "vigencia",
      header: "Vigencia",
      cell: (t) => (
        <span className="tabular text-xs text-[var(--color-text-secondary)]">
          {formatDate(t.vigenteDesde)}
          {t.vigenteHasta ? ` → ${formatDate(t.vigenteHasta)}` : " → indef."}
        </span>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "text-right",
      headerClassName: "text-right",
      cell: (t) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(t)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Eliminar tarifa "${t.nombre}"?`)) {
                void eliminar.mutateAsync(t.id)
              }
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

  const onSubmit = async (payload: TarifaPayload) => {
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
      const msg = formatAxiosError(error)
      setLocalError(msg)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Facturación"
        title="Tarifas de energía"
        description="Define el valor del kWh por ciudad o instalación. Usado por el dashboard para calcular consumo, ahorro solar y total."
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
          >
            <Plus className="h-4 w-4" />
            Nueva tarifa
          </button>
        }
      />

      <div className="flex h-10 items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 shadow-[var(--shadow-card)]">
        <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, ciudad, instalación, moneda o valor"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      {localError && <ErrorState message={localError} onRetry={() => setLocalError(null)} />}

      {isError ? (
        <ErrorState message="No se pudieron cargar las tarifas" onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          loading={isLoading}
          getRowKey={(t) => t.id}
          emptyTitle="Sin tarifas configuradas"
          emptyDescription="Mientras no haya tarifas, el sistema usa el fallback (800 COP/kWh)."
        />
      )}

      <TarifaFormSheet
        open={creating || Boolean(editing)}
        tarifa={editing}
        saving={crear.isPending || actualizar.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setEditing(null)
          }
        }}
        onSubmit={onSubmit}
      />
    </div>
  )
}

function TarifaFormSheet({
  open,
  tarifa,
  saving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  tarifa: Tarifa | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: TarifaPayload) => Promise<void>
}) {
  const { data: ciudades = [] } = useCiudades()
  const { data: instalaciones = [] } = useInstalacionesCrud()
  const [form, setForm] = useState<TarifaFormState>(() => toForm(tarifa))

  useEffect(() => {
    setForm(toForm(tarifa))
  }, [tarifa, open])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload: TarifaPayload = {
      nombre: form.nombre.trim(),
      valor_kwh: form.valor_kwh,
      moneda: form.moneda,
      vigente_desde: fromDatetimeLocal(form.vigente_desde),
      vigente_hasta: form.vigente_hasta ? fromDatetimeLocal(form.vigente_hasta) : null,
      ciudad: form.scope === "ciudad" && form.ciudad ? Number(form.ciudad) : null,
      instalacion:
        form.scope === "instalacion" && form.instalacion ? Number(form.instalacion) : null,
    }
    void onSubmit(payload)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={tarifa ? "Editar tarifa" : "Nueva tarifa"}
      description="Valor del kWh aplicado a una ciudad o instalación"
      className="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre">
          <input
            required
            value={form.nombre}
            onChange={(e) => setFormField(setForm, "nombre", e.target.value)}
            placeholder="p.ej. Bogotá residencial 2026 Q1"
            className="input-ui"
            maxLength={120}
          />
        </Field>

        <Field label="Aplica a">
          <select
            value={form.scope}
            onChange={(e) => setFormField(setForm, "scope", e.target.value)}
            className="input-ui"
          >
            <option value="ciudad">Ciudad (default para todas las instalaciones)</option>
            <option value="instalacion">Instalación específica (override)</option>
            <option value="global">Global (fallback de todo el sistema)</option>
          </select>
        </Field>

        {form.scope === "ciudad" && (
          <Field label="Ciudad">
            <select
              required
              value={form.ciudad}
              onChange={(e) => setFormField(setForm, "ciudad", e.target.value)}
              className="input-ui"
            >
              <option value="">Selecciona ciudad</option>
              {ciudades.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Field>
        )}

        {form.scope === "instalacion" && (
          <Field label="Instalación">
            <select
              required
              value={form.instalacion}
              onChange={(e) => setFormField(setForm, "instalacion", e.target.value)}
              className="input-ui"
            >
              <option value="">Selecciona instalación</option>
              {instalaciones.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Valor kWh">
            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.valor_kwh}
                onChange={(e) => setFormField(setForm, "valor_kwh", e.target.value)}
                className="input-ui pl-7"
                placeholder="850.00"
              />
            </div>
          </Field>
          <Field label="Moneda">
            <select
              value={form.moneda}
              onChange={(e) => setFormField(setForm, "moneda", e.target.value)}
              className="input-ui"
            >
              {MONEDAS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Vigente desde">
            <input
              required
              type="datetime-local"
              value={form.vigente_desde}
              onChange={(e) => setFormField(setForm, "vigente_desde", e.target.value)}
              className="input-ui"
            />
          </Field>
          <Field label="Vigente hasta (opcional)">
            <input
              type="datetime-local"
              value={form.vigente_hasta}
              onChange={(e) => setFormField(setForm, "vigente_hasta", e.target.value)}
              className="input-ui"
            />
          </Field>
        </div>

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0 block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
        {label}
      </span>
      {children}
    </label>
  )
}

function setFormField<T extends object>(
  setter: Dispatch<SetStateAction<T>>,
  key: keyof T,
  value: string
) {
  setter((current) => ({ ...current, [key]: value }))
}

function scopeLabel(t: Tarifa): string {
  if (t.scope === "instalacion") {
    return `Instalación: ${t.instalacionNombre ?? `#${t.instalacionId}`}`
  }
  if (t.scope === "ciudad") {
    return `Ciudad: ${t.ciudadNombre ?? `#${t.ciudadId}`}`
  }
  return "Tarifa global (fallback)"
}

function formatAxiosError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const resp = (error as { response?: { data?: unknown } }).response
    const data = resp?.data
    if (typeof data === "string") return data
    if (data && typeof data === "object") {
      // Aplanar el dict de errores DRF (e.g. {"valor_kwh": ["..."]})
      return Object.values(data)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .map((v) => String(v))
        .join(" ")
    }
  }
  if (error instanceof Error) return error.message
  return "No se pudo guardar la tarifa"
}
