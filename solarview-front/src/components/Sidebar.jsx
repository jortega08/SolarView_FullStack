import { Home, Calendar, FileText, Database, MessageSquare, Award, LogOut } from "lucide-react"
import "../styles/Sidebar.css"

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-avatar">
          <img src="https://ui-avatars.com/api/?name=Usuario&background=4F46E5&color=fff" alt="User" />
        </div>
        <div className="user-info">
          <h3>Usuario</h3>
          <p>Solar Manager</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">
          <Home size={20} />
        </a>
        <a href="#" className="nav-item">
          <Calendar size={20} />
        </a>
        <a href="#" className="nav-item">
          <FileText size={20} />
        </a>
        <a href="#" className="nav-item">
          <Database size={20} />
        </a>
        <a href="#" className="nav-item">
          <MessageSquare size={20} />
        </a>
        <a href="#" className="nav-item">
          <Award size={20} />
        </a>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <LogOut size={20} />
        </button>
        <span className="version">1</span>
      </div>
    </div>
  )
}

export default Sidebar
