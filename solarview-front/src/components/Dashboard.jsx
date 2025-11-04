"use client"

import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import HeroBanner from "./HeroBanner"
import ActivitiesChart from "./ActivitiesChart"
import MonthlyDonutChart from "./MonthlyDonutChart"
import StatsCards from "./StatsCards"
import TasksTable from "./TasksTable"
import Calendar from "./Calendar"
import { fetchDashboardData } from "../services/api"
import "../styles/Dashboard.css"

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("year")
  const [dateRange, setDateRange] = useState(null) // {start, end, startISO, endISO}
  const [yearActivities, setYearActivities] = useState([]) // datos fijos para el donut

  const loadDashboardData = async (currentPeriod = periodo, currentRange = dateRange) => {
    try {
      const data = await fetchDashboardData(currentPeriod, currentRange)

      console.log("🔍 Activities que llega al estado:", data.activities)

      setStats(data.stats)
      setActivities(data.activities)
      setTasks(data.tasks)

      // Si estamos en vista anual sin rango custom, guardamos dataset anual para el donut
      if (currentPeriod === "year" && !currentRange) {
        setYearActivities(data.activities || [])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(() => loadDashboardData(), 30000)
    return () => clearInterval(interval)
  }, []) // inicial

  const handlePeriodChange = (newPeriod) => {
    setPeriodo(newPeriod)
    setDateRange(null) // limpiamos rango custom
    loadDashboardData(newPeriod, null)
  }

  const handleRangeChange = (range) => {
    // calendario → periodo custom con rango
    setPeriodo("custom")
    setDateRange(range)
    loadDashboardData("custom", range)
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  // Datos que usará el donut: preferimos el anual guardado,
  // y si no existe aún, usamos lo que haya en activities
  const donutData = yearActivities.length ? yearActivities : activities

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <div className="dashboard-content">
          <HeroBanner userName="Usuario" />

          <div className="dashboard-grid">
            <div className="dashboard-left">
              <ActivitiesChart
                data={activities}
                periodo={periodo}
                onPeriodChange={handlePeriodChange}
              />
              <TasksTable tasks={tasks} />
            </div>

            <div className="dashboard-right">
              <Calendar range={dateRange} onRangeChange={handleRangeChange} />

              {/* Nuevo donut de consumo mensual */}
              <MonthlyDonutChart data={donutData} />

              <StatsCards stats={stats} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard