"use client"

import { useState, useEffect } from "react"
import api from "../services/api"

export default function Alertas() {
  const [alertas, setAlertas] = useState([])
  const [domicilios, setDomicilios] = useState([])
  const [tiposAlerta, setTiposAlerta] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState("todas")
  const [formData, setFormData] = useState({
    domicilio_id: "",
    tipoalerta_id: "",
    mensaje: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [alertasData, domiciliosData, tiposData] = await Promise.all([
        api.getAlertas(),
        api.getDomicilios(),
        api.getTiposAlerta(),
      ])
      setAlertas(alertasData)
      setDomicilios(domiciliosData)
      setTiposAlerta(tiposData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createAlerta(formData)
      setFormData({ domicilio_id: "", tipoalerta_id: "", mensaje: "" })
      setShowForm(false)
      fetchData()
    } catch (error) {
      console.error("Error creating alerta:", error)
      alert("Error al crear alerta")
    }
  }

  const handleUpdateEstado = async (id, nuevoEstado) => {
    try {
      await api.updateAlerta(id, { estado: nuevoEstado })
      fetchData()
    } catch (error) {
      console.error("Error updating alerta:", error)
    }
  }

  const filteredAlertas = alertas.filter((alerta) => {
    if (filter === "todas") return true
    return alerta.estado === filter
  })

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="alertas-page">
      <div className="page-header">
        <h1>Gestión de Alertas</h1>
        <div className="header-actions">
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="activa">Activas</option>
            <option value="resuelta">Resueltas</option>
            <option value="cancelada">Canceladas</option>
          </select>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Nueva Alerta"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Crear Alerta</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Domicilio</label>
              <select
                value={formData.domicilio_id}
                onChange={(e) => setFormData({ ...formData, domicilio_id: e.target.value })}
                required
              >
                <option value="">Seleccionar domicilio</option>
                {domicilios.map((dom) => (
                  <option key={dom.iddomicilio} value={dom.iddomicilio}>
                    {dom.usuario.nombre} - {dom.ciudad.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de Alerta</label>
              <select
                value={formData.tipoalerta_id}
                onChange={(e) => setFormData({ ...formData, tipoalerta_id: e.target.value })}
              >
                <option value="">Sin tipo específico</option>
                {tiposAlerta.map((tipo) => (
                  <option key={tipo.idtipoalerta} value={tipo.idtipoalerta}>
                    {tipo.nombre} - {tipo.descripcion}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Mensaje</label>
              <textarea
                value={formData.mensaje}
                onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                required
                rows={4}
                maxLength={255}
              />
            </div>
            <button type="submit" className="btn-primary">
              Crear Alerta
            </button>
          </form>
        </div>
      )}

      <div className="alertas-list">
        {filteredAlertas.map((alerta) => (
          <div key={alerta.idalerta} className={`alerta-card alerta-${alerta.estado}`}>
            <div className="alerta-header">
              <span className={`badge badge-${alerta.estado}`}>{alerta.estado.toUpperCase()}</span>
              <span className="alerta-fecha">{new Date(alerta.fecha).toLocaleString()}</span>
            </div>
            <div className="alerta-body">
              {alerta.tipoalerta && (
                <p className="alerta-tipo">
                  <strong>{alerta.tipoalerta.nombre}:</strong> {alerta.tipoalerta.descripcion}
                </p>
              )}
              <p className="alerta-mensaje">{alerta.mensaje}</p>
              <p className="alerta-domicilio">
                <strong>Domicilio ID:</strong> {alerta.domicilio_id}
              </p>
            </div>
            {alerta.estado === "activa" && (
              <div className="alerta-actions">
                <button className="btn-success btn-sm" onClick={() => handleUpdateEstado(alerta.idalerta, "resuelta")}>
                  Resolver
                </button>
                <button className="btn-warning btn-sm" onClick={() => handleUpdateEstado(alerta.idalerta, "cancelada")}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
