/* ===== SOLEIM — Reportes ===== */

// ---- Mock data ----
const reportTypes = [
  { id: 'consumo',       icon: '📊', title: 'Reporte de consumo',         desc: 'Análisis detallado de consumo energético por instalación, fuente y tipo de carga.',  color: 'var(--c-blue)',   bg: 'var(--c-blue-light)' },
  { id: 'generacion',    icon: '☀',  title: 'Reporte de generación solar', desc: 'Producción fotovoltaica, irradiancia, eficiencia por string e inversor.',           color: 'var(--c-green)',  bg: 'var(--c-green-light)' },
  { id: 'alertas',       icon: '⚠',  title: 'Reporte de alertas',          desc: 'Resumen de alertas críticas, frecuencia, causas raíz y tiempos de resolución.',      color: 'var(--c-red)',    bg: 'var(--c-red-light)' },
  { id: 'mantenimiento', icon: '🔧', title: 'Reporte de mantenimiento',    desc: 'Historial de órdenes, tiempos de respuesta, costos y eficiencia de técnicos.',      color: 'var(--c-orange)', bg: 'var(--c-orange-light)' },
  { id: 'sla',           icon: '🛡',  title: 'Reporte de SLA',              desc: 'Cumplimiento de acuerdos de nivel de servicio por instalación y técnico.',          color: 'var(--c-purple)', bg: 'var(--c-purple-light)' },
  { id: 'factura',       icon: '💰', title: 'Reporte de factura mensual',  desc: 'Consumos, cargos, ahorro energético y comparativa mensual.',                        color: 'var(--c-teal)',   bg: 'var(--c-teal-light)' },
  { id: 'bateria',       icon: '🔋', title: 'Reporte de baterías',         desc: 'Estado de salud (SOH), ciclos de carga, temperatura y proyección de vida útil.',    color: 'var(--c-blue)',   bg: 'var(--c-blue-light)' },
  { id: 'co2',           icon: '🌿', title: 'Reporte de emisiones CO₂',    desc: 'Emisiones evitadas, huella de carbono y equivalencias medioambientales.',           color: 'var(--c-green)',  bg: 'var(--c-green-light)' },
];

const recentReports = [
  { id: 'RPT-2025-0048', type: 'Generación solar', inst: 'Planta Industrial Norte', period: 'Abril 2025', format: 'PDF', size: '2,4 MB', date: '24 abr 2025', status: 'Listo' },
  { id: 'RPT-2025-0047', type: 'Consumo',          inst: 'Todas las instalaciones', period: 'Abril 2025', format: 'Excel', size: '1,1 MB', date: '23 abr 2025', status: 'Listo' },
  { id: 'RPT-2025-0046', type: 'SLA',              inst: 'Todas las instalaciones', period: 'Abril 2025', format: 'PDF',   size: '890 KB', date: '22 abr 2025', status: 'Listo' },
  { id: 'RPT-2025-0045', type: 'Alertas',          inst: 'Centro Comercial Solar',  period: 'Abril 2025', format: 'CSV',   size: '340 KB', date: '21 abr 2025', status: 'Listo' },
  { id: 'RPT-2025-0044', type: 'Mantenimiento',    inst: 'Planta Logística Sur',    period: 'Marzo 2025', format: 'PDF',   size: '1,8 MB', date: '15 abr 2025', status: 'Listo' },
  { id: 'RPT-2025-0043', type: 'Factura mensual',  inst: 'Todas las instalaciones', period: 'Marzo 2025', format: 'PDF',   size: '3,2 MB', date: '10 abr 2025', status: 'Listo' },
];

const scheduledReports = [
  { type: 'Generación solar', freq: 'Mensual', nextRun: '1 may 2025', recipients: 3, format: 'PDF' },
  { type: 'SLA',              freq: 'Semanal', nextRun: '28 abr 2025', recipients: 5, format: 'PDF' },
  { type: 'Alertas',          freq: 'Diario',  nextRun: 'Hoy 18:00',  recipients: 8, format: 'Email' },
  { type: 'Factura mensual',  freq: 'Mensual', nextRun: '1 may 2025', recipients: 2, format: 'PDF + Excel' },
];

const installs = ['Todas las instalaciones', 'Planta Industrial Norte', 'Centro Comercial Solar', 'Planta Logística Sur', 'Oficinas Corporativas', 'Sucursal Costa'];

// ---- Report builder modal ----
function ReportBuilder({ template, onClose }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({ inst: 'Todas las instalaciones', period: 'Último mes', format: 'PDF', email: '' });
  const [generating, setGenerating] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); }, 1800);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:16, width:480, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--gray-200)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:template.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{template.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>{template.title}</div>
            <div style={{ fontSize:12, color:'var(--gray-500)' }}>Configurar y generar reporte</div>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><Icons.x /></button>
        </div>

        {/* Steps indicator */}
        <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--gray-100)', display:'flex', gap:8, alignItems:'center' }}>
          {[['1','Configurar'],['2','Vista previa'],['3','Generar']].map(([n,l],i) => (
            <React.Fragment key={n}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background: step > i+1 ? 'var(--c-green)' : step === i+1 ? 'var(--c-blue)' : 'var(--gray-200)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color: step >= i+1 ? '#fff' : 'var(--gray-500)', flexShrink:0 }}>
                  {step > i+1 ? '✓' : n}
                </div>
                <span style={{ fontSize:12, fontWeight: step===i+1 ? 600 : 400, color: step===i+1 ? 'var(--gray-800)' : 'var(--gray-400)' }}>{l}</span>
              </div>
              {i < 2 && <div style={{ flex:1, height:1, background:'var(--gray-200)' }}/>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ padding:'20px 24px' }}>
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[['Instalación', 'inst', installs],['Período', 'period', ['Último mes','Últimos 3 meses','Últimos 6 meses','Último año','Personalizado']],['Formato', 'format', ['PDF','Excel (XLSX)','CSV','JSON']]].map(([label, key, opts]) => (
                <div key={key}>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-700)', display:'block', marginBottom:5 }}>{label}</label>
                  <select className="header-select" style={{ width:'100%', height:36 }} value={form[key]} onChange={e => setForm(f => ({...f, [key]:e.target.value}))}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-700)', display:'block', marginBottom:5 }}>Enviar por correo (opcional)</label>
                <input placeholder="correo@empresa.mx" style={{ width:'100%', padding:'8px 12px', border:'1px solid var(--gray-200)', borderRadius:6, fontSize:13, fontFamily:'var(--font-base)', outline:'none' }}
                  value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ background:'var(--gray-50)', borderRadius:10, padding:'16px', marginBottom:14 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Resumen de configuración</div>
                {[['Tipo de reporte', template.title],['Instalación', form.inst],['Período', form.period],['Formato', form.format],['Enviar a', form.email || 'No configurado']].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid var(--gray-200)' }}>
                    <span style={{ color:'var(--gray-500)' }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--c-blue-light)', borderRadius:8, padding:'12px', fontSize:12, color:'var(--c-blue)', display:'flex', gap:8 }}>
                <span style={{ fontSize:16 }}>ℹ</span>
                <span>El reporte se generará con datos actualizados al momento de la solicitud y estará disponible en el historial de reportes.</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              {generating ? (
                <>
                  <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
                  <div style={{ fontWeight:600, fontSize:15, marginBottom:6 }}>Generando reporte…</div>
                  <div style={{ fontSize:12, color:'var(--gray-500)' }}>Esto puede tomar unos segundos</div>
                  <div style={{ marginTop:16, height:4, background:'var(--gray-200)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:'70%', height:'100%', background:'var(--c-blue)', borderRadius:2, animation:'progress-bar 1.8s ease forwards' }}/>
                  </div>
                </>
              ) : done ? (
                <>
                  <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                  <div style={{ fontWeight:700, fontSize:16, marginBottom:6, color:'var(--c-green)' }}>¡Reporte generado!</div>
                  <div style={{ fontSize:12, color:'var(--gray-500)', marginBottom:16 }}>Tu reporte está listo para descargar.</div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                    <button className="btn btn-primary" style={{ gap:6 }}><Icons.download />Descargar {form.format}</button>
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        {!(step === 3 && (generating || done)) && (
          <div style={{ padding:'14px 24px', borderTop:'1px solid var(--gray-200)', display:'flex', justifyContent:'space-between' }}>
            <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s=>s-1) : onClose()}>{step > 1 ? '← Atrás' : 'Cancelar'}</button>
            {step < 3
              ? <button className="btn btn-primary" onClick={() => setStep(s=>s+1)}>Siguiente →</button>
              : <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>{generating ? 'Generando…' : 'Generar reporte'}</button>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Format badge ----
function FormatBadge({ format }) {
  const map = { 'PDF':'badge badge-alert', 'Excel':'badge badge-online', 'CSV':'badge badge-info', 'JSON':'badge badge-gray', 'Email':'badge badge-purple', 'PDF + Excel':'badge badge-maint' };
  return <span className={map[format] || 'badge badge-gray'} style={{ fontSize:10 }}>{format}</span>;
}

// ---- Main page ----
function Reportes() {
  const [selected, setSelected] = React.useState(null);

  const statsRow = [
    { icon:'📋', label:'Reportes generados este mes', value:'48',   color:'var(--c-blue)' },
    { icon:'⏱', label:'Tiempo promedio de generación', value:'12 s', color:'var(--c-green)' },
    { icon:'📅', label:'Reportes programados activos',  value:'4',   color:'var(--c-purple)' },
    { icon:'⬇', label:'Descargas este mes',             value:'127', color:'var(--c-amber)' },
  ];

  return (
    <div className="page-content">
      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {statsRow.map(s => (
          <div key={s.label} className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
            <span style={{ fontSize:28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:2, lineHeight:1.3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Report templates */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Generar nuevo reporte</span>
          <span style={{ fontSize:12, color:'var(--gray-500)' }}>Selecciona una plantilla para comenzar</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {reportTypes.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} style={{ border:'1px solid var(--gray-200)', borderRadius:10, padding:'16px', cursor:'pointer', transition:'all .12s', display:'flex', flexDirection:'column', gap:10 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ width:42, height:42, borderRadius:10, background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{r.icon}</div>
              <div style={{ fontWeight:600, fontSize:13, color:'var(--gray-900)' }}>{r.title}</div>
              <div style={{ fontSize:11, color:'var(--gray-500)', lineHeight:1.4, flex:1 }}>{r.desc}</div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop:'auto', width:'100%', justifyContent:'center' }}>Generar →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reports + Scheduled */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Historial de reportes</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-secondary btn-sm"><Icons.filter />Filtrar</button>
              <button className="btn btn-secondary btn-sm"><Icons.download />Exportar todo</button>
            </div>
          </div>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Tipo</th><th>Instalación</th><th>Período</th><th>Formato</th><th>Tamaño</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {recentReports.map(r => (
                <tr key={r.id}>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'var(--c-blue)' }}>{r.id}</span></td>
                  <td style={{ fontSize:12, fontWeight:600 }}>{r.type}</td>
                  <td style={{ fontSize:12 }}>{r.inst}</td>
                  <td style={{ fontSize:12 }}>{r.period}</td>
                  <td><FormatBadge format={r.format} /></td>
                  <td className="mono" style={{ fontSize:11 }}>{r.size}</td>
                  <td className="mono" style={{ fontSize:11 }}>{r.date}</td>
                  <td><span className="badge badge-online" style={{ fontSize:10 }}>✓ {r.status}</span></td>
                  <td><div className="icon-actions">
                    <button className="btn btn-icon btn-secondary" title="Descargar"><Icons.download /></button>
                    <button className="btn btn-icon btn-secondary" title="Ver"><Icons.eye /></button>
                    <button className="btn btn-icon btn-secondary" title="Más"><Icons.moreVert /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, fontSize:12, color:'var(--gray-500)' }}>
            <span>1–6 de 48 reportes</span>
            <div style={{ display:'flex', gap:4 }}>
              <button className="btn btn-secondary btn-sm">‹</button>
              <button className="btn btn-primary btn-sm">1</button>
              <button className="btn btn-secondary btn-sm">2</button>
              <button className="btn btn-secondary btn-sm">›</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Reportes programados</span>
            <button className="btn btn-primary btn-sm"><Icons.plus />Nuevo</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {scheduledReports.map((r, i) => (
              <div key={i} style={{ border:'1px solid var(--gray-200)', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, alignItems:'center' }}>
                  <span style={{ fontWeight:600, fontSize:13 }}>{r.type}</span>
                  <FormatBadge format={r.format} />
                </div>
                <div style={{ display:'flex', gap:10, fontSize:11, color:'var(--gray-600)', flexWrap:'wrap' }}>
                  <span>🔁 {r.freq}</span>
                  <span>📅 {r.nextRun}</span>
                  <span>👤 {r.recipients} destinatarios</span>
                </div>
                <div style={{ display:'flex', gap:4, marginTop:8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:'center' }}>Editar</button>
                  <button className="btn btn-secondary btn-sm" style={{ flex:1, justifyContent:'center' }}>Pausar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Builder modal */}
      {selected && <ReportBuilder template={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

window.Reportes = Reportes;
