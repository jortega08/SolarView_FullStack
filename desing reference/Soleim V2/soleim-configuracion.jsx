/* ===== SOLEIM — Configuración ===== */

// ---- Toggle switch ----
function Toggle({ checked, onChange, label, desc, disabled }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'12px 0', borderBottom:'1px solid var(--gray-100)' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color: disabled ? 'var(--gray-400)' : 'var(--gray-800)', marginBottom:2 }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'var(--gray-500)', lineHeight:1.4 }}>{desc}</div>}
      </div>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{ width:40, height:22, borderRadius:11, background: checked ? 'var(--c-blue)' : 'var(--gray-300)', cursor: disabled ? 'not-allowed' : 'pointer', flexShrink:0, position:'relative', transition:'background .2s', opacity: disabled ? .5 : 1 }}
      >
        <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: checked ? 20 : 2, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
      </div>
    </div>
  );
}

// ---- Input field ----
function SettingInput({ label, value, onChange, type='text', unit, desc }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--gray-800)', marginBottom:2 }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'var(--gray-500)' }}>{desc}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          style={{ width:120, height:32, padding:'0 10px', border:'1px solid var(--gray-200)', borderRadius:6, fontSize:13, fontFamily:'var(--font-base)', outline:'none', textAlign: type==='number' ? 'right' : 'left', fontVariantNumeric:'tabular-nums' }} />
        {unit && <span style={{ fontSize:12, color:'var(--gray-500)' }}>{unit}</span>}
      </div>
    </div>
  );
}

// ---- Section card ----
function SettingSection({ title, icon, children }) {
  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom:4 }}>
        <span className="card-title" style={{ gap:8 }}><span style={{ fontSize:18 }}>{icon}</span>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ---- Main page ----
function Configuracion() {
  const [activeTab, setActiveTab] = React.useState('general');
  const [saved, setSaved] = React.useState(false);

  // State for toggles/inputs
  const [cfg, setCfg] = React.useState({
    tema: 'Claro', idioma: 'Español (México)', zona: 'America/Monterrey', dateFormat: 'DD/MM/YYYY',
    autoRefresh: true, refreshInterval: 30, liveAlerts: true, soundAlerts: false,
    emailAlerts: true, smsAlerts: false, pushAlerts: true, escalation: true, escalationMin: 60,
    slaDefault: 8, slaRisk: 80, slaCritical: 95,
    apiKey: 'sk-soleim-live-••••••••••••••••', webhookUrl: 'https://erp.empresa.mx/webhook/soleim',
    apiEnabled: true, webhookEnabled: true,
    backupAuto: true, backupFreq: 'Diario', retention: 30,
    twoFA: true, sessionTimeout: 60, auditLog: true, ipWhitelist: false,
    units: 'SI (kW, MWh)', currency: 'MXN', timezone: 'UTC-6',
  });

  const set = (key, val) => setCfg(c => ({...c, [key]:val}));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id:'general',        label:'General',          icon:'⚙' },
    { id:'alertas',        label:'Alertas y SLA',    icon:'⚠' },
    { id:'integraciones',  label:'Integraciones',    icon:'🔗' },
    { id:'seguridad',      label:'Seguridad',        icon:'🔒' },
    { id:'datos',          label:'Datos y respaldo',  icon:'💾' },
    { id:'empresa',        label:'Empresa',          icon:'🏢' },
    { id:'usuarios',       label:'Usuarios y roles', icon:'👤' },
  ];

  const users = [
    { name:'Carlos Méndez',  email:'c.mendez@empresa.mx',  role:'Administrador', status:'Activo',   lastLogin:'Hoy 09:14',    initials:'CM' },
    { name:'Laura Gómez',    email:'l.gomez@empresa.mx',   role:'Supervisor',    status:'Activo',   lastLogin:'Ayer 17:32',   initials:'LG' },
    { name:'Juan Pérez',     email:'j.perez@empresa.mx',   role:'Técnico',       status:'Activo',   lastLogin:'Hoy 08:50',    initials:'JP' },
    { name:'María López',    email:'m.lopez@empresa.mx',   role:'Técnico',       status:'Activo',   lastLogin:'Hoy 08:05',    initials:'ML' },
    { name:'Roberto Sáenz',  email:'r.saenz@empresa.mx',   role:'Lector',        status:'Inactivo', lastLogin:'Hace 15 días', initials:'RS' },
  ];

  const integrations = [
    { name:'ERP Empresarial',  icon:'🏢', status:'Conectado',    desc:'Sincronización de costos y facturas',   color:'var(--c-green)' },
    { name:'Clima (OpenMet)', icon:'🌤', status:'Conectado',    desc:'Pronóstico e irradiancia solar',          color:'var(--c-green)' },
    { name:'SCADA Modbus',    icon:'📡', status:'Conectado',    desc:'Telemetría de inversores y medidores',   color:'var(--c-green)' },
    { name:'Slack',            icon:'💬', status:'Desconectado', desc:'Notificaciones de alertas a canal',      color:'var(--gray-400)' },
    { name:'Power BI',         icon:'📊', status:'Desconectado', desc:'Exportación de datos para análisis',     color:'var(--gray-400)' },
    { name:'WhatsApp Business',icon:'📱', status:'Desconectado', desc:'Alertas críticas por WhatsApp',          color:'var(--gray-400)' },
  ];

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Settings sidebar */}
      <div style={{ width:200, minWidth:200, borderRight:'1px solid var(--gray-200)', padding:'16px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto', background:'var(--gray-50)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer', background: activeTab===t.id ? 'var(--c-blue)' : 'transparent', color: activeTab===t.id ? '#fff' : 'var(--gray-600)', border:'none', fontSize:13, fontWeight: activeTab===t.id ? 600 : 400, fontFamily:'var(--font-base)', textAlign:'left', width:'100%', transition:'all .12s' }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>{t.label}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ padding:'8px 10px', fontSize:11, color:'var(--gray-400)' }}>SOLEIM v2.4.1</div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:'var(--content-pad)', display:'flex', flexDirection:'column', gap:'var(--gap-md)' }}>

        {/* Save bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--gray-900)' }}>{tabs.find(t=>t.id===activeTab)?.icon} {tabs.find(t=>t.id===activeTab)?.label}</div>
            <div style={{ fontSize:12, color:'var(--gray-500)' }}>Gestiona la configuración de la plataforma</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {saved && <span style={{ fontSize:12, color:'var(--c-green)', fontWeight:600 }}>✓ Cambios guardados</span>}
            <button className="btn btn-secondary btn-sm">Restablecer</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}><Icons.check />Guardar cambios</button>
          </div>
        </div>

        {activeTab === 'general' && (<>
          <SettingSection title="Apariencia y región" icon="🎨">
            {[['Tema', 'tema', ['Claro','Oscuro','Sistema']],['Idioma', 'idioma', ['Español (México)','Español (España)','English']],['Zona horaria', 'zona', ['America/Monterrey','America/Mexico_City','UTC']],['Formato de fecha', 'dateFormat', ['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD']]].map(([label, key, opts]) => (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--gray-800)' }}>{label}</span>
                <select className="header-select" value={cfg[key]} onChange={e => set(key, e.target.value)}><option>{cfg[key]}</option>{opts.filter(o=>o!==cfg[key]).map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
          </SettingSection>
          <SettingSection title="Actualización de datos" icon="🔄">
            <Toggle label="Actualización automática" desc="Refresca los datos del dashboard automáticamente" checked={cfg.autoRefresh} onChange={v => set('autoRefresh', v)} />
            <SettingInput label="Intervalo de actualización" value={cfg.refreshInterval} onChange={v => set('refreshInterval', v)} type="number" unit="segundos" desc="Tiempo entre cada actualización (mínimo 10s)" />
            <Toggle label="Alertas en tiempo real" desc="Recibe alertas inmediatas sin necesidad de refrescar" checked={cfg.liveAlerts} onChange={v => set('liveAlerts', v)} />
            <Toggle label="Sonido de alertas" desc="Reproducir sonido al recibir alertas críticas" checked={cfg.soundAlerts} onChange={v => set('soundAlerts', v)} />
          </SettingSection>
        </>)}

        {activeTab === 'alertas' && (<>
          <SettingSection title="Canales de notificación" icon="🔔">
            <Toggle label="Alertas por correo electrónico" desc="Enviar alertas críticas al correo del usuario" checked={cfg.emailAlerts} onChange={v => set('emailAlerts', v)} />
            <Toggle label="Notificaciones push" desc="Notificaciones en el navegador y aplicación móvil" checked={cfg.pushAlerts} onChange={v => set('pushAlerts', v)} />
            <Toggle label="Alertas por SMS" desc="Mensajes de texto para alertas de máxima severidad" checked={cfg.smsAlerts} onChange={v => set('smsAlerts', v)} />
            <Toggle label="Escalación automática" desc="Escalar alertas no atendidas al supervisor después del tiempo configurado" checked={cfg.escalation} onChange={v => set('escalation', v)} />
            <SettingInput label="Tiempo de escalación" value={cfg.escalationMin} onChange={v => set('escalationMin', v)} type="number" unit="minutos" desc="Tiempo sin respuesta antes de escalar" />
          </SettingSection>
          <SettingSection title="Umbrales de SLA" icon="🛡">
            <SettingInput label="SLA predeterminado" value={cfg.slaDefault} onChange={v => set('slaDefault', v)} type="number" unit="horas" desc="Tiempo de respuesta objetivo para nuevas órdenes" />
            <SettingInput label="Umbral de riesgo SLA" value={cfg.slaRisk} onChange={v => set('slaRisk', v)} type="number" unit="%" desc="Porcentaje del SLA consumido para marcar como 'en riesgo'" />
            <SettingInput label="Meta de cumplimiento SLA" value={cfg.slaCritical} onChange={v => set('slaCritical', v)} type="number" unit="%" desc="Porcentaje mínimo de cumplimiento de SLA objetivo" />
          </SettingSection>
        </>)}

        {activeTab === 'integraciones' && (
          <SettingSection title="Integraciones externas" icon="🔗">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              {integrations.map(int => (
                <div key={int.name} style={{ border:'1px solid var(--gray-200)', borderRadius:10, padding:'14px', display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:22 }}>{int.icon}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{int.name}</div>
                      <span className={`badge ${int.status==='Conectado' ? 'badge-online' : 'badge-gray'}`} style={{ fontSize:10 }}>● {int.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--gray-500)' }}>{int.desc}</div>
                  <button className={`btn btn-sm ${int.status==='Conectado' ? 'btn-secondary' : 'btn-primary'}`} style={{ width:'100%', justifyContent:'center' }}>
                    {int.status==='Conectado' ? 'Configurar' : 'Conectar'}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ borderTop:'1px solid var(--gray-200)', paddingTop:14 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>API y Webhooks</div>
              <Toggle label="API REST habilitada" desc="Permite el acceso externo mediante la API de SOLEIM" checked={cfg.apiEnabled} onChange={v => set('apiEnabled', v)} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <div><div style={{ fontSize:13, fontWeight:500 }}>Clave de API</div><div style={{ fontSize:11, color:'var(--gray-500)' }}>Usa esta clave para autenticarte en la API</div></div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <code style={{ fontFamily:'var(--font-mono)', fontSize:12, background:'var(--gray-100)', padding:'4px 10px', borderRadius:6, color:'var(--gray-700)' }}>{cfg.apiKey}</code>
                  <button className="btn btn-secondary btn-sm">Rotar</button>
                </div>
              </div>
              <Toggle label="Webhook habilitado" checked={cfg.webhookEnabled} onChange={v => set('webhookEnabled', v)} />
              <SettingInput label="URL del webhook" value={cfg.webhookUrl} onChange={v => set('webhookUrl', v)} desc="Endpoint al que se enviarán los eventos de SOLEIM" />
            </div>
          </SettingSection>
        )}

        {activeTab === 'seguridad' && (
          <SettingSection title="Seguridad y acceso" icon="🔒">
            <Toggle label="Autenticación de dos factores (2FA)" desc="Requiere código adicional al iniciar sesión" checked={cfg.twoFA} onChange={v => set('twoFA', v)} />
            <SettingInput label="Tiempo de sesión inactiva" value={cfg.sessionTimeout} onChange={v => set('sessionTimeout', v)} type="number" unit="minutos" desc="Cerrar sesión automáticamente tras inactividad" />
            <Toggle label="Registro de auditoría" desc="Guardar historial completo de acciones de usuarios" checked={cfg.auditLog} onChange={v => set('auditLog', v)} />
            <Toggle label="Lista blanca de IPs" desc="Restringir acceso solo a direcciones IP autorizadas" checked={cfg.ipWhitelist} onChange={v => set('ipWhitelist', v)} />
            <div style={{ marginTop:14, padding:'12px', background:'var(--c-amber-light)', borderRadius:8, fontSize:12, color:'var(--c-amber)', display:'flex', gap:8 }}>
              <span style={{ fontSize:16 }}>⚠</span>
              <span>Cambiar la configuración de seguridad puede afectar el acceso de los usuarios. Revisa cuidadosamente antes de guardar.</span>
            </div>
          </SettingSection>
        )}

        {activeTab === 'datos' && (
          <SettingSection title="Respaldo y retención de datos" icon="💾">
            <Toggle label="Respaldo automático" desc="Realizar respaldo diario de todos los datos de la plataforma" checked={cfg.backupAuto} onChange={v => set('backupAuto', v)} />
            {[['Frecuencia de respaldo', 'backupFreq', ['Diario','Semanal','Mensual']]].map(([label, key, opts]) => (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{label}</span>
                <select className="header-select" value={cfg[key]} onChange={e => set(key, e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
            <SettingInput label="Retención de datos históricos" value={cfg.retention} onChange={v => set('retention', v)} type="number" unit="días" desc="Días de historial de telemetría a conservar" />
            <div style={{ marginTop:14, display:'flex', gap:8 }}>
              <button className="btn btn-secondary btn-sm"><Icons.download />Descargar respaldo</button>
              <button className="btn btn-secondary btn-sm">🗑 Purgar datos antiguos</button>
            </div>
            <div style={{ marginTop:10, background:'var(--gray-50)', borderRadius:8, padding:'12px', fontSize:12, color:'var(--gray-600)' }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>Último respaldo</div>
              <div>📅 Hoy, 03:00 · Tamaño: 2,4 GB · Estado: <span style={{ color:'var(--c-green)', fontWeight:600 }}>Exitoso</span></div>
            </div>
          </SettingSection>
        )}

        {activeTab === 'empresa' && (
          <SettingSection title="Información de la empresa" icon="🏢">
            {[['Nombre de la empresa','Soluciones Fotovoltaicas S.A. de C.V.'],['RFC','SFO200101ABC'],['Dirección','Av. Revolución 1234, Monterrey, NL'],['Teléfono','+52 81 8000-0000'],['Correo de contacto','contacto@solfoto.mx'],['Sitio web','https://solfoto.mx']].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--gray-700)' }}>{label}</span>
                <input defaultValue={val} style={{ width:280, height:32, padding:'0 10px', border:'1px solid var(--gray-200)', borderRadius:6, fontSize:13, fontFamily:'var(--font-base)', outline:'none', textAlign:'right' }} />
              </div>
            ))}
            {[['Unidades del sistema', 'units', ['SI (kW, MWh)','Imperial']],['Moneda', 'currency', ['MXN','USD','EUR']],['Zona horaria', 'timezone', ['UTC-6','UTC-5','UTC']]].map(([label, key, opts]) => (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{label}</span>
                <select className="header-select" value={cfg[key]} onChange={e => set(key, e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
          </SettingSection>
        )}

        {activeTab === 'usuarios' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--gap-md)' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Usuarios del sistema</span>
                <button className="btn btn-primary btn-sm"><Icons.plus />Invitar usuario</button>
              </div>
              <table className="data-table">
                <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.email}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,var(--c-blue),var(--c-purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{u.initials}</div>
                          <span style={{ fontWeight:600, fontSize:13 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize:12 }}>{u.email}</td>
                      <td><span className={`badge ${u.role==='Administrador' ? 'badge-purple' : u.role==='Supervisor' ? 'badge-info' : u.role==='Técnico' ? 'badge-online' : 'badge-gray'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.status==='Activo' ? 'badge-online' : 'badge-gray'}`}>● {u.status}</span></td>
                      <td style={{ fontSize:12, color:'var(--gray-500)' }}>{u.lastLogin}</td>
                      <td><div className="icon-actions">
                        <button className="btn btn-icon btn-secondary"><Icons.edit /></button>
                        <button className="btn btn-icon btn-secondary"><Icons.moreVert /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom:12 }}>Roles y permisos</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[['Administrador','badge-purple','Acceso completo a todas las funciones y configuración.'],['Supervisor','badge-info','Puede ver y gestionar operaciones, pero no configurar el sistema.'],['Técnico','badge-online','Acceso a órdenes de trabajo y telemetría de sus instalaciones asignadas.'],['Lector','badge-gray','Solo lectura. No puede realizar cambios en el sistema.']].map(([role,cls,desc]) => (
                  <div key={role} style={{ border:'1px solid var(--gray-200)', borderRadius:8, padding:'12px 14px' }}>
                    <span className={`badge ${cls}`} style={{ marginBottom:8, display:'inline-block' }}>{role}</span>
                    <div style={{ fontSize:11, color:'var(--gray-600)', lineHeight:1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

window.Configuracion = Configuracion;
