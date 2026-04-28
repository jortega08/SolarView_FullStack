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
      { path: "alertas", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Alertas" area="Centro de operaciones" /></Suspense> },
      { path: "ordenes", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Órdenes" area="Centro de operaciones" /></Suspense> },
      { path: "mantenimiento", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Mantenimiento" area="Operación técnica" /></Suspense> },
      { path: "tecnicos", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Técnicos" area="Operación técnica" /></Suspense> },
      { path: "analitica", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Analítica" area="Inteligencia operativa" /></Suspense> },
      { path: "reportes", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Reportes" area="Inteligencia operativa" /></Suspense> },
      { path: "notificaciones", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Notificaciones" area="Comunicación" /></Suspense> },
      { path: "configuracion", element: <Suspense fallback={<PageLoader />}><PlaceholderPage title="Configuración" area="Sistema" /></Suspense> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
