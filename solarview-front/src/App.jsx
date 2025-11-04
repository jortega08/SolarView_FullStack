
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard"
import Users from "./pages/Users"
import Domicilios from "./pages/Domicilios"
import Alertas from "./pages/Alertas"

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/domicilios" element={<Domicilios />} />
          <Route path="/alertas" element={<Alertas />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
