import { Trophy, Sun, Zap, AlertTriangle, ChevronRight } from "lucide-react"
import "../styles/TasksTable.css"

const statusLabels = {
  completed: "Completado",
  in_progress: "En progreso",
  locked: "Pendiente",
}

const TasksTable = ({ tasks = [] }) => {
  return (
    <div className="tasks-widget">
      <div className="tasks-header">
        <div>
          <h3 className="tasks-title">Logros de eficiencia energética</h3>
          <p className="tasks-subtitle">
            Completa retos para ganar puntos y subir de nivel usando más energía solar.
          </p>
        </div>

        <div className="tasks-header-badge">
          <Trophy size={16} />
          <span>Gamificación SolarView</span>
        </div>
      </div>

      {(!tasks || tasks.length === 0) && (
        <div className="tasks-empty">
          <Sun size={32} />
          <p>Aún no hay logros configurados. Empieza a registrar consumo para ver tus retos.</p>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="tasks-list">
          {tasks.map((task) => {
            const status = task.status || "in_progress"
            const labelStatus = statusLabels[status] || "En progreso"
            const progress = Math.max(0, Math.min(1, task.progreso ?? 0))

            return (
              <div className="task-card" key={task.id}>
                <div className="task-main">
                  <div className="task-icon-wrapper">
                    {task.categoria?.toLowerCase().includes("solar") ? (
                      <div className="task-icon solar">
                        <Sun size={18} />
                      </div>
                    ) : task.categoria?.toLowerCase().includes("penal") ? (
                      <div className="task-icon warning">
                        <AlertTriangle size={18} />
                      </div>
                    ) : (
                      <div className="task-icon electric">
                        <Zap size={18} />
                      </div>
                    )}
                  </div>

                  <div className="task-info">
                    <div className="task-title-row">
                      <h4 className="task-title">{task.titulo}</h4>
                      <span className={`task-status-pill ${status}`}>
                        {labelStatus}
                      </span>
                    </div>
                    {task.categoria && (
                      <div className="task-category">{task.categoria}</div>
                    )}
                    <p className="task-description">{task.descripcion}</p>
                  </div>
                </div>

                <div className="task-footer">
                  <div className="task-progress-row">
                    <div className="task-progress-text">
                      <span className="task-progress-label">
                        Progreso
                      </span>
                      <span className="task-progress-value">
                        {task.progresoTexto || `${Math.round(progress * 100)}% completado`}
                      </span>
                    </div>
                    <div className="task-points-badge">
                      <Trophy size={14} />
                      <span>{task.puntos} pts</span>
                    </div>
                  </div>

                  <div className="task-progress-bar">
                    <div
                      className="task-progress-fill"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>

                  <button className="task-cta">
                    <span>
                      {status === "completed"
                        ? "Logro completado 🎉"
                        : "Ver cómo mejorar tu consumo"}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TasksTable
