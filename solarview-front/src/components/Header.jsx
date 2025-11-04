import { Search, Bell } from "lucide-react"
import "../styles/Header.css"

const Header = () => {
  return (
    <header className="header">
      <h1 className="header-title">Dashboard</h1>

      <div className="header-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search" />
        </div>

        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <select className="language-select">
          <option>EN</option>
          <option>ES</option>
        </select>
      </div>
    </header>
  )
}

export default Header;
