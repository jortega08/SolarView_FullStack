import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ToastProvider } from "./context/ToastContext"
import ErrorBoundary from "./components/ErrorBoundary"
import PrivateRoute from "./components/PrivateRoute"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard"
import InstalacionDetalle from "./pages/InstalacionDetalle"
import Configuracion from "./pages/Configuracion"
import Reportes from "./pages/Reportes"
import Users from "./pages/Users"
import Alertas from "./pages/Alertas"
import Perfil from "./pages/Perfil"
import Domicilios from "./pages/Domicilios"
import Login from "./pages/Login"
import Register from "./pages/Register"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/"                  element={<Dashboard />} />
                      <Route path="/instalacion/:id"   element={<InstalacionDetalle />} />
                      <Route path="/alertas"           element={<Alertas />} />
                      <Route path="/reportes"          element={<Reportes />} />
                      <Route path="/configuracion"     element={<Configuracion />} />
                      <Route path="/users"             element={<Users />} />
                      <Route path="/domicilios"        element={<Domicilios />} />
                      <Route path="/perfil"            element={<Perfil />} />
                      <Route path="*"                  element={<NotFound />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
