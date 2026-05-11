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
import { useI18n } from "@/contexts/I18nContext"

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
  const { t } = useI18n()
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
      header: t("tariff.col.name"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
            {row.nombre}
          </p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">
            {scopeLabel(row, t)}
          </p>
        </div>
      ),
    },
    {
      id: "valor",
      header: t("tariff.col.value"),
      cell: (row) => (
        <span className="tabular text-xs font-semibold text-[var(--color-text-primary)]">
          {row.valorKwh.toLocaleString("es-CO", { maximumFractionDigits: 2 })} {row.moneda}
        </span>
      ),
    },
    {
      id: "vigencia",
      header: t("tariff.col.validity"),
      cell: (row) => (
        <span className="tabular text-xs text-[var(--color-text-secondary)]">
          {formatDate(row.vigenteDesde)}
          {row.vigenteHasta ? ` → ${formatDate(row.vigenteHasta)}` : ` → ${t("tariff.validity.indef")}`}
        </span>
      ),
    },
    {
      id: "acciones",
      header: t("tariff.col.actions"),
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditing(row)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
            title={t("tariff.action.edit")}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`${t("tariff.action.delete")} "${row.nombre}"?`)) {
                void eliminar.mutateAsync(row.id)
              }
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
            title={t("tariff.action.delete")}
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
        eyebrow={t("tariff.eyebrow")}
        title={t("tariff.title")}
        description={t("tariff.desc")}
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
          >
            <Plus className="h-4 w-4" />
            {t("tariff.btn.new")}
          </button>
        }
      />

      <div className="flex h-10 items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 shadow-[var(--shadow-card)]">
        <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("tariff.search.ph")}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      {localError && <ErrorState message={localError} onRetry={() => setLocalError(null)} />}

      {isError ? (
        <ErrorState message={t("tariff.error.load")} onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          loading={isLoading}
          getRowKey={(row) => row.id}
          emptyTitle={t("tariff.empty.title")}
          emptyDescription={t("tariff.empty.desc")}
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
  const { t } = useI18n()
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
      title={tarifa ? t("tariff.form.edit") : t("tariff.form.new")}
      description={t("tariff.form.desc")}
      className="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("tariff.form.name")}>
          <input
            required
            value={form.nombre}
            onChange={(e) => setFormField(setForm, "nombre", e.target.value)}
            placeholder="p.ej. Bogotá residencial 2026 Q1"
            className="input-ui"
            maxLength={120}
          />
        </Field>

        <Field label={t("tariff.form.scope")}>
          <select
            value={form.scope}
            onChange={(e) => setFormField(setForm, "scope", e.target.value)}
            className="input-ui"
          >
            <option value="ciudad">{t("tariff.form.scope.city")}</option>
            <option value="instalacion">{t("tariff.form.scope.inst")}</option>
            <option value="global">{t("tariff.form.scope.global")}</option>
          </select>
        </Field>

        {form.scope === "ciudad" && (
          <Field label={t("tariff.form.city")}>
            <select
              required
              value={form.ciudad}
              onChange={(e) => setFormField(setForm, "ciudad", e.target.value)}
              className="input-ui"
            >
              <option value="">{t("tariff.form.city.select")}</option>
              {ciudades.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Field>
        )}

        {form.scope === "instalacion" && (
          <Field label={t("tariff.form.inst")}>
            <select
              required
              value={form.instalacion}
              onChange={(e) => setFormField(setForm, "instalacion", e.target.value)}
              className="input-ui"
            >
              <option value="">{t("tariff.form.inst.select")}</option>
              {instalaciones.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("tariff.form.value")}>
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
          <Field label={t("tariff.form.currency")}>
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
          <Field label={t("tariff.form.from")}>
            <input
              required
              type="datetime-local"
              value={form.vigente_desde}
              onChange={(e) => setFormField(setForm, "vigente_desde", e.target.value)}
              className="input-ui"
            />
          </Field>
          <Field label={t("tariff.form.to")}>
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
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {t("common.save")}
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

function scopeLabel(row: Tarifa, t: (key: string) => string): string {
  if (row.scope === "instalacion") {
    return `${t("tariff.scope.inst.label")}: ${row.instalacionNombre ?? `#${row.instalacionId}`}`
  }
  if (row.scope === "ciudad") {
    return `${t("tariff.scope.city.label")}: ${row.ciudadNombre ?? `#${row.ciudadId}`}`
  }
  return t("tariff.scope.global.label")
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
