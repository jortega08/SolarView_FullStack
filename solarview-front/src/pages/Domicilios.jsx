"use client"

import { useState, useEffect } from "react"
import api from "../services/api"

export default function Domicilios() {
  const [domicilios, setDomicilios] = useState([])
  const [users, setUsers] = useState([])
  const [paises, setPaises] = useState([])
  const [estados, setEstados] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    usuario_id: "",
    pais_id: "",
    estado_id: "",
    ciudad_id: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [domiciliosData, usersData, paisesData] = await Promise.all([
        api.getDomicilios(),
        api.getUsers(),
        api.getPaises(),
      ])
      setDomicilios(domiciliosData)
      setUsers(usersData)
      setPaises(paisesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaisChange = async (paisId) => {
    setFormData({ ...formData, pais_id: paisId, estado_id: "", ciudad_id: "" })
    try {
      const estadosData = await api.getEstados(paisId)
      setEstados(estadosData)
      setCiudades([])
    } catch (error) {
      console.error("Error fetching estados:", error)
    }
  }

  const handleEstadoChange = async (estadoId) => {
    setFormData({ ...formData, estado_id: estadoId, ciudad_id: "" })
    try {
      const ciudadesData = await api.getCiudades(estadoId)
      setCiudades(ciudadesData)
    } catch (error) {
      console.error("Error fetching ciudades:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createDomicilio({
        usuario_id: formData.usuario_id,
        ciudad_id: formData.ciudad_id,
      })
      setFormData({ usuario_id: "", pais_id: "", estado_id: "", ciudad_id: "" })
      setShowForm(false)
      fetchData()
    } catch (error) {
      console.error("Error creating domicilio:", error)
      alert("Error al crear domicilio")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este domicilio?")) {
      try {
        await api.deleteDomicilio(id)
        fetchData()
      } catch (error) {
        console.error("Error deleting domicilio:", error)
      }
    }
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="domicilios-page">
      <div className="page-header">
        <h1>Gestión de Domicilios</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nuevo Domicilio"}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Crear Domicilio</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Usuario</label>
              <select
                value={formData.usuario_id}
                onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
                required
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option key={user.idusuario} value={user.idusuario}>
                    {user.nombre} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>País</label>
              <select value={formData.pais_id} onChange={(e) => handlePaisChange(e.target.value)} required>
                <option value="">Seleccionar país</option>
                {paises.map((pais) => (
                  <option key={pais.idpais} value={pais.idpais}>
                    {pais.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select
                value={formData.estado_id}
                onChange={(e) => handleEstadoChange(e.target.value)}
                required
                disabled={!formData.pais_id}
              >
                <option value="">Seleccionar estado</option>
                {estados.map((estado) => (
                  <option key={estado.idestado} value={estado.idestado}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <select
                value={formData.ciudad_id}
                onChange={(e) => setFormData({ ...formData, ciudad_id: e.target.value })}
                required
                disabled={!formData.estado_id}
              >
                <option value="">Seleccionar ciudad</option>
                {ciudades.map((ciudad) => (
                  <option key={ciudad.idciudad} value={ciudad.idciudad}>
                    {ciudad.nombre}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Crear Domicilio
            </button>
          </form>
        </div>
      )}

      <div className="domicilios-grid">
        {domicilios.map((domicilio) => (
          <div key={domicilio.iddomicilio} className="domicilio-card">
            <div className="card-header">
              <h3>{domicilio.usuario.nombre}</h3>
              <button className="btn-danger btn-sm" onClick={() => handleDelete(domicilio.iddomicilio)}>
                Eliminar
              </button>
            </div>
            <div className="card-body">
              <p>
                <strong>Email:</strong> {domicilio.usuario.email}
              </p>
              <p>
                <strong>Ciudad:</strong> {domicilio.ciudad.nombre}
              </p>
              <p>
                <strong>Estado:</strong> {domicilio.ciudad.estado.nombre}
              </p>
              <p>
                <strong>País:</strong> {domicilio.ciudad.estado.pais.nombre}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
