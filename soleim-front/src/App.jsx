import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ToastProvider } from "./context/ToastContext"
import ErrorBoundary from "./components/ErrorBoundary"
import PrivateRoute from "./components/PrivateRoute"
import Layout from "./components/Layout"

// ── Carga diferida por página ─────────────────────────────────────────────────
// Cada import() genera un chunk JS separado. El navegador solo lo descarga
// la primera vez que el usuario visita esa ruta.
const Dashboard         = lazy(() => import("./components/Dashboard"))
const InstalacionDetalle = lazy(() => import("./pages/InstalacionDetalle"))
const Alertas           = lazy(() => import("./pages/Alertas"))
const Reportes          = lazy(() => import("./pages/Reportes"))
const Configuracion     = lazy(() => import("./pages/Configuracion"))
const Users             = lazy(() => import("./pages/Users"))
const Domicilios        = lazy(() => import("./pages/Domicilios"))
const Perfil            = lazy(() => import("./pages/Perfil"))
const Login             = lazy(() => import("./pages/Login"))
const Register          = lazy(() => import("./pages/Register"))
const NotFound          = lazy(() => import("./pages/NotFound"))

// ── Fallback mientras carga el chunk ─────────────────────────────────────────
function PageSpinner() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", minHeight: 320,
    }}>
      <div style={{
        width: 28, height: 28,
        border: "3px solid var(--solein-border)",
        borderTopColor: "var(--solein-teal)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Suspense fallback={<PageSpinner />}>
                          <Routes>
                            <Route path="/"                element={<Dashboard />} />
                            <Route path="/instalacion/:id" element={<InstalacionDetalle />} />
                            <Route path="/alertas"         element={<Alertas />} />
                            <Route path="/reportes"        element={<Reportes />} />
                            <Route path="/configuracion"   element={<Configuracion />} />
                            <Route path="/users"           element={<Users />} />
                            <Route path="/domicilios"      element={<Domicilios />} />
                            <Route path="/perfil"          element={<Perfil />} />
                            <Route path="*"                element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </Layout>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
