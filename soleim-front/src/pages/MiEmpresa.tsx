import { useEffect, useMemo, useState } from "react"
import { Building2, CheckCircle2, Save, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/useAuth"
import { apiClient } from "@/services/apiClient"
import { prestadorService } from "@/services/prestador.service"
import type { ApiCiudad, ApiPrestadorServicio } from "@/types/api"
import { useI18n } from "@/contexts/I18nContext"

type FormState = {
  nombre: string
  nit: string
  ciudad: string
}

const emptyForm: FormState = { nombre: "", nit: "", ciudad: "" }

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const data = (error as { response?: { data?: { detail?: string; error?: string } } }).response?.data
    return data?.detail || data?.error || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export default function MiEmpresa() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.es_admin_prestador)
  const [prestador, setPrestador] = useState<ApiPrestadorServicio | null>(null)
  const [ciudades, setCiudades] = useState<ApiCiudad[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      prestadorService.fetchMiPrestador(),
      apiClient.get<ApiCiudad[]>("/core/ciudades/").then((r) => r.data).catch(() => []),
    ])
      .then(([prestadorData, ciudadesData]) => {
        if (!alive) return
        setPrestador(prestadorData)
        setCiudades(Array.isArray(ciudadesData) ? ciudadesData : [])
        setForm({
          nombre: prestadorData.nombre ?? "",
          nit: prestadorData.nit ?? "",
          ciudad: prestadorData.ciudad ? String(prestadorData.ciudad) : "",
        })
        setError(null)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setPrestador(null)
        setError(getErrorMessage(err, "No pudimos cargar la información del prestador."))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const ciudadActual = useMemo(() => {
    if (!prestador) return t("company.no_city")
    return prestador.ciudad_nombre || ciudades.find((c) => c.idciudad === prestador.ciudad)?.nombre || t("company.no_city")
  }, [ciudades, prestador, t])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAdmin) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await prestadorService.updateMiPrestador({
        nombre: form.nombre.trim(),
        nit: form.nit.trim() || null,
        ciudad: form.ciudad ? Number(form.ciudad) : null,
      })
      setPrestador(updated)
      setForm({
        nombre: updated.nombre ?? "",
        nit: updated.nit ?? "",
        ciudad: updated.ciudad ? String(updated.ciudad) : "",
      })
      setSaved(true)
      setError(null)
      toast.success("Empresa actualizada")
    } catch (err: unknown) {
      const message = getErrorMessage(err, "No se pudo guardar la empresa.")
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Shell title={t("company.title")} subtitle={t("company.subtitle.loading")}><Skeleton /></Shell>
  }

  if (error && !prestador) {
    return (
      <Shell title={t("company.title")} subtitle={t("company.subtitle")}>
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8" />}
          title={t("company.info.no_prestador")}
          text={error}
        />
      </Shell>
    )
  }

  return (
    <Shell title={t("company.title")} subtitle={t("company.subtitle.ops")}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{t("company.form.title")}</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {isAdmin ? t("company.form.admin.desc") : t("company.form.readonly.desc")}
              </p>
            </div>
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-energy-700)]">
                <CheckCircle2 className="w-4 h-4" />
                {t("company.saved")}
              </span>
            )}
          </div>

          <div className="p-5 grid gap-4 md:grid-cols-2">
            <Field label={t("company.form.name")}>
              <input
                className="input-ui"
                value={form.nombre}
                disabled={!isAdmin || saving}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                required
              />
            </Field>
            <Field label={t("company.form.nit")}>
              <input
                className="input-ui"
                value={form.nit}
                disabled={!isAdmin || saving}
                onChange={(event) => setForm((prev) => ({ ...prev, nit: event.target.value }))}
                placeholder={t("company.form.no_nit")}
              />
            </Field>
            <Field label={t("company.form.city")}>
              <select
                className="input-ui"
                value={form.ciudad}
                disabled={!isAdmin || saving}
                onChange={(event) => setForm((prev) => ({ ...prev, ciudad: event.target.value }))}
              >
                <option value="">{t("company.form.no_city")}</option>
                {ciudades.map((ciudad) => (
                  <option key={ciudad.idciudad} value={ciudad.idciudad}>
                    {ciudad.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("company.form.status")}>
              <input className="input-ui" value={prestador?.activo ? t("company.status.active") : t("company.status.inactive")} disabled />
            </Field>
          </div>

          {error && (
            <div className="mx-5 mb-5 rounded-[var(--radius-md)] border border-[var(--color-danger-100)] bg-[var(--color-danger-50)] px-3 py-2 text-xs text-[var(--color-danger-700)]">
              {error}
            </div>
          )}

          {isAdmin && (
            <div className="px-5 py-4 border-t border-[var(--color-border)] flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? t("company.btn.saving") : t("company.btn.save")}
              </button>
            </div>
          )}
        </form>

        <aside className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 h-fit">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] flex items-center justify-center mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{prestador?.nombre}</h3>
          <dl className="mt-4 space-y-3 text-xs">
            <Info label={t("company.info.id")} value={prestador ? `#${prestador.idprestador}` : "-"} />
            <Info label={t("company.info.city")} value={ciudadActual} />
            <Info
              label={t("company.info.registered")}
              value={
                prestador?.fecha_registro
                  ? new Date(prestador.fecha_registro).toLocaleDateString("es-CO")
                  : "-"
              }
            />
            <Info label={t("company.info.permission")} value={isAdmin ? t("company.info.admin") : t("company.info.readonly")} />
          </dl>
        </aside>
      </div>
    </Shell>
  )
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">{label}</span>
      {children}
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="font-medium text-[var(--color-text-primary)] mt-0.5 break-words">{value}</dd>
    </div>
  )
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)] flex items-center justify-center">
        {icon}
      </div>
      <h2 className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text}</p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
      <div className="h-4 w-48 rounded bg-[var(--color-neutral-100)]" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]" />
        ))}
      </div>
    </div>
  )
}
