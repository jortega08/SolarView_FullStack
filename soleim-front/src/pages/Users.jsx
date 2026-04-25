"use client"

import { useState, useEffect } from "react"
import api from "../services/api"

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contrasena: "",
    rol: "user",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createUser(formData)
      setFormData({ nombre: "", email: "", contrasena: "", rol: "user" })
      setShowForm(false)
      fetchUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Error al crear usuario")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await api.deleteUser(id)
        fetchUsers()
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nuevo Usuario"}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>Crear Usuario</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={formData.contrasena}
                onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                required
                maxLength={16}
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}>
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Crear Usuario
            </button>
          </form>
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.idusuario}>
                <td>{user.idusuario}</td>
                <td>{user.nombre}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge badge-${user.rol}`}>
                    {user.rol === "admin" ? "Administrador" : "Usuario"}
                  </span>
                </td>
                <td>{new Date(user.fecha_registro).toLocaleDateString()}</td>
                <td>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(user.idusuario)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
