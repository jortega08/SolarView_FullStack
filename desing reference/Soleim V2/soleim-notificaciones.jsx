/* ===== SOLEIM — Notificaciones ===== */

// ---- Mock data ----
const allNotifs = [
  { id:1,  type:'alert',   cat:'Alerta',        read:false, time:'Hace 5 min',  title:'Alerta crítica – Planta Industrial Norte',    body:'Sobretemperatura en Inversor 3. Temperatura: 78°C (Límite: 75°C). Se requiere atención inmediata.',    link:'alertas',   linkLabel:'Ver alerta' },
  { id:2,  type:'warn',    cat:'SLA',            read:false, time:'Hace 15 min', title:'SLA en riesgo – OT-4587',                      body:'La orden de trabajo tiene 55 minutos restantes antes del vencimiento del SLA.',                           link:'ordenes',   linkLabel:'Ver orden' },
  { id:3,  type:'info',    cat:'Orden',          read:false, time:'Hace 35 min', title:'Orden #OT-4590 asignada a María López',        body:'Se asignó la orden de trabajo de revisión de temperatura en Planta Logística Sur.',                        link:'ordenes',   linkLabel:'Ver orden' },
  { id:4,  type:'warn',    cat:'Alerta',          read:false, time:'Hace 42 min', title:'Fallo de comunicación – Oficinas Corporativas','body':'Pérdida de señal en Medidor B. Último dato recibido hace 42 minutos.',                                   link:'telemetria',linkLabel:'Ver telemetría' },
  { id:5,  type:'success', cat:'Mantenimiento',  read:true,  time:'Hace 1 h',    title:'Mantenimiento preventivo completado',          body:'Se completó el mantenimiento preventivo en Centro Comercial Solar. Todos los sistemas funcionan normalmente.', link:'mantenimiento', linkLabel:'Ver detalle' },
  { id:6,  type:'info',    cat:'Reporte',        read:true,  time:'Hace 2 h',    title:'Reporte mensual generado',                    body:'El reporte de generación de abril 2025 está listo para descargar.',                                          link:'reportes',  linkLabel:'Descargar' },
  { id:7,  type:'alert',   cat:'Alerta',          read:true,  time:'Hace 3 h',    title:'Alerta resuelta – Sucursal Costa',             body:'El técnico Carlos Ruiz resolvió el problema de producción baja. SLA cumplido.',                             link:'alertas',   linkLabel:'Ver alerta' },
  { id:8,  type:'info',    cat:'Sistema',        read:true,  time:'Hace 4 h',    title:'Actualización del sistema completada',         body:'SOLEIM v2.4.1 instalada correctamente. Mejoras en rendimiento de telemetría.',                               link:null,        linkLabel:null },
  { id:9,  type:'success', cat:'Orden',          read:true,  time:'Hace 5 h',    title:'Orden #OT-4578 cerrada',                      body:'Ana Torres cerró la orden de limpieza de módulos en Centro Comercial Solar.',                               link:'ordenes',   linkLabel:'Ver orden' },
  { id:10, type:'warn',    cat:'SLA',            read:true,  time:'Hace 6 h',    title:'SLA cumplido a tiempo – OT-4571',              body:'La orden de revisión de frecuencia en Planta Logística Sur fue completada dentro del SLA.',                 link:'ordenes',   linkLabel:'Ver orden' },
  { id:11, type:'info',    cat:'Sistema',        read:true,  time:'Ayer',        title:'Respaldo automático completado',               body:'Todos los datos han sido respaldados correctamente en la nube.',                                             link:null,        linkLabel:null },
  { id:12, type:'success', cat:'Reporte',        read:true,  time:'Ayer',        title:'Reporte de SLA de semana enviado',             body:'El reporte semanal fue enviado a 5 destinatarios configurados.',                                            link:'reportes',  linkLabel:'Ver reportes' },
];

const cats = ['Todas', 'Alerta', 'SLA', 'Orden', 'Mantenimiento', 'Reporte', 'Sistema'];

// ---- Notif icon ----
function NIcon({ type, size = 32 }) {
  const map = {
    alert:   { bg:'var(--c-red-light)',    color:'var(--c-red)',    icon:'⚠' },
    warn:    { bg:'var(--c-orange-light)', color:'var(--c-orange)', icon:'⚡' },
    info:    { bg:'var(--c-blue-light)',   color:'var(--c-blue)',   icon:'ℹ' },
    success: { bg:'var(--c-green-light)',  color:'var(--c-green)',  icon:'✓' },
  };
  const { bg, color, icon } = map[type] || map.info;
  return <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.44, fontWeight:700, flexShrink:0 }}>{icon}</div>;
}

// ---- Main page ----
function Notificaciones({ onNav }) {
  const [notifs, setNotifs] = React.useState(allNotifs);
  const [filter, setFilter] = React.useState('Todas');
  const [onlyUnread, setOnlyUnread] = React.useState(false);
  const [selected, setSelected] = React.useState(null);

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n =>
    (filter === 'Todas' || n.cat === filter) &&
    (!onlyUnread || !n.read)
  );

  const markAllRead = () => setNotifs(ns => ns.map(n => ({...n, read:true})));
  const markRead = (id) => setNotifs(ns => ns.map(n => n.id === id ? {...n, read:true} : n));
  const deleteNotif = (id) => {
    setNotifs(ns => ns.filter(n => n.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleSelect = (n) => {
    markRead(n.id);
    setSelected(n);
  };

  // Group by time
  const grouped = [
    { label: 'Hoy', items: filtered.filter(n => n.time.includes('min') || n.time.includes('h') || n.time === 'Hace 1 h') },
    { label: 'Ayer', items: filtered.filter(n => n.time === 'Ayer') },
  ].filter(g => g.items.length > 0);

  return (
    <div className="page-content">
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {[
          { icon:<Icons.bell />,    bg:'var(--c-blue-light)',   color:'var(--c-blue)',   label:'Total notificaciones', value:String(notifs.length) },
          { icon:<Icons.alert />,   bg:'var(--c-red-light)',    color:'var(--c-red)',    label:'Sin leer',             value:String(unreadCount) },
          { icon:<Icons.alert />,   bg:'var(--c-orange-light)', color:'var(--c-orange)', label:'Alertas críticas',     value:String(notifs.filter(n=>n.type==='alert'&&!n.read).length) },
          { icon:<Icons.check />,   bg:'var(--c-green-light)',  color:'var(--c-green)',  label:'Leídas hoy',           value:String(notifs.filter(n=>n.read).length) },
        ].map(k => <MetricCard key={k.label} icon={k.icon} iconBg={k.bg} iconColor={k.color} label={k.label} value={k.value} />)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'var(--gap-md)' }}>
        {/* Notification list */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:2, background:'var(--gray-100)', borderRadius:8, padding:2 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setFilter(c)} style={{ padding:'5px 10px', fontSize:11, fontWeight:filter===c ? 600 : 400, color:filter===c ? '#fff' : 'var(--gray-600)', background:filter===c ? 'var(--c-blue)' : 'transparent', border:'none', borderRadius:6, cursor:'pointer', whiteSpace:'nowrap', transition:'all .12s' }}>
                  {c}
                </button>
              ))}
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--gray-600)', cursor:'pointer', marginLeft:'auto' }}>
              <input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} style={{ accentColor:'var(--c-blue)' }} />
              Solo sin leer
            </label>
            {unreadCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Marcar todas como leídas</button>
            )}
          </div>

          {/* Groups */}
          <div style={{ maxHeight:'calc(100vh - 360px)', overflowY:'auto' }}>
            {grouped.length === 0 ? (
              <div className="empty-state"><Icons.bell /><p>No hay notificaciones con estos filtros.</p></div>
            ) : grouped.map(g => (
              <div key={g.label}>
                <div style={{ padding:'8px 16px', fontSize:11, fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'.5px', background:'var(--gray-50)', borderBottom:'1px solid var(--gray-100)' }}>{g.label}</div>
                {g.items.map(n => (
                  <div key={n.id}
                    onClick={() => handleSelect(n)}
                    style={{ display:'flex', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--gray-100)', cursor:'pointer', background: selected?.id===n.id ? 'var(--c-blue-light)' : n.read ? '#fff' : 'var(--gray-50)', transition:'background .1s' }}
                    onMouseEnter={e => { if(selected?.id!==n.id) e.currentTarget.style.background='var(--gray-50)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = selected?.id===n.id ? 'var(--c-blue-light)' : n.read ? '#fff' : 'var(--gray-50)'; }}
                  >
                    <NIcon type={n.type} size={36} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:3 }}>
                        <div style={{ fontWeight: n.read ? 500 : 700, fontSize:13, color:'var(--gray-900)', paddingRight:8 }}>{n.title}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                          {!n.read && <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--c-blue)', display:'inline-block' }}/>}
                          <span style={{ fontSize:11, color:'var(--gray-400)', whiteSpace:'nowrap' }}>{n.time}</span>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray-500)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.body}</div>
                      <div style={{ display:'flex', gap:6, marginTop:5 }}>
                        <span className={`badge ${n.type==='alert' ? 'badge-alert' : n.type==='warn' ? 'badge-warn' : n.type==='success' ? 'badge-online' : 'badge-info'}`} style={{ fontSize:10 }}>{n.cat}</span>
                      </div>
                    </div>
                    <button className="btn btn-icon" style={{ background:'transparent', color:'var(--gray-300)', flexShrink:0, alignSelf:'flex-start' }}
                      onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                      onMouseEnter={e => { e.currentTarget.style.color='var(--c-red)'; e.currentTarget.style.background='var(--c-red-light)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color='var(--gray-300)'; e.currentTarget.style.background='transparent'; }}>
                      <Icons.x />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="card" style={{ padding:0, overflow:'hidden', height:'fit-content' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'center', gap:10 }}>
              <NIcon type={selected.type} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--gray-900)', lineHeight:1.3 }}>{selected.title}</div>
                <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:3 }}>{selected.time}</div>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setSelected(null)}><Icons.x /></button>
            </div>
            <div style={{ padding:'16px' }}>
              <div style={{ fontSize:13, color:'var(--gray-700)', lineHeight:1.6, marginBottom:14 }}>{selected.body}</div>
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                <span className={`badge ${selected.type==='alert' ? 'badge-alert' : selected.type==='warn' ? 'badge-warn' : selected.type==='success' ? 'badge-online' : 'badge-info'}`}>{selected.cat}</span>
                <span className="badge badge-gray" style={{ fontSize:10 }}>{selected.read ? '✓ Leída' : '● Sin leer'}</span>
              </div>
              {selected.link && (
                <button className="btn btn-primary btn-sm" style={{ gap:6 }} onClick={() => onNav(selected.link)}>
                  {selected.linkLabel} →
                </button>
              )}
              <div className="divider" style={{ margin:'14px 0' }}/>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => markRead(selected.id)}>Marcar leída</button>
                <button className="btn btn-secondary btn-sm" style={{ color:'var(--c-red)' }} onClick={() => deleteNotif(selected.id)}>Eliminar</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:10, color:'var(--gray-400)', minHeight:200 }}>
            <Icons.bell />
            <p style={{ fontSize:13 }}>Selecciona una notificación para ver el detalle</p>
          </div>
        )}
      </div>

      {/* Preferences section */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Preferencias de notificaciones</span>
          <button className="btn btn-primary btn-sm"><Icons.check />Guardar cambios</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            { label:'Alertas críticas', desc:'Notificaciones inmediatas para alertas de severidad crítica', email:true, push:true, sms:true },
            { label:'Órdenes de trabajo', desc:'Asignaciones, actualizaciones y vencimiento de SLA', email:true, push:true, sms:false },
            { label:'Mantenimientos', desc:'Recordatorios de mantenimientos programados próximos', email:true, push:false, sms:false },
            { label:'Reportes generados', desc:'Notificación cuando un reporte esté listo para descarga', email:true, push:false, sms:false },
            { label:'Actualizaciones del sistema', desc:'Nuevas versiones, cambios y mejoras de la plataforma', email:false, push:true, sms:false },
            { label:'Resumen diario', desc:'Resumen del estado de instalaciones al final del día', email:true, push:false, sms:false },
          ].map(pref => (
            <div key={pref.label} style={{ border:'1px solid var(--gray-200)', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:3 }}>{pref.label}</div>
              <div style={{ fontSize:11, color:'var(--gray-500)', marginBottom:10, lineHeight:1.4 }}>{pref.desc}</div>
              <div style={{ display:'flex', gap:10 }}>
                {[['✉ Email', pref.email],['🔔 Push', pref.push],['📱 SMS', pref.sms]].map(([label, active]) => (
                  <label key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--gray-600)', cursor:'pointer' }}>
                    <input type="checkbox" defaultChecked={active} style={{ accentColor:'var(--c-blue)' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Notificaciones = Notificaciones;
