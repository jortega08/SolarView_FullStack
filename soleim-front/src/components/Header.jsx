import { useState, useEffect, useRef } from "react";
import { Search, Bell } from "lucide-react";
import "../styles/Header.css";

const fetchLatestAlerts = async () => {
  const response = await fetch("/api/alertas/ultimas/");
  const data = await response.json();
  // Es un array, regresa tal cual
  return data;
};

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (showDropdown) {
      fetchLatestAlerts().then(setAlerts);
    }
  }, [showDropdown]);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  return (
    <header className="header">
      <h1 className="header-title">Dashboard</h1>
      <div className="header-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search" />
        </div>
        <div style={{ position: "relative" }}>
          <button
            className="notification-btn"
            onClick={() => setShowDropdown((v) => !v)}
            aria-label="Ver alertas"
          >
            <Bell size={20} />
            {alerts.length > 0 ? (
              <span className="notification-badge">{alerts.length}</span>
            ) : null}
          </button>
          {showDropdown && (
            <div className="alerts-dropdown" ref={dropdownRef}>
              <div className="alerts-dropdown-title">Últimas alertas</div>
              {alerts.length === 0 ? (
                <div className="alerts-dropdown-item empty">
                  Sin alertas recientes
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div className="alerts-dropdown-item" key={alert.idalerta || idx}>
                    <div className="alerts-dropdown-alert-title">
                      {alert.tipo || alert.tipoalerta__nombre || "Alerta"}
                    </div>
                    <div className="alerts-dropdown-alert-desc">
                      {alert.mensaje}
                    </div>
                    <div className="alerts-dropdown-alert-date">
                      {alert.fecha}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
