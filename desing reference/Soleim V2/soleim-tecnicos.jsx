/* ===== SOLEIM — Técnicos ===== */

// ---- Mock data ----
const tecnicos = [
  {
    id: 'TEC-001', name: 'Juan Pérez',   initials: 'JP', role: 'Técnico Senior', esp: ['Solar FV', 'Inversores'], zona: 'Norte',
    status: 'En tarea', load: 85, rating: 4.8, ordenes: 12, completadas: 189, sla: '96%', disponible: 'Mañana 09:00',
    cert: ['PV Install', 'Schneider Electric', 'Fronius'], contacto: '+52 81 1234-5678', email: 'j.perez@soleim.mx',
    tasks: [
      { id:'OT-4587', title:'Inspección Inversor 3', inst:'Planta Industrial Norte', status:'En progreso', sla:'4 h' },
      { id:'OT-4584', title:'Fallo de aislamiento',  inst:'Planta Industrial Norte', status:'Asignada',   sla:'1 h' },
    ],
  },
  {
    id: 'TEC-002', name: 'María López',  initials: 'ML', role: 'Técnico Electricista', esp: ['Eléctrica', 'Medidores'], zona: 'Centro',
    status: 'Disponible', load: 30, rating: 4.6, ordenes: 3, completadas: 142, sla: '98%', disponible: 'Ahora',
    cert: ['SEP Electricista', 'ABB Certified'], contacto: '+52 55 9876-5432', email: 'm.lopez@soleim.mx',
    tasks: [
      { id:'OT-4590', title:'Temp. inversor 3',      inst:'Planta Logística Sur', status:'Asignada', sla:'3 h' },
    ],
  },
  {
    id: 'TEC-003', name: 'Carlos Ruiz',  initials: 'CR', role: 'Técnico Mecánico',    esp: ['Mecánica', 'Estructuras'], zona: 'Sur',
    status: 'Disponible', load: 60, rating: 4.5, ordenes: 6, completadas: 98, sla: '94%', disponible: 'Ahora',
    cert: ['PV Maintenance', 'IMSS'], contacto: '+52 33 2345-6789', email: 'c.ruiz@soleim.mx',
    tasks: [
      { id:'OT-4591', title:'Producción baja',       inst:'Sucursal Costa', status:'En progreso', sla:'6 h' },
    ],
  },
  {
    id: 'TEC-004', name: 'Ana Torres',   initials: 'AT', role: 'Técnico Junior', esp: ['Eléctrica', 'Solar FV'], zona: 'Centro',
    status: 'Disponible', load: 20, rating: 4.3, ordenes: 2, completadas: 54, sla: '97%', disponible: 'Ahora',
    cert: ['PV Install'], contacto: '+52 55 3456-7890', email: 'a.torres@soleim.mx',
    tasks: [],
  },
  {
    id: 'TEC-005', name: 'Luis Vega',    initials: 'LV', role: 'Técnico Senior', esp: ['Solar FV', 'Baterías', 'HV'], zona: 'Costa',
    status: 'En tarea', load: 90, rating: 4.9, ordenes: 9, completadas: 231, sla: '98%', disponible: 'Mañana 14:00',
    cert: ['PV Install', 'Tesla Energy', 'HV Safety'], contacto: '+52 998 4567-8901', email: 'l.vega@soleim.mx',
    tasks: [
      { id:'OT-4584', title:'Fallo de aislamiento',  inst:'Planta Industrial Norte', status:'En progreso', sla:'1 h' },
    ],
  },
  {
    id: 'TEC-006', name: 'Laura Gómez',  initials: 'LG', role: 'Supervisora de campo', esp: ['Supervisión', 'Solar FV', 'Baterías'], zona: 'Norte',
    status: 'Disponible', load: 45, rating: 4.7, ordenes: 4, completadas: 312, sla: '99%', disponible: 'Ahora',
    cert: ['PV Advanced', 'Safety Manager', 'Fronius'], contacto: '+52 81 5678-9012', email: 'l.gomez@soleim.mx',
    tasks: [
      { id:'OT-4588', title:'Supervisión mant. preventivo', inst:'Planta Industrial Norte', status:'Asignada', sla:'8 h' },
    ],
  },
];

const zonas = ['Norte', 'Centro', 'Sur', 'Costa'];
const mapColors = { Norte: '#1d4ed8', Centro: '#059669', Sur: '#d97706', Costa: '#7c3aed' };

// ---- Load bar ----
function LoadBar({ pct }) {
  const color = pct < 50 ? 'var(--c-green)' : pct < 75 ? 'var(--c-amber)' : 'var(--c-red)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:6, background:'var(--gray-200)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:3, transition:'width .3s' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:28, textAlign:'right' }}>{pct}%</span>
    </div>
  );
}

// ---- Stars ----
function Stars({ rating }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.floor(rating) ? '#f59e0b' : '#e2e8f0'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize:11, fontWeight:600, color:'var(--gray-700)', marginLeft:2 }}>{rating}</span>
    </div>
  );
}

// ---- Technician card ----
function TecCard({ tec, selected, onSelect }) {
  const isAvail = tec.status === 'Disponible';
  return (
    <div
      onClick={() => onSelect(tec)}
      style={{
        background:'#fff',
        border:`1px solid ${selected ? 'var(--c-blue)' : 'var(--gray-200)'}`,
        borderRadius:12,
        padding:'16px',
        cursor:'pointer',
        boxShadow: selected ? '0 0 0 2px var(--c-blue-mid)' : 'var(--shadow-sm)',
        transition:'all .12s',
      }}
    >
      {/* Avatar + name */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg, ${mapColors[tec.zona]}, ${mapColors[tec.zona]}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', flexShrink:0 }}>{tec.initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--gray-900)' }}>{tec.name}</div>
          <div style={{ fontSize:11, color:'var(--gray-500)' }}>{tec.role}</div>
        </div>
        <span className={`badge ${isAvail ? 'badge-online' : 'badge-warn'}`} style={{ fontSize:10 }}>● {tec.status}</span>
      </div>

      {/* Specialties */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
        {tec.esp.map(e => <span key={e} className="badge badge-info" style={{ fontSize:10 }}>{e}</span>)}
        <span className="badge badge-gray" style={{ fontSize:10 }}>📍 {tec.zona}</span>
      </div>

      {/* Load */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--gray-500)', marginBottom:4 }}>
          <span>Carga de trabajo</span>
          <span>{tec.ordenes} órdenes activas</span>
        </div>
        <LoadBar pct={tec.load} />
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, borderTop:'1px solid var(--gray-100)', paddingTop:10 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--gray-900)' }}>{tec.ordenes}</div>
          <div style={{ fontSize:10, color:'var(--gray-500)' }}>Activas</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--gray-900)' }}>{tec.completadas}</div>
          <div style={{ fontSize:10, color:'var(--gray-500)' }}>Completadas</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--c-green)' }}>{tec.sla}</div>
          <div style={{ fontSize:10, color:'var(--gray-500)' }}>SLA</div>
        </div>
      </div>
    </div>
  );
}

// ---- Detail panel ----
function TecDetailPanel({ tec, onClose, onNavigate }) {
  const [tab, setTab] = React.useState('perfil');
  const isAvail = tec.status === 'Disponible';

  return (
    <div style={{ position:'fixed', top:56, right:0, bottom:0, width:380, background:'#fff', borderLeft:'1px solid var(--gray-200)', zIndex:200, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'var(--shadow-lg)' }}>
      {/* Header */}
      <div style={{ padding:'16px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg, ${mapColors[tec.zona]}, ${mapColors[tec.zona]}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', flexShrink:0 }}>{tec.initials}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15, color:'var(--gray-900)', marginBottom:2 }}>{tec.name}</div>
          <div style={{ fontSize:12, color:'var(--gray-500)', marginBottom:4 }}>{tec.role} · Zona {tec.zona}</div>
          <Stars rating={tec.rating} />
        </div>
        <button className="btn btn-icon btn-secondary" onClick={onClose}><Icons.x /></button>
      </div>

      {/* Status */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--gray-200)', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <span className={`badge ${isAvail ? 'badge-online' : 'badge-warn'}`}>● {tec.status}</span>
        <div style={{ fontSize:12, color:'var(--gray-600)' }}>Disponible: <strong>{tec.disponible}</strong></div>
        <div style={{ fontSize:12, color:'var(--gray-600)', marginLeft:'auto' }}>Carga: <strong style={{ color: tec.load >= 75 ? 'var(--c-red)' : 'var(--c-amber)' }}>{tec.load}%</strong></div>
      </div>

      {/* Actions */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--gray-200)', display:'flex', gap:6 }}>
        <button className="btn btn-primary btn-sm">Asignar orden</button>
        <button className="btn btn-secondary btn-sm">Enviar mensaje</button>
        <button className="btn btn-secondary btn-sm">Ver agenda</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--gray-200)', padding:'0 16px' }}>
        {['perfil','ordenes','historial'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 10px', fontSize:12, fontWeight:tab===t ? 600 : 400, color:tab===t ? 'var(--c-blue)' : 'var(--gray-500)', background:'none', border:'none', borderBottom:tab===t ? '2px solid var(--c-blue)' : '2px solid transparent', cursor:'pointer', whiteSpace:'nowrap', textTransform:'capitalize' }}>
            {t === 'ordenes' ? `Órdenes (${tec.tasks.length})` : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>
        {tab === 'perfil' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Contact */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-500)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Contacto</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', gap:8, fontSize:13 }}><span style={{ color:'var(--c-blue)' }}>📞</span><span>{tec.contacto}</span></div>
                <div style={{ display:'flex', gap:8, fontSize:13 }}><span style={{ color:'var(--c-blue)' }}>✉</span><span>{tec.email}</span></div>
              </div>
            </div>
            {/* Stats */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-500)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Rendimiento</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[['Órdenes activas', tec.ordenes],['Órdenes completadas', tec.completadas],['Cumplimiento SLA', tec.sla],['Calificación', `${tec.rating} / 5`],['Especialidades', tec.esp.length],['Zona asignada', tec.zona]].map(([k,v]) => (
                  <div key={k} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:'var(--gray-500)', marginBottom:2 }}>{k}</div>
                    <div style={{ fontWeight:700, fontSize:14, color:'var(--gray-900)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Certifications */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-500)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Certificaciones</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {tec.cert.map(c => <span key={c} className="badge badge-purple" style={{ fontSize:11 }}>🎓 {c}</span>)}
              </div>
            </div>
            {/* Load bar */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-500)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' }}>Carga de trabajo</div>
              <LoadBar pct={tec.load} />
            </div>
          </div>
        )}

        {tab === 'ordenes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {tec.tasks.length === 0 ? (
              <div className="empty-state"><Icons.clipboard /><p>Sin órdenes activas</p></div>
            ) : tec.tasks.map(t => (
              <div key={t.id} style={{ border:'1px solid var(--gray-200)', borderRadius:8, padding:'10px 12px', cursor:'pointer' }}
                   onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
                   onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
                   onClick={() => onNavigate('ordenes')}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--gray-500)' }}>{t.id}</span>
                  <WOBadge status={t.status} />
                </div>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{t.title}</div>
                <div style={{ fontSize:11, color:'var(--gray-500)' }}>{t.inst}</div>
                <div style={{ fontSize:11, color:'var(--c-amber)', marginTop:4 }}>⏱ SLA: {t.sla}</div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center', marginTop:4 }}>Ver historial completo</button>
          </div>
        )}

        {tab === 'historial' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['OT-4571','Oscilación de frecuencia','Planta Logística Sur','Completada','23 abr 2025'],['OT-4560','Mantenimiento preventivo','Centro Comercial Solar','Completada','21 abr 2025'],['OT-4548','Limpieza de módulos','Planta Industrial Norte','Completada','18 abr 2025']].map(([id,title,inst,status,date]) => (
              <div key={id} style={{ border:'1px solid var(--gray-200)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--gray-500)' }}>{id}</span>
                  <WOBadge status={status} />
                </div>
                <div style={{ fontWeight:600, fontSize:12, marginBottom:2 }}>{title}</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--gray-500)' }}><span>{inst}</span><span>{date}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main page ----
function Tecnicos({ onNav }) {
  const [selected, setSelected] = React.useState(null);
  const [filterZona, setFilterZona] = React.useState('Todas');
  const [filterStatus, setFilterStatus] = React.useState('Todos');
  const [filterEsp, setFilterEsp] = React.useState('Todas');

  const filtered = tecnicos.filter(t =>
    (filterZona === 'Todas' || t.zona === filterZona) &&
    (filterStatus === 'Todos' || t.status === filterStatus) &&
    (filterEsp === 'Todas' || t.esp.includes(filterEsp))
  );

  const avail = tecnicos.filter(t => t.status === 'Disponible').length;
  const busy  = tecnicos.filter(t => t.status === 'En tarea').length;
  const avgLoad = Math.round(tecnicos.reduce((s,t) => s+t.load, 0) / tecnicos.length);
  const avgSLA  = '97%';

  return (
    <div className="page-content" style={{ paddingRight: selected ? 396 : 'var(--content-pad)' }}>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
        <MetricCard icon={<Icons.users />}    iconBg="var(--c-blue-light)"   iconColor="var(--c-blue)"   label="Técnicos totales"      value={String(tecnicos.length)} delta="+1 vs. mes anterior" deltaDir="up" />
        <MetricCard icon={<Icons.check />}    iconBg="var(--c-green-light)"  iconColor="var(--c-green)"  label="Disponibles ahora"     value={String(avail)}          delta="de 6 totales"         deltaDir="neutral" />
        <MetricCard icon={<Icons.wrench />}   iconBg="var(--c-amber-light)"  iconColor="var(--c-amber)"  label="En tarea ahora"        value={String(busy)}           delta="con órdenes activas"  deltaDir="neutral" />
        <MetricCard icon={<Icons.activity />} iconBg="var(--c-purple-light)" iconColor="var(--c-purple)" label="Carga promedio"        value={`${avgLoad}%`}          delta="-5% vs. ayer"        deltaDir="up" />
        <MetricCard icon={<Icons.shield />}   iconBg="var(--c-teal-light)"   iconColor="var(--c-teal)"   label="SLA promedio técnicos" value={avgSLA}                 delta="+1% vs. mes anterior" deltaDir="up" />
      </div>

      {/* Zone map placeholder + Workload overview */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Cobertura por zona <span className="info-icon"><Icons.info /></span></span></div>
          {/* Stylized zone visualization */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {zonas.map(zona => {
              const tecs = tecnicos.filter(t => t.zona === zona);
              const avls = tecs.filter(t => t.status === 'Disponible').length;
              return (
                <div key={zona} style={{ border:`2px solid ${mapColors[zona]}33`, borderRadius:10, padding:'12px 14px', background:`${mapColors[zona]}08` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:mapColors[zona] }}/>
                    <span style={{ fontWeight:700, fontSize:13, color:'var(--gray-800)' }}>Zona {zona}</span>
                    <span className={`badge ${avls > 0 ? 'badge-online' : 'badge-warn'}`} style={{ fontSize:10, marginLeft:'auto' }}>{avls} disponible{avls!==1?'s':''}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {tecs.map(t => (
                      <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:24, height:24, borderRadius:'50%', background:`${mapColors[zona]}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:mapColors[zona] }}>{t.initials}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                          <div style={{ fontSize:10, color:'var(--gray-500)' }}>{t.role.split(' ').slice(0,2).join(' ')}</div>
                        </div>
                        <div style={{ width:40, height:4, background:'var(--gray-200)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:`${t.load}%`, height:'100%', background:t.load>=75?'var(--c-red)':t.load>=50?'var(--c-amber)':'var(--c-green)' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Carga de trabajo por técnico <span className="info-icon"><Icons.info /></span></span></div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {tecnicos.sort((a,b) => b.load - a.load).map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setSelected(t)}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${mapColors[t.zona]},${mapColors[t.zona]}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{t.initials}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>{t.name}</span>
                    <span className={`badge ${t.status==='Disponible' ? 'badge-online' : 'badge-warn'}`} style={{ fontSize:9 }}>● {t.status}</span>
                  </div>
                  <LoadBar pct={t.load} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Cards */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:10, flexWrap:'wrap' }}>
        <div className="filter-select">
          <div className="filter-label">Zona</div>
          <select className="header-select" value={filterZona} onChange={e => setFilterZona(e.target.value)}>
            {['Todas',...zonas].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="filter-select">
          <div className="filter-label">Disponibilidad</div>
          <select className="header-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['Todos','Disponible','En tarea'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="filter-select">
          <div className="filter-label">Especialidad</div>
          <select className="header-select" value={filterEsp} onChange={e => setFilterEsp(e.target.value)}>
            {['Todas','Solar FV','Eléctrica','Mecánica','Baterías','Supervisión'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <button className="btn btn-primary btn-sm"><Icons.plus />Nuevo técnico</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:12 }}>
        {filtered.map(t => (
          <TecCard key={t.id} tec={t} selected={selected?.id === t.id} onSelect={setSelected} />
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn:'1/-1' }}>
            <Icons.users /><p>No se encontraron técnicos con los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && <TecDetailPanel tec={selected} onClose={() => setSelected(null)} onNavigate={onNav} />}
    </div>
  );
}

window.Tecnicos = Tecnicos;
