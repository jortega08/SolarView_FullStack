
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard"
import Users from "./pages/Users"
import FacturaMensual from "./components/FacturaMensual"
import Alertas from "./pages/Alertas"

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/facturas" element={<FacturaMensual />} />
          <Route path="/alertas" element={<Alertas />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
