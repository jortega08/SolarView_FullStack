/**
 * usePermissions — Hook centralizado de permisos por rol.
 *
 * Roles del sistema:
 *  - admin              → Superadmin global, ve y hace todo
 *  - adminPrestador     → Admin de empresa prestadora (es_admin_prestador=true)
 *  - empleadoPrestador  → Empleado de prestador sin admin
 *  - user               → Usuario estándar (admin_empresa / operador / viewer por instalación)
 */
import { useAuth } from "@/contexts/useAuth"

export function usePermissions() {
  const { user } = useAuth()

  const isAdmin           = user?.rol === "admin"
  const tienePrestador    = Boolean(user?.prestador_id)
  const isAdminPrestador  = tienePrestador && Boolean(user?.es_admin_prestador)
  const isEmpleadoPrestador = tienePrestador && !user?.es_admin_prestador
  const isUser            = user?.rol === "user" && !tienePrestador

  // ── Navegación ──────────────────────────────────────────────────────────
  const nav = {
    verInstalaciones:   true,
    verTelemetria:      true,
    verAlertas:         true,
    verOrdenes:         isAdmin || tienePrestador || !isUser,
    verMantenimiento:   isAdmin || tienePrestador || !isUser,
    verTecnicos:        isAdmin || tienePrestador,
    verAnalitica:       true,
    verReportes:        isAdmin || isAdminPrestador || isUser,
    verTarifas:         isAdmin || isAdminPrestador,
    verMiEmpresa:       tienePrestador,
    verEquipo:          tienePrestador,
    verConfiguracion:   isAdmin || isAdminPrestador,
  }

  // ── Instalaciones ────────────────────────────────────────────────────────
  const instalaciones = {
    crear:    isAdmin || isAdminPrestador,
    editar:   isAdmin || isAdminPrestador,
    eliminar: isAdmin,
  }

  // ── Órdenes de trabajo ───────────────────────────────────────────────────
  const ordenes = {
    crear:          isAdmin || tienePrestador,
    asignarTecnico: isAdmin || isAdminPrestador,
    cambiarEstado:  isAdmin || tienePrestador,
    cerrar:         isAdmin || isAdminPrestador,
    eliminar:       isAdmin,
  }

  // ── Mantenimiento ────────────────────────────────────────────────────────
  const mantenimiento = {
    crear:   isAdmin || tienePrestador,
    editar:  isAdmin || isAdminPrestador,
    eliminar: isAdmin,
  }

  // ── Técnicos ─────────────────────────────────────────────────────────────
  const tecnicos = {
    ver:     isAdmin || tienePrestador,
    crear:   isAdmin || isAdminPrestador,
    editar:  isAdmin || isAdminPrestador,
    eliminar: isAdmin,
  }

  // ── Alertas ──────────────────────────────────────────────────────────────
  const alertas = {
    resolver: isAdmin || tienePrestador,
    eliminar: isAdmin,
  }

  // ── Usuarios / Equipo ────────────────────────────────────────────────────
  const equipo = {
    invitar:         isAdmin || isAdminPrestador,
    revocarInvitacion: isAdmin || isAdminPrestador,
    desactivarUsuario: isAdmin,
  }

  // ── Tarifas ──────────────────────────────────────────────────────────────
  const tarifas = {
    ver:     isAdmin || isAdminPrestador,
    crear:   isAdmin || isAdminPrestador,
    editar:  isAdmin || isAdminPrestador,
    eliminar: isAdmin,
  }

  return {
    // flags de identidad
    isAdmin,
    isAdminPrestador,
    isEmpleadoPrestador,
    tienePrestador,
    isUser,
    // permisos por sección
    nav,
    instalaciones,
    ordenes,
    mantenimiento,
    tecnicos,
    alertas,
    equipo,
    tarifas,
  }
}
