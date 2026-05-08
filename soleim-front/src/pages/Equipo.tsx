import { useCallback, useEffect, useMemo, useState } from "react"
import { Clipboard, Copy, KeyRound, MailPlus, ShieldCheck, Trash2, UserMinus, Users } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/useAuth"
import { prestadorService } from "@/services/prestador.service"
import type { ApiInvitacionPrestador, ApiUsuarioEquipoPrestador } from "@/types/api"
import { useI18n } from "@/contexts/I18nContext"

type InviteForm = {
  email_destino: string
  rol: "operador" | "viewer" | "admin_empresa"
  vigente_hasta: string
}


function defaultExpiry() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const data = (error as { response?: { data?: { detail?: string; error?: string } } }).response?.data
    return data?.detail || data?.error || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export default function Equipo() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.es_admin_prestador)
  const currentUserId = user?.idusuario ?? user?.id
  const [equipo, setEquipo] = useState<ApiUsuarioEquipoPrestador[]>([])
  const [invitaciones, setInvitaciones] = useState<ApiInvitacionPrestador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)
  const [revoking, setRevoking] = useState<number | null>(null)
  const [lastCode, setLastCode] = useState<string | null>(null)
  const [form, setForm] = useState<InviteForm>({
    email_destino: "",
    rol: "operador",
    vigente_hasta: defaultExpiry(),
  })

  const empleados = useMemo(() => equipo.filter((item) => !item.es_admin_prestador), [equipo])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [teamData, inviteData] = await Promise.all([
        prestadorService.fetchEquipoPrestador(),
        isAdmin ? prestadorService.fetchInvitaciones() : Promise.resolve([]),
      ])
      setEquipo(teamData)
      setInvitaciones(inviteData)
      setError(null)
    } catch (err: unknown) {
      setEquipo([])
      setInvitaciones([])
      setError(getErrorMessage(err, "No pudimos cargar el equipo del prestador."))
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isAdmin) return
    setSubmitting(true)
    try {
      const created = await prestadorService.crearInvitacion({
        rol: form.rol,
        email_destino: form.email_destino.trim(),
        vigente_hasta: new Date(form.vigente_hasta).toISOString(),
      })
      setLastCode(created.codigo)
      setForm({ email_destino: "", rol: "operador", vigente_hasta: defaultExpiry() })
      await loadData()
      toast.success("Invitación generada")
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "No se pudo generar la invitación."))
    } finally {
      setSubmitting(false)
    }
  }

  const copyCode = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo)
      toast.success("Código copiado")
    } catch {
      toast.error("No se pudo copiar el código")
    }
  }

  const revokeInvite = async (invitacion: ApiInvitacionPrestador) => {
    const ok = window.confirm(`¿Revocar la invitación ${invitacion.codigo}?`)
    if (!ok) return
    setRevoking(invitacion.idinvitacion)
    try {
      await prestadorService.revocarInvitacion(invitacion.idinvitacion)
      await loadData()
      toast.success("Invitación revocada")
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "No se pudo revocar la invitación."))
    } finally {
      setRevoking(null)
    }
  }

  const removeAccess = async (empleado: ApiUsuarioEquipoPrestador) => {
    const ok = window.confirm(`¿Quitar el acceso de ${empleado.nombre}? Su cuenta no será eliminada.`)
    if (!ok) return
    setRemoving(empleado.idusuario)
    try {
      await prestadorService.quitarAccesoEmpleado(empleado.idusuario)
      setEquipo((prev) => prev.filter((item) => item.idusuario !== empleado.idusuario))
      toast.success("Acceso retirado")
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "No se pudo quitar el acceso."))
    } finally {
      setRemoving(null)
    }
  }

  const roleLabels: Record<string, string> = {
    admin_empresa: t("team.role.admin_company"),
    operador: t("team.role.operator"),
    viewer: t("team.role.viewer"),
  }

  if (loading) {
    return (
      <Shell title={t("team.title")} subtitle={t("team.subtitle")}>
        <Skeleton />
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell title={t("team.title")} subtitle={t("team.subtitle")}>
        <EmptyState icon={<Users className="w-8 h-8" />} title={t("team.empty.no_prestador")} text={error} />
      </Shell>
    )
  }

  return (
    <Shell title={t("team.title")} subtitle={t("team.subtitle.manage")}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <Panel
            title={t("team.panel.users")}
            subtitle={`${equipo.length} ${equipo.length === 1 ? t("team.col.user").toLowerCase() : t("team.col.user").toLowerCase() + "s"} en este prestador`}
            icon={<Users className="w-4 h-4" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-neutral-50)]">
                    {[t("team.col.user"), t("team.col.role"), t("team.col.status"), t("team.col.joined"), t("team.col.actions")].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipo.length === 0 ? (
                    <TableEmpty colSpan={5} title={t("team.empty.users")} text={t("team.empty.users.desc")} />
                  ) : (
                    equipo.map((miembro) => {
                      const isSelf = miembro.idusuario === currentUserId
                      return (
                        <tr key={miembro.idusuario} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--color-text-primary)]">{miembro.nombre}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{miembro.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge admin={miembro.es_admin_prestador} rol={miembro.rol} roleLabels={roleLabels} adminLabel={t("team.role.admin")} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {miembro.is_active ? t("team.status.active") : t("team.status.inactive")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                            {miembro.fecha_registro ? new Date(miembro.fecha_registro).toLocaleDateString("es-CO") : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin && !miembro.es_admin_prestador && !isSelf ? (
                              <button
                                className="btn-icon-danger"
                                title={t("team.action.remove")}
                                disabled={removing === miembro.idusuario}
                                onClick={() => removeAccess(miembro)}
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-[var(--color-text-muted)]">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {empleados.length === 0 && (
            <EmptyState
              icon={<ShieldCheck className="w-8 h-8" />}
              title={t("team.empty.employees")}
              text={isAdmin ? t("team.empty.employees.admin") : t("team.empty.employees.user")}
            />
          )}

          {isAdmin && (
            <Panel title={t("team.panel.invites")} subtitle={t("team.panel.invites.sub")} icon={<KeyRound className="w-4 h-4" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-neutral-50)]">
                      {[t("team.col.code"), t("team.col.destination"), t("team.col.role"), t("team.col.status"), t("team.col.expires"), t("team.col.actions")].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invitaciones.length === 0 ? (
                      <TableEmpty colSpan={6} title={t("team.empty.invites")} text={t("team.empty.invites.desc")} />
                    ) : (
                      invitaciones.map((invitacion) => (
                        <tr key={invitacion.idinvitacion} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-primary)]">{invitacion.codigo}</td>
                          <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{invitacion.email_destino || "-"}</td>
                          <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{roleLabels[invitacion.rol] ?? invitacion.rol}</td>
                          <td className="px-4 py-3"><InviteStatus invitacion={invitacion} /></td>
                          <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                            {new Date(invitacion.vigente_hasta).toLocaleDateString("es-CO")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button className="btn-icon" title={t("team.action.copy")} onClick={() => copyCode(invitacion.codigo)}>
                                <Copy className="w-4 h-4" />
                              </button>
                              {invitacion.vigente && !invitacion.usado_por && !invitacion.revocada && (
                                <button
                                  className="btn-icon-danger"
                                  title={t("team.action.revoke")}
                                  disabled={revoking === invitacion.idinvitacion}
                                  onClick={() => revokeInvite(invitacion)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </section>

        <aside className="space-y-5">
          {isAdmin ? (
            <form
              onSubmit={handleCreateInvite}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <MailPlus className="w-4 h-4 text-[var(--color-primary-600)]" />
                  {t("team.new_invite")}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t("team.new_invite.desc")}</p>
              </div>
              <div className="p-5 space-y-4">
                <Field label={t("team.invite.email")}>
                  <input
                    className="input-ui"
                    type="email"
                    value={form.email_destino}
                    onChange={(event) => setForm((prev) => ({ ...prev, email_destino: event.target.value }))}
                    placeholder="empleado@empresa.com"
                  />
                </Field>
                <Field label={t("team.invite.role")}>
                  <select
                    className="input-ui"
                    value={form.rol}
                    onChange={(event) => setForm((prev) => ({ ...prev, rol: event.target.value as InviteForm["rol"] }))}
                  >
                    <option value="operador">{t("team.role.operator")}</option>
                    <option value="viewer">{t("team.role.viewer")}</option>
                    <option value="admin_empresa">{t("team.role.admin_company")}</option>
                  </select>
                </Field>
                <Field label={t("team.invite.expires")}>
                  <input
                    className="input-ui"
                    type="datetime-local"
                    value={form.vigente_hasta}
                    onChange={(event) => setForm((prev) => ({ ...prev, vigente_hasta: event.target.value }))}
                    required
                  />
                </Field>
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  <KeyRound className="w-4 h-4" />
                  {submitting ? t("team.invite.btn.loading") : t("team.invite.btn")}
                </button>
              </div>
            </form>
          ) : (
            <EmptyState
              icon={<ShieldCheck className="w-8 h-8" />}
              title={t("team.read_only")}
              text={t("team.read_only.desc")}
            />
          )}

          {lastCode && (
            <div className="bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-800)]">
                <Clipboard className="w-4 h-4" />
                {t("team.code.title")}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-xs font-mono text-[var(--color-text-primary)] break-all">
                  {lastCode}
                </code>
                <button className="btn-icon" title={t("team.action.copy")} onClick={() => copyCode(lastCode)}>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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

function Panel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <span className="text-[var(--color-primary-600)]">{icon}</span>
          {title}
        </h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
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

function RoleBadge({ admin, rol, roleLabels, adminLabel }: { admin: boolean; rol: string; roleLabels: Record<string, string>; adminLabel: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-neutral-100)] px-2 py-1 text-xs font-medium text-[var(--color-text-primary)]">
      {admin ? adminLabel : roleLabels[rol] ?? rol}
    </span>
  )
}

function InviteStatus({ invitacion }: { invitacion: ApiInvitacionPrestador }) {
  const { t } = useI18n()
  const label = invitacion.usado_por ? t("team.invite.used") : invitacion.revocada ? t("team.invite.revoked") : invitacion.vigente ? t("team.invite.active") : t("team.invite.expired")
  const tone = invitacion.vigente && !invitacion.usado_por && !invitacion.revocada ? "text-[var(--color-energy-700)] bg-[var(--color-energy-50)]" : "text-[var(--color-text-secondary)] bg-[var(--color-neutral-100)]"
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone}`}>{label}</span>
}

function TableEmpty({ colSpan, title, text }: { colSpan: number; title: string; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{text}</p>
      </td>
    </tr>
  )
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 text-center">
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-56 rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]" />
        ))}
      </div>
      <div className="h-72 rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)]" />
    </div>
  )
}
