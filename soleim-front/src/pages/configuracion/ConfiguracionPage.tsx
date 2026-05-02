import { useState, useEffect } from "react"
import {
  User, Palette, Bell, Info, Globe,
  Sun, Moon, Save, Check, AlertTriangle,
  Battery, BatteryWarning, Server, CheckCircle2,
  XCircle, RefreshCw, Edit2,
} from "lucide-react"
import { useAuth } from "@/contexts/useAuth"
import { useI18n } from "@/contexts/I18nContext"
import type { Locale } from "@/lib/i18n"
import { apiClient } from "@/services/apiClient"
import { cn } from "@/lib/cn"

/* ─── Constantes ─────────────────────────────────────────────────────── */

const THEME_KEY     = "solein_theme"
const THRESHOLD_KEY = "soleim_alert_thresholds"

const ROL_LABELS: Record<string, string> = {
  admin:         "Super administrador",
  admin_empresa: "Administrador de empresa",
  operador:      "Operador",
  viewer:        "Visor",
  tecnico:       "Técnico",
}

const ROL_LABELS_EN: Record<string, string> = {
  admin:         "Super administrator",
  admin_empresa: "Company administrator",
  operador:      "Operator",
  viewer:        "Viewer",
  tecnico:       "Technician",
}

const LANGUAGES = [
  { code: "es" as Locale, label: "Español", flag: "🇪🇸" },
  { code: "en" as Locale, label: "English", flag: "🇺🇸" },
]

function loadThresholds() {
  try {
    const raw = localStorage.getItem(THRESHOLD_KEY)
    return raw ? JSON.parse(raw) : { bateria_critica: 15, bateria_advertencia: 30 }
  } catch {
    return { bateria_critica: 15, bateria_advertencia: 30 }
  }
}

/* ─── Componentes base ───────────────────────────────────────────────── */

function SectionCard({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-50)]">
          <Icon className="h-4 w-4 text-[var(--color-primary-600)]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--color-text-secondary)]">{subtitle}</p>}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[160px_1fr] sm:items-start gap-1 sm:gap-4">
      <span className="text-sm font-medium text-[var(--color-text-secondary)] pt-0 sm:pt-2">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function ReadOnlyValue({ value, badge }: { value: string; badge?: boolean }) {
  if (badge) {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-1 text-sm font-medium text-[var(--color-text-primary)]">
        {value}
      </span>
    )
  }
  return (
    <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-2 text-sm text-[var(--color-text-primary)]">
      {value}
    </p>
  )
}

function SaveButton({ loading, saved, onClick, label = "Guardar cambios" }: {
  loading: boolean; saved: boolean; onClick?: () => void; label?: string
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={loading || saved}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-all",
        saved
          ? "bg-green-500 text-white"
          : "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] disabled:opacity-60"
      )}
    >
      {saved ? <><Check className="h-3.5 w-3.5" />{label}</>
        : loading ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />…</>
        : <><Save className="h-3.5 w-3.5" />{label}</>}
    </button>
  )
}

/* ─── Sección: Mi perfil ─────────────────────────────────────────────── */

function SeccionPerfil({ user }: {
  user: { idusuario?: number; nombre: string; email: string; rol: string; fecha_registro?: string }
}) {
  const { t, locale } = useI18n()
  const { updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(user.nombre)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const initials = nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  const fechaFormateada = user.fecha_registro
    ? new Date(user.fecha_registro).toLocaleDateString(locale === "en" ? "en-US" : "es-CO", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—"
  const rolLabel = locale === "en"
    ? (ROL_LABELS_EN[user.rol] ?? user.rol)
    : (ROL_LABELS[user.rol] ?? user.rol)

  const handleSaveName = async () => {
    const trimmed = nombre.trim()
    if (!trimmed || trimmed === user.nombre) { setEditing(false); return }
    setSaving(true)
    setSaveError(null)
    try {
      await updateUser({ nombre: trimmed })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaveError("No se pudo actualizar el nombre.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard icon={User} title={t("cfg.profile")} subtitle={t("cfg.profile.sub")}>
      <div className="space-y-4">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-4 pb-3 border-b border-[var(--color-border)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-xl font-bold text-white select-none flex-shrink-0">
            {initials || "?"}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setEditing(false); setNombre(user.nombre) } }}
                  className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-primary-400)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary-300)]"
                />
                <button type="button" onClick={handleSaveName} disabled={saving}
                  className="rounded-[var(--radius-md)] bg-[var(--color-primary-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50">
                  {saving ? "…" : <Check className="h-3.5 w-3.5" />}
                </button>
                <button type="button" onClick={() => { setEditing(false); setNombre(user.nombre) }}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)]">
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-[var(--color-text-primary)] truncate">{nombre}</p>
                <button type="button" onClick={() => setEditing(true)}
                  title="Editar nombre"
                  className="p-1 rounded hover:bg-[var(--color-neutral-100)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {saved && <span className="text-xs text-green-600 font-medium">✓ Guardado</span>}
              </div>
            )}
            {saveError && <p className="mt-1 text-xs text-[var(--color-danger-600)]">{saveError}</p>}
            <span className="mt-0.5 inline-flex items-center rounded-full bg-[var(--color-primary-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-700)]">
              {rolLabel}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <FieldRow label={t("cfg.field.email")}><ReadOnlyValue value={user.email} /></FieldRow>
          <FieldRow label={t("cfg.field.role")}><ReadOnlyValue value={rolLabel} badge /></FieldRow>
          <FieldRow label={t("cfg.field.since")}><ReadOnlyValue value={fechaFormateada} /></FieldRow>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
          <Info className="h-3 w-3 flex-shrink-0" />
          {t("cfg.field.contact")}
        </p>
      </div>
    </SectionCard>
  )
}

/* ─── Sección: Apariencia ────────────────────────────────────────────── */

function SeccionApariencia() {
  const { t } = useI18n()
  const [dark, setDark] = useState(() => (localStorage.getItem(THEME_KEY) ?? "light") === "dark")

  // Aplicar al DOM y notificar (evento con string "dark"|"light" — compatible con Header)
  const applyTheme = (isDark: boolean) => {
    const theme = isDark ? "dark" : "light"
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.setAttribute("data-theme", theme)
    window.dispatchEvent(new CustomEvent("solein:theme-change", { detail: theme }))
    setDark(isDark)
  }

  // Sincronizar si el Header cambia el tema
  useEffect(() => {
    const handler = (e: Event) => {
      const theme = (e as CustomEvent<string>).detail
      setDark(theme === "dark")
    }
    window.addEventListener("solein:theme-change", handler)
    return () => window.removeEventListener("solein:theme-change", handler)
  }, [])

  return (
    <SectionCard icon={Palette} title={t("cfg.appearance")} subtitle={t("cfg.appearance.sub")}>
      <div className="space-y-4">
        <FieldRow label={t("cfg.theme.label")}>
          <div className="flex gap-3">
            {[
              { value: false, labelKey: "cfg.theme.light", icon: Sun,  preview: "bg-white border-gray-200", iconColor: "text-yellow-500" },
              { value: true,  labelKey: "cfg.theme.dark",  icon: Moon, preview: "bg-gray-900",              iconColor: "text-blue-400"   },
            ].map(({ value, labelKey, icon: Icon, preview, iconColor }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => applyTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-3 transition-all w-28",
                  dark === value
                    ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-neutral-300)]"
                )}
              >
                <div className={cn("flex h-12 w-20 items-center justify-center rounded border shadow-sm", preview)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <span className={cn("text-xs font-medium",
                  dark === value ? "text-[var(--color-primary-700)]" : "text-[var(--color-text-secondary)]")}>
                  {t(labelKey)}
                </span>
                {dark === value && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-600)]" />}
              </button>
            ))}
          </div>
        </FieldRow>
      </div>
    </SectionCard>
  )
}

/* ─── Sección: Idioma ────────────────────────────────────────────────── */

function SeccionIdioma() {
  const { t, locale, setLocale } = useI18n()
  const [pending, setPending] = useState<Locale>(locale)
  const [saved, setSaved] = useState(false)

  // Si el idioma cambia desde fuera, sincronizar pending
  useEffect(() => { setPending(locale) }, [locale])

  const handleSave = () => {
    setLocale(pending)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <SectionCard icon={Globe} title={t("cfg.language")} subtitle={t("cfg.language.sub")}>
      <div className="space-y-4">
        <FieldRow label={t("cfg.language")}>
          <div className="flex gap-3">
            {LANGUAGES.map(({ code, label, flag }) => (
              <button
                key={code}
                type="button"
                onClick={() => setPending(code)}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-md)] border-2 px-4 py-2.5 text-sm font-medium transition-all",
                  pending === code
                    ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-neutral-300)]"
                )}
              >
                <span className="text-lg">{flag}</span>
                {label}
                {pending === code && <Check className="h-3.5 w-3.5 ml-1" />}
              </button>
            ))}
          </div>
        </FieldRow>
        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          {t("cfg.lang.note")}
        </p>
        <div className="flex justify-end">
          <SaveButton loading={false} saved={saved} onClick={handleSave} label={t("cfg.lang.save")} />
        </div>
      </div>
    </SectionCard>
  )
}

/* ─── Sección: Notificaciones ────────────────────────────────────────── */

function SeccionNotificaciones() {
  const { t } = useI18n()
  const [thresholds, setThresholds] = useState(loadThresholds)
  const [saved, setSaved] = useState(false)

  const critica     = thresholds.bateria_critica
  const advertencia = thresholds.bateria_advertencia

  const handleSave = () => {
    localStorage.setItem(THRESHOLD_KEY, JSON.stringify(thresholds))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <SectionCard icon={Bell} title={t("cfg.alerts")} subtitle={t("cfg.alerts.sub")}>
      <div className="space-y-5">
        {/* Barra visual de zonas */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t("cfg.threshold.preview")}
          </p>
          <div className="relative h-7 rounded-full overflow-hidden bg-[var(--color-neutral-100)] border border-[var(--color-border)]">
            <div className="absolute inset-y-0 left-0 bg-red-400/80 flex items-center justify-center"
              style={{ width: `${critica}%` }}>
              {critica > 8 && <span className="text-[10px] font-bold text-white">Crítico</span>}
            </div>
            <div className="absolute inset-y-0 bg-yellow-400/80 flex items-center justify-center"
              style={{ left: `${critica}%`, width: `${advertencia - critica}%` }}>
              {(advertencia - critica) > 12 && <span className="text-[10px] font-bold text-white">Advertencia</span>}
            </div>
            <div className="absolute inset-y-0 bg-green-400/80 flex items-center justify-center"
              style={{ left: `${advertencia}%`, right: 0 }}>
              {(100 - advertencia) > 12 && <span className="text-[10px] font-bold text-white">Seguro</span>}
            </div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[var(--color-text-muted)]">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <Battery className="h-3.5 w-3.5" />{t("cfg.threshold.critical")}
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={5} max={25} value={critica}
                onChange={e => {
                  const v = Number(e.target.value)
                  setThresholds(prev => ({ ...prev, bateria_critica: Math.min(v, prev.bateria_advertencia - 5) }))
                }}
                className="flex-1 accent-red-500 h-1.5"
              />
              <span className="w-12 text-center text-sm font-bold tabular text-red-600 bg-red-50 rounded py-0.5">{critica}%</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{t("cfg.threshold.critical.sub")}</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600">
              <BatteryWarning className="h-3.5 w-3.5" />{t("cfg.threshold.warning")}
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={20} max={60} value={advertencia}
                onChange={e => {
                  const v = Number(e.target.value)
                  setThresholds(prev => ({ ...prev, bateria_advertencia: Math.max(v, prev.bateria_critica + 5) }))
                }}
                className="flex-1 accent-yellow-500 h-1.5"
              />
              <span className="w-12 text-center text-sm font-bold tabular text-yellow-600 bg-yellow-50 rounded py-0.5">{advertencia}%</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{t("cfg.threshold.warning.sub")}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <SaveButton loading={false} saved={saved} onClick={handleSave} label={t("common.save")} />
        </div>
      </div>
    </SectionCard>
  )
}

/* ─── Sección: Sistema ───────────────────────────────────────────────── */

type HealthData = { status?: string; db?: string; redis?: string; version?: string }

function SeccionSistema() {
  const { t } = useI18n()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = () => {
    setLoading(true)
    apiClient.get<HealthData>("/health/")
      .then(r => setHealth(r.data))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHealth() }, [])

  const ServiceRow = ({ label, ok }: { label: string; ok: boolean | null }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      {ok === null ? (
        <span className="text-xs text-[var(--color-text-muted)]">—</span>
      ) : ok ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />{t("cfg.sys.ok")}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
          <XCircle className="h-3.5 w-3.5" />{t("cfg.sys.error")}
        </span>
      )}
    </div>
  )

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  )

  return (
    <SectionCard icon={Info} title={t("cfg.system")} subtitle={t("cfg.system.sub")}>
      <div className="space-y-5">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-4">
          <InfoRow label={t("cfg.sys.platform")}  value="SOLEIM B2B" />
          <InfoRow label={t("cfg.sys.version")}   value="2.1.0" />
          <InfoRow label={t("cfg.sys.env")}        value={t("cfg.sys.production")} />
          <InfoRow label={t("cfg.sys.api")}        value={import.meta.env.VITE_API_URL ?? "/api"} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {t("cfg.sys.services")}
            </p>
            <button type="button" onClick={fetchHealth} disabled={loading}
              className="flex items-center gap-1 text-xs text-[var(--color-primary-600)] hover:underline disabled:opacity-50">
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              {t("cfg.sys.check")}
            </button>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] px-4">
            <ServiceRow label={t("cfg.sys.django")}   ok={loading ? null : health?.status === "ok"} />
            <ServiceRow label={t("cfg.sys.postgres")} ok={loading ? null : health?.db === "ok"} />
            <ServiceRow label={t("cfg.sys.redis")}    ok={loading ? null : health?.redis === "ok"} />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

/* ─── Navegación lateral ─────────────────────────────────────────────── */

const SECTION_KEYS = [
  { id: "perfil",     labelKey: "cfg.profile",    icon: User    },
  { id: "apariencia", labelKey: "cfg.appearance",  icon: Palette },
  { id: "idioma",     labelKey: "cfg.language",    icon: Globe   },
  { id: "alertas",    labelKey: "cfg.alerts",      icon: Bell    },
  { id: "sistema",    labelKey: "cfg.system",      icon: Server  },
]

/* ─── Página ─────────────────────────────────────────────────────────── */

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [active, setActive] = useState("perfil")

  const scrollTo = (id: string) => {
    setActive(id)
    document.getElementById(`cfg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (!user) return null

  return (
    <div className="flex gap-6 items-start">
      {/* Nav lateral pegajosa */}
      <aside className="hidden lg:flex w-44 flex-shrink-0 flex-col gap-0.5 sticky top-6">
        <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          {t("cfg.sections")}
        </p>
        {SECTION_KEYS.map(({ id, labelKey, icon: Icon }) => (
          <button key={id} type="button" onClick={() => scrollTo(id)}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-left transition-colors",
              active === id
                ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />{t(labelKey)}
          </button>
        ))}
      </aside>

      {/* Contenido */}
      <div className="flex-1 space-y-6 min-w-0">
        <div id="cfg-perfil"><SeccionPerfil user={user} /></div>
        <div id="cfg-apariencia"><SeccionApariencia /></div>
        <div id="cfg-idioma"><SeccionIdioma /></div>
        <div id="cfg-alertas"><SeccionNotificaciones /></div>
        <div id="cfg-sistema"><SeccionSistema /></div>
      </div>
    </div>
  )
}
