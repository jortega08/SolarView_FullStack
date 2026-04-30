/* ===== SOLEIM — Alertas (gestión completa) ===== */

// ---- Mock data ----
const allAlerts = [
  { id:'ALT-2025-0012', inst:'Planta Industrial Norte', cap:'2,5 MWp', sev:'Crítica', tipo:'Temperatura',       causa:'Sobretemperatura en Inversor 3 (78°C)',    estado:'Activa',    asignado:'Juan Pérez',  hace:'Hace 5 min',  sla:'00:55:00', orden:'OT-4587' },
  { id:'ALT-2025-0011', inst:'Centro Comercial Solar',  cap:'1,2 MWp', sev:'Alta',    tipo:'Eléctrica',          causa:'Pico de voltaje en MPPT 2 (752 V)',        estado:'Activa',    asignado:'—',           hace:'Hace 18 min', sla:'01:42:00', orden:null },
  { id:'ALT-2025-0010', inst:'Planta Logística Sur',    cap:'1,8 MWp', sev:'Media',   tipo:'Temperatura',       causa:'Temperatura inversor 3 en límite (72°C)',  estado:'Activa',    asignado:'María López', hace:'Hace 28 min', sla:'03:32:00', orden:'OT-4590' },
  { id:'ALT-2025-0009', inst:'Oficinas Corporativas',   cap:'500 kWp', sev:'Media',   tipo:'Comunicación',      causa:'Pérdida de comunicación con Medidor B',    estado:'Activa',    asignado:'—',           hace:'Hace 41 min', sla:'03:19:00', orden:null },
  { id:'ALT-2025-0008', inst:'Sucursal Costa',          cap:'750 kWp', sev:'Baja',    tipo:'Rendimiento',       causa:'Producción 18% bajo la media histórica',   estado:'Activa',    asignado:'Carlos Ruiz', hace:'Hace 1 h',    sla:'06:00:00', orden:'OT-4591' },
  { id:'ALT-2025-0007', inst:'Planta Industrial Norte', cap:'2,5 MWp', sev:'Alta',    tipo:'Aislamiento',       causa:'Fallo de aislamiento String 4.2',          estado:'En revisión',asignado:'Luis Vega',  hace:'Hace 2 h',    sla:'01:00:00', orden:'OT-4584' },
  { id:'ALT-2025-0006', inst:'Centro Comercial Solar',  cap:'1,2 MWp', sev:'Baja',    tipo:'Rendimiento',       causa:'Módulos con suciedad detectada',           estado:'Resuelta',  asignado:'Ana Torres',  hace:'Hace 4 h',    sla:'Cumplido',  orden:'OT-4578' },
  { id:'ALT-2025-0005', inst:'Planta Logística Sur',    cap:'1,8 MWp', sev:'Media',   tipo:'Eléctrica',          causa:'Oscilación de frecuencia (49.8 Hz)',       estado:'Resuelta',  asignado:'Juan Pérez',  hace:'Hace 6 h',    sla:'Cumplido',  orden:'OT-4571' },
];

const timelineAlerta = [
  { type:'tl-red',   text:'Alerta generada automáticamente',      time:'14 abr 2025, 15:37:03',  user:'Sistema' },
  { type:'tl-blue',  text:'Notificación enviada a operadores',     time:'14 abr 2025, 15:37:05',  user:'Sistema' },
  { type:'tl-amber', text:'Orden de trabajo OT-4587 creada',       time:'14 abr 2025, 15:37:10',  user:'Sistema' },
  { type:'tl-blue',  text:'Juan Pérez aceptó la tarea',           time:'14 abr 2025, 15:39:22',  user:'Juan Pérez' },
  { type:'tl-green', text:'Técnico en camino a la instalación',   time:'14 abr 2025, 15:42:55',  user:'Juan Pérez' },
];

const slaData = [
  { label:'Cumplido a tiempo', value: 84, color: 'var(--c-green)' },
  { label:'Con retraso',       value: 9,  color: 'var(--c-amber)' },
  { label:'Vencido',           value: 7,  color: 'var(--c-red)' },
];

// ---- SLA ring ----
function SLARing({ pct, color, size = 56, sw = 6 }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--gray-200)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--gray-800)">{pct}%</text>
    </svg>
  );
}

// ---- Alert detail panel ----
function AlertDetailPanel({ alert, onClose, onNavigate }) {
  const [tab, setTab] = React.useState('detalle');
  return (
    <div style={{ position:'fixed', top:56, right:0, bottom:0, width:380, background:'#fff', borderLeft:'1px solid var(--gray-200)', zIndex:200, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'var(--shadow-lg)' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'flex-start', gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--gray-700)' }}>{alert.id}</span>
            <SevBadge sev={alert.sev} />
          </div>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{alert.causa}</div>
          <div style={{ fontSize:11, color:'var(--gray-500)' }}>{alert.inst} · {alert.cap}</div>
        </div>
        <button className="btn btn-icon btn-secondary" onClick={onClose}><Icons.x /></button>
      </div>

      {/* Status bar */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--gray-200)', display:'flex', gap:14, fontSize:12, flexWrap:'wrap' }}>
        {[['Estado', <span className={`badge ${alert.estado==='Activa' ? 'badge-alert' : alert.estado==='En revisión' ? 'badge-warn' : 'badge-online'}`}>{alert.estado}</span>],
          ['Tipo', <span className="badge badge-info">{alert.tipo}</span>],
          ['SLA restante', <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color: alert.sla === 'Cumplido' ? 'var(--c-green)' : 'var(--c-red)' }}>{alert.sla}</span>],
          ['Hace', alert.hace]].map(([k,v]) => (
          <div key={k}><div style={{ fontSize:10, color:'var(--gray-500)', marginBottom:3 }}>{k}</div><div>{v}</div></div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--gray-200)', display:'flex', gap:6, flexWrap:'wrap' }}>
        {alert.estado === 'Activa' && <>
          <button className="btn btn-primary btn-sm">Asignar técnico</button>
          <button className="btn btn-secondary btn-sm">Crear OT</button>
        </>}
        {alert.estado !== 'Resuelta' && <button className="btn btn-green btn-sm">Marcar resuelta</button>}
        <button className="btn btn-secondary btn-sm">Escalar</button>
        {alert.orden && <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('ordenes')}>Ver {alert.orden}</button>}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--gray-200)', padding:'0 16px' }}>
        {['detalle','timeline','comentarios'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 10px', fontSize:12, fontWeight:tab===t ? 600 : 400, color:tab===t ? 'var(--c-blue)' : 'var(--gray-500)', background:'none', border:'none', borderBottom:tab===t ? '2px solid var(--c-blue)' : '2px solid transparent', cursor:'pointer', whiteSpace:'nowrap', textTransform:'capitalize' }}>
            {t === 'timeline' ? 'Línea de tiempo' : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
        {tab === 'detalle' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--c-red-light)', border:'1px solid var(--c-red-mid)', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--c-red)', marginBottom:4 }}>⚠ Descripción de la alerta</div>
              <div style={{ fontSize:12, color:'var(--gray-700)', lineHeight:1.5 }}>{alert.causa}</div>
            </div>
            {[['Instalación afectada', alert.inst],['Capacidad', alert.cap],['Tipo de alerta', alert.tipo],['Severidad', alert.sev],['Generada', alert.hace],['Técnico asignado', alert.asignado],['Orden relacionada', alert.orden || '—']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, borderBottom:'1px solid var(--gray-100)', paddingBottom:6 }}>
                <span style={{ color:'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {tab === 'timeline' && (
          <div className="timeline">
            {timelineAlerta.map((t, i) => (
              <div key={i} className={`timeline-item ${t.type}`}>
                <div className="timeline-content">
                  <div style={{ fontWeight:600, fontSize:12 }}>{t.text}</div>
                  <div style={{ fontSize:10, color:'var(--gray-400)' }}>{t.time} · {t.user}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'comentarios' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,var(--c-blue),var(--c-purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>CM</div>
              <div style={{ flex:1, background:'var(--gray-50)', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}><span style={{ fontSize:12, fontWeight:600 }}>Carlos Méndez</span><span style={{ fontSize:10, color:'var(--gray-400)' }}>Hace 10 min</span></div>
                <div style={{ fontSize:12, color:'var(--gray-700)', lineHeight:1.4 }}>Revisar el sistema de refrigeración del inversor y verificar que la ventilación sea adecuada.</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <input placeholder="Agregar comentario…" style={{ flex:1, padding:'7px 10px', border:'1px solid var(--gray-200)', borderRadius:6, fontSize:12, fontFamily:'var(--font-base)', outline:'none' }}/>
              <button className="btn btn-primary btn-sm">Enviar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main page ----
function Alertas({ onNav }) {
  const [selected, setSelected] = React.useState(null);
  const [filterSev, setFilterSev] = React.useState('Todas');
  const [filterEst, setFilterEst] = React.useState('Todos');
  const [filterInst, setFilterInst] = React.useState('Todas');

  const filtered = allAlerts.filter(a =>
    (filterSev === 'Todas' || a.sev === filterSev) &&
    (filterEst === 'Todos' || a.estado === filterEst) &&
    (filterInst === 'Todas' || a.inst === filterInst)
  );

  const activas   = allAlerts.filter(a => a.estado === 'Activa').length;
  const revision  = allAlerts.filter(a => a.estado === 'En revisión').length;
  const resueltas = allAlerts.filter(a => a.estado === 'Resuelta').length;
  const criticas  = allAlerts.filter(a => a.sev === 'Crítica' && a.estado !== 'Resuelta').length;

  return (
    <div className="page-content" style={{ paddingRight: selected ? 396 : 'var(--content-pad)' }}>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
        <MetricCard icon={<Icons.alert />}    iconBg="var(--c-red-light)"    iconColor="var(--c-red)"    label="Alertas críticas activas"  value={String(criticas)}   delta="+2 vs. ayer"     deltaDir="down" />
        <MetricCard icon={<Icons.alert />}    iconBg="var(--c-orange-light)" iconColor="var(--c-orange)" label="Total alertas activas"     value={String(activas)}    delta="+3 vs. ayer"     deltaDir="down" />
        <MetricCard icon={<Icons.clock />}    iconBg="var(--c-amber-light)"  iconColor="var(--c-amber)"  label="En revisión"               value={String(revision)}   delta="Asignadas a técnicos" deltaDir="neutral" />
        <MetricCard icon={<Icons.check />}    iconBg="var(--c-green-light)"  iconColor="var(--c-green)"  label="Resueltas hoy"             value={String(resueltas)}  delta="+5 vs. ayer"     deltaDir="up" />
        <MetricCard icon={<Icons.shield />}   iconBg="var(--c-purple-light)" iconColor="var(--c-purple)" label="Cumplimiento SLA"          value="84%"                delta="-2% vs. ayer"    deltaDir="down" />
      </div>

      {/* SLA summary + by inst breakdown */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Resumen de SLA <span className="info-icon"><Icons.info /></span></span><span className="card-link">Ver detalle</span></div>
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            {slaData.map(d => (
              <div key={d.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <SLARing pct={d.value} color={d.color} size={64} sw={7} />
                <div style={{ fontSize:11, color:'var(--gray-600)', textAlign:'center' }}>{d.label}</div>
              </div>
            ))}
            <div style={{ flex:1, paddingLeft:16, borderLeft:'1px solid var(--gray-200)' }}>
              <div style={{ fontSize:12, color:'var(--gray-600)', marginBottom:8 }}>Distribución por severidad</div>
              {[['Crítica','#dc2626',3],['Alta','#ea580c',4],['Media','#d97706',8],['Baja','#3b82f6',6]].map(([s,c,n]) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0 }}/>
                  <span style={{ fontSize:12, flex:1, color:'var(--gray-700)' }}>{s}</span>
                  <div style={{ width:80, height:5, background:'var(--gray-200)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${(n/21)*100}%`, height:'100%', background:c, borderRadius:3 }}/>
                  </div>
                  <span style={{ fontWeight:700, fontSize:12, fontVariantNumeric:'tabular-nums', minWidth:14 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Alertas activas por instalación <span className="info-icon"><Icons.info /></span></span></div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['Planta Industrial Norte',5,'var(--c-red)'],['Planta Logística Sur',3,'var(--c-orange)'],['Centro Comercial Solar',2,'var(--c-amber)'],['Oficinas Corporativas',1,'var(--c-amber)'],['Sucursal Costa',1,'var(--c-amber)']].map(([name, n, color]) => (
              <div key={name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:12, color:'var(--gray-700)', minWidth:170, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                <div style={{ flex:1, height:6, background:'var(--gray-200)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${(n/5)*100}%`, height:'100%', background:color, borderRadius:3 }}/>
                </div>
                <span style={{ fontWeight:700, fontSize:13, minWidth:14, textAlign:'right', color }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Todas las alertas</span>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button className="btn btn-secondary btn-sm"><Icons.download />Exportar</button>
            <button className="btn btn-primary btn-sm"><Icons.plus />Nueva alerta</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          {[['Severidad', filterSev, setFilterSev, ['Todas','Crítica','Alta','Media','Baja']],
            ['Estado',    filterEst, setFilterEst,  ['Todos','Activa','En revisión','Resuelta']],
            ['Instalación', filterInst, setFilterInst, ['Todas',...new Set(allAlerts.map(a=>a.inst))]]].map(([label, val, setter, opts]) => (
            <div key={label} className="filter-select">
              <div className="filter-label">{label}</div>
              <select className="header-select" value={val} onChange={e => setter(e.target.value)}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Instalación</th><th>Severidad</th><th>Tipo</th><th>Causa</th><th>Estado</th><th>Asignado</th><th>SLA restante</th><th>Hace</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} style={{ cursor:'pointer', background: selected?.id === a.id ? 'var(--c-blue-light)' : 'inherit' }} onClick={() => setSelected(a)}>
                <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--c-blue)' }}>{a.id}</span></td>
                <td><div style={{ fontWeight:600, fontSize:12 }}>{a.inst}</div><div style={{ fontSize:10, color:'var(--gray-500)' }}>{a.cap}</div></td>
                <td><SevBadge sev={a.sev} /></td>
                <td><span className="badge badge-info" style={{ fontSize:10 }}>{a.tipo}</span></td>
                <td style={{ fontSize:12, maxWidth:180 }}>{a.causa}</td>
                <td><span className={`badge ${a.estado==='Activa' ? 'badge-alert' : a.estado==='En revisión' ? 'badge-warn' : 'badge-online'}`}>{a.estado}</span></td>
                <td style={{ fontSize:12 }}>{a.asignado}</td>
                <td style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color: a.sla==='Cumplido' ? 'var(--c-green)' : a.sla < '02:00:00' ? 'var(--c-red)' : 'var(--c-amber)' }}>{a.sla}</td>
                <td style={{ fontSize:11, color:'var(--gray-500)', whiteSpace:'nowrap' }}>{a.hace}</td>
                <td><div className="icon-actions">
                  <button className="btn btn-icon btn-secondary" onClick={e => { e.stopPropagation(); setSelected(a); }}><Icons.eye /></button>
                  <button className="btn btn-icon btn-secondary" onClick={e => e.stopPropagation()}><Icons.moreVert /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, fontSize:12, color:'var(--gray-500)' }}>
          <span>1–{filtered.length} de {allAlerts.length} alertas</span>
          <div style={{ display:'flex', gap:4 }}>
            <button className="btn btn-secondary btn-sm">‹</button>
            <button className="btn btn-primary btn-sm">1</button>
            <button className="btn btn-secondary btn-sm">›</button>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && <AlertDetailPanel alert={selected} onClose={() => setSelected(null)} onNavigate={onNav} />}
    </div>
  );
}

window.Alertas = Alertas;
