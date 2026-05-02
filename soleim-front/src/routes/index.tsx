import { createBrowserRouter, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { AppLayout } from "./AppLayout"
import { ProtectedRoute } from "./ProtectedRoute"
import { PageLoader } from "./PageLoader"

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"))
const CentroControlPage = lazy(() => import("@/pages/resumen/CentroControlPage"))
const InstalacionesListPage = lazy(() => import("@/pages/instalaciones/InstalacionesListPage"))
const InstalacionDetallePage = lazy(() => import("@/pages/instalaciones/InstalacionDetallePage"))
const AlertasPage = lazy(() => import("@/pages/operaciones/AlertasPage"))
const OrdenesPage = lazy(() => import("@/pages/operaciones/OrdenesPage"))
const CentroOperacionesPage = lazy(() => import("@/pages/operaciones/CentroOperacionesPage"))
const MantenimientoPage = lazy(() => import("@/pages/mantenimiento/MantenimientoPage"))
const TecnicosPage = lazy(() => import("@/pages/tecnicos/TecnicosPage"))
const PerfilProfesionalPage = lazy(() => import("@/pages/tecnicos/PerfilProfesionalPage"))
const AnaliticaPage = lazy(() => import("@/pages/analitica/AnaliticaPage"))
const ReportesPage = lazy(() => import("@/pages/reportes/ReportesPage"))
const NotificacionesPage = lazy(() => import("@/pages/comunicacion/NotificacionesPage"))
const ConfiguracionPage = lazy(() => import("@/pages/configuracion/ConfiguracionPage"))
const PlaceholderPage = lazy(() => import("@/pages/PlaceholderPage"))

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>,
  },
  {
    path: "/register",
    element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><CentroControlPage /></Suspense> },
      {
        path: "instalaciones",
        children: [
          { index: true, element: <Suspense fallback={<PageLoader />}><InstalacionesListPage /></Suspense> },
          { path: ":id", element: <Suspense fallback={<PageLoader />}><InstalacionDetallePage /></Suspense> },
        ],
      },
      { path: "telemetria", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Telemetría" area="Observabilidad operativa" /></Suspense> },
      { path: "alertas", element: <Suspense fallback={<PageLoader />}><AlertasPage /></Suspense> },
      { path: "ordenes", element: <Suspense fallback={<PageLoader />}><OrdenesPage /></Suspense> },
      { path: "operaciones", element: <Suspense fallback={<PageLoader />}><CentroOperacionesPage /></Suspense> },
      { path: "mantenimiento", element: <Suspense fallback={<PageLoader />}><MantenimientoPage /></Suspense> },
      { path: "tecnicos", element: <Suspense fallback={<PageLoader />}><TecnicosPage /></Suspense> },
      { path: "perfil-profesional", element: <Suspense fallback={<PageLoader />}><PerfilProfesionalPage /></Suspense> },
      { path: "analitica", element: <Suspense fallback={<PageLoader />}><AnaliticaPage /></Suspense> },
      { path: "reportes", element: <Suspense fallback={<PageLoader />}><ReportesPage /></Suspense> },
      { path: "notificaciones", element: <Suspense fallback={<PageLoader />}><NotificacionesPage /></Suspense> },
      { path: "configuracion", element: <Suspense fallback={<PageLoader />}><ConfiguracionPage /></Suspense> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
