/* ===== SOLEIM Shared Components: Layout, Sidebar, Header, common UI ===== */

// ---- Icons (inline SVG helpers) ----
const Icons = {
  sun: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>,
  zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  dollar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  alert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
  shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  battery: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="18" height="10" rx="2" ry="2" /><line x1="22" y1="11" x2="22" y2="13" /></svg>,
  home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  building: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h1v1H9zM14 9h1v1h-1zM9 14h1v1H9zM14 14h1v1h-1z" /></svg>,
  activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  barChart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>,
  fileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  wrench: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
  wifi: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" /></svg>,
  search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  chevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>,
  chevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>,
  eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  moreVert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>,
  trendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "40px", height: "40px" }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  trendDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
  check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>,
  x: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
  grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  list: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  arrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  mapPin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  thermometer: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>,
  wind: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></svg>,
  tool: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
  sunCloud: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M17 12a5 5 0 1 0-9.9-1H5a3 3 0 0 0 0 6h12a3 3 0 0 0 .17-6z" /></svg>
};

// ---- Metric Card ----
function MetricCard({ icon, iconBg, iconColor, label, value, delta, deltaDir, deltaText, unit }) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}{unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-500)', marginLeft: 2 }}>{unit}</span>}</div>
      {delta &&
      <div className={`metric-delta ${deltaDir}`} style={{ fontFamily: "Inter" }}>
          {deltaDir === 'up' ? <Icons.trendUp /> : deltaDir === 'down' ? <Icons.trendDown /> : null}
          {delta} {deltaText}
        </div>
      }
    </div>);

}

// ---- Status Badge ----
function StatusBadge({ status }) {
  const map = {
    'En línea': ['badge badge-online', '●'],
    'Alerta': ['badge badge-alert', '●'],
    'Mantenimiento': ['badge badge-maint', '●'],
    'Fuera de línea': ['badge badge-gray', '●']
  };
  const [cls, dot] = map[status] || ['badge badge-gray', '●'];
  return <span className={cls}><span className="badge-dot" />{status}</span>;
}

// ---- Severity Badge ----
function SevBadge({ sev }) {
  const map = {
    'Crítica': 'badge sev-critical',
    'Alta': 'badge sev-alta',
    'Media': 'badge sev-media',
    'Baja': 'badge sev-baja'
  };
  return <span className={map[sev] || 'badge badge-gray'}>{sev}</span>;
}

// ---- Work Order Status Badge ----
function WOBadge({ status }) {
  const map = {
    'Abierta': 'badge wo-abierta',
    'Asignada': 'badge wo-asignada',
    'En progreso': 'badge wo-progreso',
    'Completada': 'badge wo-completada',
    'Cerrada': 'badge wo-cerrada',
    'Programado': 'badge badge-info',
    'Cancelado': 'badge badge-gray'
  };
  return <span className={map[status] || 'badge badge-gray'}>{status}</span>;
}

// ---- Battery Bar ----
function BatteryBar({ pct }) {
  const cls = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
  return (
    <div className="battery-bar-wrap">
      <div className="battery-bar-track">
        <div className="battery-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="battery-bar-label" style={{ color: pct >= 70 ? 'var(--c-green)' : pct >= 40 ? 'var(--c-amber)' : 'var(--c-red)' }}>{pct}%</span>
    </div>);

}

// Inject the BatteryBar.cls computed style
BatteryBar.fill = (pct) => pct >= 70 ? 'battery-bar-fill high' : pct >= 40 ? 'battery-bar-fill medium' : 'battery-bar-fill low';

// ---- Sidebar ----
function Sidebar({ active, onNav, collapsed, onToggle }) {
  const navItems = [
  { id: 'dashboard', label: 'Resumen', icon: <Icons.home /> },
  { id: 'instalaciones', label: 'Instalaciones', icon: <Icons.building /> },
  { id: 'telemetria', label: 'Telemetría', icon: <Icons.activity /> },
  { id: 'alertas', label: 'Alertas', icon: <Icons.alert />, badge: 12 },
  { id: 'ordenes', label: 'Órdenes', icon: <Icons.clipboard />, badge: 8 },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: <Icons.wrench /> },
  { id: 'tecnicos', label: 'Técnicos', icon: <Icons.users /> },
  { id: 'analitica', label: 'Analítica', icon: <Icons.barChart /> },
  { id: 'reportes', label: 'Reportes', icon: <Icons.fileText /> },
  { id: 'notificaciones', label: 'Notificaciones', icon: <Icons.bell />, badge: 24 },
  { id: 'configuracion', label: 'Configuración', icon: <Icons.settings /> }];


  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 1 1-6 6 6 6 0 0 1 6-6zm0 2a4 4 0 1 0 4 4 4 4 0 0 0-4-4z" opacity=".3" /><path d="M12 6l1.5 3 3 .5-2.25 2 .75 3L12 13l-3 1.5.75-3L7.5 9.5l3-.5z" /></svg>
        </div>
        {!collapsed && <span className="brand-name">SOLEIM</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) =>
        <div
          key={item.id}
          className={`nav-item${active === item.id ? ' active' : ''}`}
          onClick={() => onNav(item.id)}
          title={collapsed ? item.label : ''}>
          
            {item.icon}
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {!collapsed && item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        {!collapsed &&
        <div className="live-indicator">
            <div className="live-dot" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--gray-700)', fontSize: 11 }}>En vivo</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>Hace 10 segundos</div>
            </div>
            <span className="live-wave">〜</span>
          </div>
        }
        <div className="nav-item" onClick={onToggle} title={collapsed ? 'Expandir' : 'Colapsar'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {!collapsed && <span className="nav-label">Colapsar</span>}
        </div>
      </div>
    </aside>);

}

// ---- Header ----
function Header({ title, liveLabel, onNav }) {
  return (
    <header className="main-header">
      <span className="header-title">{title}</span>
      {liveLabel &&
      <span className="header-live">
          <span className="header-live-dot" />
          En vivo
        </span>
      }
      <div className="header-spacer" />
      <select className="header-select">
        <option>Soluciones Fotovoltaicas S.A.</option>
        <option>Empresa Norte S.A.</option>
        <option>Solar Corp MX</option>
      </select>
      <div className="header-search">
        <Icons.search />
        <input placeholder="Buscar instalaciones, activos, órdenes…" />
      </div>
      <div className="header-date">
        <Icons.calendar />
        <span>24 may 2025 – 24 may 2025</span>
      </div>
      <div className="header-icon-btn" onClick={() => onNav && onNav('notificaciones')}>
        <Icons.bell />
        <span className="notif-badge">12</span>
      </div>
      <div className="user-chip">
        <div className="user-avatar">CM</div>
        <div className="user-info">
          <span className="user-name">Carlos Méndez</span>
          <span className="user-role">Administrador ▾</span>
        </div>
      </div>
    </header>);

}

// ---- Export all to window ----
Object.assign(window, {
  Icons, MetricCard, StatusBadge, SevBadge, WOBadge, BatteryBar, Sidebar, Header
});