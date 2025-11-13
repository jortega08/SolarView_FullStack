import { Rocket, Trophy, DollarSign } from "lucide-react"
import "../styles/StatsCards.css"

const StatsCards = ({ stats }) => {
  if (!stats) return null

  return (
    <div className="stats-cards">
      

      <div className="stat-card">
        <div className="stat-icon trophy">
          <Trophy size={24} />
        </div>
        <div className="stat-content">
          <p className="stat-label">Logros completados</p>
          <h3 className="stat-value">{stats.completed_tasks}</h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon dollar">
          <DollarSign size={24} />
        </div>
        <div className="stat-content">
          <p className="stat-label">Ahorro de este mes</p>
          <h3 className="stat-value">${stats.earnings}</h3>
        </div>
      </div>
    </div>
  )
}

export default StatsCards
