import { createBrowserRouter, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { AppLayout } from "./AppLayout"
import { ProtectedRoute } from "./ProtectedRoute"
import { PageLoader } from "./PageLoader"

// ── Imports lazy ────────────────────────────────────────────────────────────
const LoginPage             = lazy(() => import("@/pages/auth/LoginPage"))
const RegisterPage          = lazy(() => import("@/pages/auth/RegisterPage"))
const CentroControlPage     = lazy(() => import("@/pages/resumen/CentroControlPage"))
const InstalacionesListPage = lazy(() => import("@/pages/instalaciones/InstalacionesListPage"))
const InstalacionDetallePage= lazy(() => import("@/pages/instalaciones/InstalacionDetallePage"))
const AlertasPage           = lazy(() => import("@/pages/operaciones/AlertasPage"))
const OrdenesPage           = lazy(() => import("@/pages/operaciones/OrdenesPage"))
const CentroOperacionesPage = lazy(() => import("@/pages/operaciones/CentroOperacionesPage"))
const MantenimientoPage     = lazy(() => import("@/pages/mantenimiento/MantenimientoPage"))
const TecnicosPage          = lazy(() => import("@/pages/tecnicos/TecnicosPage"))
const PerfilProfesionalPage = lazy(() => import("@/pages/tecnicos/PerfilProfesionalPage"))
const AnaliticaPage         = lazy(() => import("@/pages/analitica/AnaliticaPage"))
const ReportesPage          = lazy(() => import("@/pages/reportes/ReportesPage"))
const NotificacionesPage    = lazy(() => import("@/pages/comunicacion/NotificacionesPage"))
const ConfiguracionPage     = lazy(() => import("@/pages/configuracion/ConfiguracionPage"))
const TarifasPage           = lazy(() => import("@/pages/tarifas/TarifasPage"))
const MiEmpresaPage         = lazy(() => import("@/pages/MiEmpresa.tsx"))
const EquipoPage            = lazy(() => import("@/pages/Equipo.tsx"))
const PlaceholderPage       = lazy(() => import("@/pages/PlaceholderPage"))
const TelemetriaPage        = lazy(() => import("@/pages/telemetria/TelemetriaPage"))

/**
 * Funciones de preload exportadas para que el Sidebar las llame en onMouseEnter.
 * Llamar la función dispara el import() dinámico y el browser empieza a descargar
 * el chunk JS antes de que el usuario haga clic — normalmente gana 200-500 ms.
 */
export const preloadRoutes: Record<string, () => void> = {
  "/"                  : () => import("@/pages/resumen/CentroControlPage"),
  "/instalaciones"     : () => import("@/pages/instalaciones/InstalacionesListPage"),
  "/telemetria"        : () => import("@/pages/telemetria/TelemetriaPage"),
  "/alertas"           : () => import("@/pages/operaciones/AlertasPage"),
  "/ordenes"           : () => import("@/pages/operaciones/OrdenesPage"),
  "/operaciones"       : () => import("@/pages/operaciones/CentroOperacionesPage"),
  "/mantenimiento"     : () => import("@/pages/mantenimiento/MantenimientoPage"),
  "/tecnicos"          : () => import("@/pages/tecnicos/TecnicosPage"),
  "/perfil-profesional": () => import("@/pages/tecnicos/PerfilProfesionalPage"),
  "/analitica"         : () => import("@/pages/analitica/AnaliticaPage"),
  "/reportes"          : () => import("@/pages/reportes/ReportesPage"),
  "/notificaciones"    : () => import("@/pages/comunicacion/NotificacionesPage"),
  "/tarifas"           : () => import("@/pages/tarifas/TarifasPage"),
  "/mi-empresa"        : () => import("@/pages/MiEmpresa.tsx"),
  "/equipo"            : () => import("@/pages/Equipo.tsx"),
  "/configuracion"     : () => import("@/pages/configuracion/ConfiguracionPage"),
}

// ── Helper ───────────────────────────────────────────────────────────────────
function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// ── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: "/login",
    element: <S><LoginPage /></S>,
  },
  {
    path: "/register",
    element: <S><RegisterPage /></S>,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                   element: <S><CentroControlPage /></S> },
      {
        path: "instalaciones",
        children: [
          { index: true,               element: <S><InstalacionesListPage /></S> },
          { path: ":id",               element: <S><InstalacionDetallePage /></S> },
        ],
      },
      { path: "telemetria",            element: <S><TelemetriaPage /></S> },
      { path: "alertas",               element: <S><AlertasPage /></S> },
      { path: "ordenes",               element: <S><OrdenesPage /></S> },
      { path: "operaciones",           element: <S><CentroOperacionesPage /></S> },
      { path: "mantenimiento",         element: <S><MantenimientoPage /></S> },
      { path: "tecnicos",              element: <S><TecnicosPage /></S> },
      { path: "perfil-profesional",    element: <S><PerfilProfesionalPage /></S> },
      { path: "analitica",             element: <S><AnaliticaPage /></S> },
      { path: "reportes",              element: <S><ReportesPage /></S> },
      { path: "notificaciones",        element: <S><NotificacionesPage /></S> },
      { path: "tarifas",               element: <S><TarifasPage /></S> },
      { path: "mi-empresa",            element: <S><MiEmpresaPage /></S> },
      { path: "equipo",                element: <S><EquipoPage /></S> },
      { path: "configuracion",         element: <S><ConfiguracionPage /></S> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
