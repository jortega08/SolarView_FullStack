/* ===== SOLEIM — Centro de operaciones ===== */

// ---- Mock data ----
const alertsData = [
  { id: 'ALT-2025-0012', inst: 'Planta Industrial Norte', cap: '2,5 MWp', sev: 'Crítica', causa: 'Degradación de string',     fecha: '24 may 2025 09:12', estado: 'Activa' },
  { id: 'ALT-2025-0011', inst: 'Centro Comercial Solar',  cap: '1,2 MWp', sev: 'Alta',    causa: 'Pico de voltaje en MPPT 2', fecha: '24 may 2025 08:45', estado: 'Activa' },
  { id: 'ALT-2025-0010', inst: 'Planta Logística Sur',    cap: '1,8 MWp', sev: 'Media',   causa: 'Temperatura inversor 3',    fecha: '24 may 2025 08:20', estado: 'Activa' },
  { id: 'ALT-2025-0009', inst: 'Oficinas Corporativas',   cap: '500 kWp', sev: 'Media',   causa: 'Fallo de comunicación',     fecha: '24 may 2025 07:58', estado: 'Activa' },
  { id: 'ALT-2025-0008', inst: 'Sucursal Costa',          cap: '750 kWp', sev: 'Baja',    causa: 'Suciedad en módulos',       fecha: '24 may 2025 07:41', estado: 'Activa' },
];

const kanbanData = {
  Abierta: [
    { id: 'ORD-2025-0087', title: 'Producción baja – String 4.2', inst: 'Planta Industrial Norte', sev: 'Alta',  tech: 'Sin asignar', sla: '01:42:18', slaState: 'sla-risk' },
    { id: 'ORD-2025-0088', title: 'Sobretemperatura CC',           inst: 'Centro Comercial Solar',  sev: 'Alta',  tech: 'Sin asignar', sla: '02:15:44', slaState: 'sla-risk' },
    { id: 'ORD-2025-0089', title: 'Temperatura elevada',           inst: 'Planta Logística Sur',    sev: 'Media', tech: 'Sin asignar', sla: '03:10:22', slaState: 'sla-warn' },
  ],
  Asignada: [
    { id: 'ORD-2025-0090', title: 'Pérdida de comunicación',       inst: 'Oficinas Corporativas',   sev: 'Media', tech: 'Juan Pérez',  sla: '05:25:10', slaState: 'sla-warn' },
    { id: 'ORD-2025-0091', title: 'Producción baja',               inst: 'Sucursal Costa',          sev: 'Baja',  tech: 'María López', sla: '06:12:33', slaState: 'sla-ok' },
  ],
  'En progreso': [
    { id: 'ORD-2025-0082', title: 'Fallo de inversor 2',           inst: 'Planta Industrial Norte', sev: 'Alta',  tech: 'Juan Pérez',  sla: '00:45:12', slaState: 'sla-risk' },
    { id: 'ORD-2025-0079', title: 'Limpieza de módulos',           inst: 'Centro Comercial Solar',  sev: 'Baja',  tech: 'María López', sla: '01:30:45', slaState: 'sla-ok' },
  ],
  Completada: [
    { id: 'ORD-2025-0081', title: 'Reemplazo de fusible',          inst: 'Planta Logística Sur',    sev: 'Media', tech: 'Luis Ramírez', sla: 'Completado', slaState: 'sla-ok' },
    { id: 'ORD-2025-0077', title: 'Ajuste de parámetros',          inst: 'Oficinas Corporativas',   sev: 'Baja',  tech: 'Ana Torres',   sla: 'Completado', slaState: 'sla-ok' },
  ],
  Cerrada: [
    { id: 'ORD-2025-0075', title: 'Inspección termográfica',       inst: 'Planta Logística Sur',    sev: 'Baja',  tech: 'Luis Ramírez', sla: 'Completado', slaState: 'sla-ok' },
    { id: 'ORD-2025-0072', title: 'Limpieza de inversor',          inst: 'Planta Industrial Norte', sev: 'Baja',  tech: 'Ana Torres',   sla: 'Completado', slaState: 'sla-ok' },
  ],
};

const selectedOrder = {
  id: 'ORD-2025-0087',
  title: 'Producción baja – Degradación de string',
  inst: 'Planta Industrial Norte – 2,5 MWp',
  estado: 'Abierta', prioridad: 'Alta', sla: '01:42:18',
  created: '24 may 2025 09:18',
  desc: 'Se detecta la caída del 28% en la producción del string 4.2 del inversor 3.',
  instalAfect: 'Inversor 3 – String 4.2',
  sev: 'Alta',
  causa: 'Degradación de string',
  creadoPor: 'Sistema de monitoreo',
  etiquetas: ['Producción','Inversor','String'],
  timeline: [
    { type: 'tl-blue',  text: 'Orden creada automáticamente', time: '24 may 2025 09:18' },
    { type: 'tl-red',   text: 'Alerta generada – Planta Industrial Norte', time: '24 may 2025 09:12' },
    { type: 'tl-amber', text: 'Umbral de producción excedido', time: '24 may 2025 09:11' },
    { type: 'tl-green', text: 'Detección de anomalía', time: '24 may 2025 09:09' },
  ],
  comments: [
    { user: 'Carlos Méndez', role: 'Admin', text: 'Revisar curva I-V y estado de conexiones en caja de combinación.', time: 'Hace 25 min' },
    { user: 'Laura Gómez',   role: 'Técnico', text: 'Voy en camino al sitio.', time: 'Hace 15 min' },
  ],
};

const escalations = [
  { type: 'alert',   title: 'SLA en riesgo',     id: 'ORD-2025-0087', inst: 'Planta Industrial Norte', time: 'Hace 5 min' },
  { type: 'warn',    title: 'Escalación nivel 2', id: 'ORD-2025-0082', inst: 'Planta Industrial Norte', time: 'Hace 15 min' },
  { type: 'alert',   title: 'SLA en riesgo',      id: 'ORD-2025-0088', inst: 'Centro Comercial Solar',  time: 'Hace 20 min' },
  { type: 'info',    title: 'Próximo a vencer',   id: 'ORD-2025-0091', inst: 'Sucursal Costa',          time: 'Hace 35 min' },
  { type: 'success', title: 'SLA cumplido',        id: 'ORD-2025-0075', inst: 'Sucursal Costa',          time: 'Hace 1 h' },
];

// ---- Kanban Column ----
function KanbanCol({ title, orders, selectedId, onSelect, colKey }) {
  const colColors = {
    'Abierta': 'var(--gray-600)',
    'Asignada': 'var(--c-blue)',
    'En progreso': 'var(--c-amber)',
    'Completada': 'var(--c-green)',
    'Cerrada': 'var(--gray-400)',
  };
  return (
    <div className="kanban-col">
      <div className="kanban-col-header">
        <span className="kanban-col-title" style={{ color: colColors[colKey] || 'var(--gray-700)' }}>{title}</span>
        <span className="kanban-count">{orders.length}</span>
      </div>
      {orders.map(o => (
        <div key={o.id} className={`kanban-card${selectedId === o.id ? ' selected' : ''}`} onClick={() => onSelect(o.id)}>
          <div className="kanban-id">{o.id}</div>
          <div className="kanban-title">{o.title}</div>
          <div className="kanban-meta" style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: 'var(--gray-300)', fontSize: 10 }}>📍</span>{o.inst}</div>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'space-between' }}>
            <SevBadge sev={o.sev} />
            {o.tech !== 'Sin asignar'
              ? <span style={{ fontSize: 10, color: 'var(--gray-500)' }}>👤 {o.tech}</span>
              : <span style={{ fontSize: 10, color: 'var(--gray-400)', fontStyle: 'italic' }}>Sin asignar</span>}
          </div>
          {o.slaState !== 'sla-ok' && (
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--gray-400)' }}>SLA</span>
              <span className={`kanban-sla ${o.slaState}`}>{o.sla}</span>
            </div>
          )}
        </div>
      ))}
      {orders.length > 2 && <div style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', padding: '4px 0', cursor: 'pointer' }}>+{orders.length - 2} más</div>}
    </div>
  );
}

// ---- Order Detail Panel ----
function OrderDetailPanel({ order, onClose }) {
  const [tab, setTab] = React.useState('detalles');
  const tabs = ['detalles','timeline','comentarios','evidencias'];
  const tabLabels = { detalles: 'Detalles', timeline: 'Línea de tiempo', comentarios: `Comentarios ${order.comments.length}`, evidencias: 'Evidencias 2' };

  return (
    <div style={{ position: 'fixed', top: 56, right: 0, bottom: 0, width: 380, background: '#fff', borderLeft: '1px solid var(--gray-200)', zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
      {/* Panel header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--gray-900)' }}>{order.id}</span>
            <span className="badge badge-sla" style={{ fontSize: 10 }}>● SLA en riesgo</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', marginBottom: 2 }}>{order.title}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{order.inst}</div>
        </div>
        <button className="btn btn-icon btn-secondary" onClick={onClose}><Icons.x /></button>
      </div>

      {/* Status bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: 16, fontSize: 12 }}>
        {[['Estado', <WOBadge status={order.estado} />],['Prioridad', <SevBadge sev={order.prioridad} />],['SLA', <span className="kanban-sla sla-risk" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{order.sla}</span>],['Creada', order.created]].map(([k,v]) => (
          <div key={k}>
            <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 3 }}>{k}</div>
            <div>{v}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: 6 }}>
        <button className="btn btn-primary btn-sm">Asignar técnico</button>
        <button className="btn btn-secondary btn-sm">Iniciar</button>
        <button className="btn btn-secondary btn-sm" style={{ opacity: .4, cursor: 'not-allowed' }}>Completar</button>
        <button className="btn btn-secondary btn-sm">Cerrar ▾</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', padding: '0 16px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 10px', fontSize: 12, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--c-blue)' : 'var(--gray-500)', borderBottom: tab === t ? '2px solid var(--c-blue)' : '2px solid transparent', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--c-blue)' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'y', padding: '14px 16px', overflowY: 'auto' }}>
        {tab === 'detalles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>DESCRIPCIÓN</div>
              <div style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>{order.desc}</div>
            </div>
            {[['Instalación afectada', order.instalAfect],['Severidad', order.sev],['Causa probable', order.causa],['Creado por', order.creadoPor]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{v}</span>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6 }}>ETIQUETAS</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {order.etiquetas.map(e => <span key={e} className="badge badge-gray">{e}</span>)}
                <span className="badge badge-gray" style={{ cursor: 'pointer', color: 'var(--c-blue)' }}>+</span>
              </div>
            </div>
          </div>
        )}
        {tab === 'timeline' && (
          <div className="timeline">
            {order.timeline.map((t, i) => (
              <div key={i} className={`timeline-item ${t.type}`}>
                <span className="timeline-time" style={{ fontSize: 10 }}>{t.time.split(' ').slice(-1)[0]}</span>
                <div className="timeline-content">
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{t.text}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{t.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'comentarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {order.comments.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--c-blue),var(--c-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.user.split(' ').map(n=>n[0]).join('')}</div>
                <div style={{ flex: 1, background: 'var(--gray-50)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.user}</span>
                    <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-700)', lineHeight: 1.4 }}>{c.text}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input placeholder="Agregar comentario…" style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-base)', outline: 'none' }} />
              <button className="btn btn-primary btn-sm">Enviar</button>
            </div>
          </div>
        )}
        {tab === 'evidencias' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {['#1a3a5c','#2d5016','#5c1a1a'].map((bg, i) => (
                <div key={i} style={{ aspectRatio: '4/3', borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', fontSize: 20, cursor: 'pointer' }}>📷</div>
              ))}
              <button className="btn btn-secondary" style={{ aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: '2px dashed var(--gray-300)' }}>
                <Icons.plus /><span style={{ fontSize: 11 }}>Agregar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main page ----
function Operaciones() {
  const [selectedId, setSelectedId] = React.useState('ORD-2025-0087');
  const showPanel = !!selectedId;

  return (
    <div className="page-content" style={{ paddingRight: showPanel ? 396 : 'var(--content-pad)' }}>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        {[['Instalación','Todas'],['Severidad','Todas'],['Estado','Todos'],['Técnico','Todos'],['SLA','Todos']].map(([label, def]) => (
          <div key={label} className="filter-select">
            <div className="filter-label">{label}</div>
            <select className="header-select"><option>{def}</option></select>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-end', gap: 5 }}><Icons.filter />Más filtros</button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
        {[
          { icon: <Icons.alert />,     bg: 'var(--c-red-light)',    color: 'var(--c-red)',    label: 'Alertas activas',           value: '12', delta: '+2 vs. ayer', dir: 'down' },
          { icon: <Icons.clipboard />, bg: 'var(--c-orange-light)', color: 'var(--c-orange)', label: 'Órdenes abiertas',          value: '34', delta: '-3 vs. ayer', dir: 'up' },
          { icon: <Icons.clock />,     bg: 'var(--c-red-light)',    color: 'var(--c-red)',    label: 'Órdenes vencidas',          value: '7',  delta: '+2 vs. ayer', dir: 'down' },
          { icon: <Icons.shield />,    bg: 'var(--c-purple-light)', color: 'var(--c-purple)', label: 'SLA en riesgo',             value: '7',  delta: '+1 vs. ayer', dir: 'down' },
          { icon: <Icons.clock />,     bg: 'var(--c-teal-light)',   color: 'var(--c-teal)',   label: 'Tiempo medio de resolución', value: '2h 48m', delta: '-18m vs. ayer', dir: 'up' },
        ].map(k => <MetricCard key={k.label} {...k} deltaDir={k.dir} />)}
      </div>

      {/* Alerts table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Alertas activas
            <span style={{ background: 'var(--c-red)', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>12</span>
          </span>
          <span className="card-link">Ver todas</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Alerta</th><th>Instalación</th><th>Severidad</th><th>Causa probable</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {alertsData.map(a => (
              <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(a.id)}>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-blue)', fontWeight: 600 }}>{a.id}</span></td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.inst}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{a.cap}</div>
                </td>
                <td><SevBadge sev={a.sev} /></td>
                <td style={{ fontSize: 12 }}>{a.causa}</td>
                <td className="mono" style={{ fontSize: 11 }}>{a.fecha}</td>
                <td><span className="badge badge-online">{a.estado}</span></td>
                <td>
                  <div className="icon-actions">
                    <button className="btn btn-icon btn-secondary" title="Ver"><Icons.eye /></button>
                    <button className="btn btn-icon btn-secondary" title="Más"><Icons.moreVert /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12, color: 'var(--gray-500)' }}>
          <span>1–5 de 12</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-secondary btn-sm">‹</button>
            <button className="btn btn-secondary btn-sm">›</button>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Órdenes de trabajo <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>34</span></span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-icon btn-secondary"><Icons.grid /></button>
            <button className="btn btn-icon btn-secondary"><Icons.list /></button>
            <span className="card-link" style={{ alignSelf: 'center', marginLeft: 4 }}>Ver todas</span>
          </div>
        </div>
        <div className="kanban-board">
          {Object.entries(kanbanData).map(([col, orders]) => (
            <KanbanCol key={col} colKey={col} title={col} orders={orders} selectedId={selectedId} onSelect={setSelectedId} />
          ))}
        </div>
      </div>

      {/* Escalations */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Notificaciones y escalaciones</span>
          <span className="card-link">Ver todas</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {escalations.map((e, i) => {
            const typeMap = { alert: ['var(--c-red-light)','var(--c-red)','⚠'], warn: ['var(--c-orange-light)','var(--c-orange)','⚡'], info: ['var(--c-blue-light)','var(--c-blue)','ℹ'], success: ['var(--c-green-light)','var(--c-green)','✓'] };
            const [bg, color, icon] = typeMap[e.type] || typeMap.info;
            return (
              <div key={i} style={{ minWidth: 180, background: bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${color}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ color, fontWeight: 700, fontSize: 14 }}>{icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color }}>{e.title}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray-700)', marginBottom: 2 }}>{e.id}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-600)', marginBottom: 4 }}>{e.inst}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{e.time}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {showPanel && <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

window.Operaciones = Operaciones;
