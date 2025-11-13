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
import BatteryInfoCard from "./BatteryInfoCard"
import BatteryThermometer from "./BatteryThermometer"
import TodayConsumptionCard from "./TodayConsumptionCard"
import { fetchDashboardData, fetchBatteryStatus } from "../services/api"
import "../styles/Dashboard.css"

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("year")
  const [dateRange, setDateRange] = useState(null)
  const [yearActivities, setYearActivities] = useState([])
  const [batteryData, setBatteryData] = useState(null)

  const loadDashboardData = async (currentPeriod = periodo, currentRange = dateRange) => {
    try {
      const data = await fetchDashboardData(currentPeriod, currentRange)
      setStats(data.stats)
      setActivities(data.activities)
      setTasks(data.tasks)
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
    fetchBatteryStatus().then((data) => setBatteryData(data))
    const interval = setInterval(() => {
      loadDashboardData()
      fetchBatteryStatus().then((data) => setBatteryData(data))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handlePeriodChange = (newPeriod) => {
    setPeriodo(newPeriod)
    setDateRange(null)
    loadDashboardData(newPeriod, null)
  }

  const handleRangeChange = (range) => {
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
              <BatteryInfoCard data={batteryData} />
              <TasksTable tasks={tasks} />
            </div>

            <div className="dashboard-right">
              <Calendar range={dateRange} onRangeChange={handleRangeChange} />
              <MonthlyDonutChart data={donutData} />
              <TodayConsumptionCard />
              <BatteryThermometer />
              <StatsCards stats={stats} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard