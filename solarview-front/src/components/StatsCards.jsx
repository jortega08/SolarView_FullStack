import { Rocket, Trophy, DollarSign } from "lucide-react"
import "../styles/StatsCards.css"

const StatsCards = ({ stats }) => {
  if (!stats) return null

  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-icon rocket">
          <Rocket size={24} />
        </div>
        <div className="stat-content">
          <p className="stat-label">Open Projects</p>
          <h3 className="stat-value">{stats.open_projects}</h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon trophy">
          <Trophy size={24} />
        </div>
        <div className="stat-content">
          <p className="stat-label">Successfully Completed</p>
          <h3 className="stat-value">{stats.completed_tasks}</h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon dollar">
          <DollarSign size={24} />
        </div>
        <div className="stat-content">
          <p className="stat-label">Earned this month</p>
          <h3 className="stat-value">${stats.earnings}</h3>
        </div>
      </div>
    </div>
  )
}

export default StatsCards
