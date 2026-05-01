/* ===== SOLEIM — Analítica y reportes ===== */

const anHours = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2,'0')}:00`);
function bellA(peak, sp, off=7) {
  return anHours.map((_,i) => { const x=(i-off)/sp; return i>=5&&i<=21 ? Math.round(Math.max(0, peak*Math.exp(-(x*x))+(Math.random()-.5)*peak*.07)) : 0; });
}
const solarKW   = bellA(1250, 3.5);
const gridKW    = anHours.map((_,i) => Math.max(0, Math.round(800 + Math.sin(i*.4)*60 - solarKW[i]*.6 + (Math.random()-.5)*80)));
const consumeKW = anHours.map((_,i) => Math.round(600 + Math.sin(i*.4)*80 + (Math.random()-.5)*60));
const solarVsGridData = anHours.map((h,i) => ({ hora: h, 'Solar (kW)': solarKW[i], 'Red eléctrica (kW)': Math.max(0, gridKW[i]), 'Consumo (kW)': consumeKW[i] }));

const instNames = ['Planta Ind. Norte','Centro Com. Solar','Planta Log. Sur','Oficinas Corp.','Sucursal Costa'];
const compareData = instNames.map((name, i) => ({
  day: name.split(' ').slice(0,2).join(' '),
  'Período actual':   [1250, 830, 640, 420, 120][i],
  'Período anterior': [1050, 780, 680, 400, 160][i],
}));

const days7 = ['18 may','19 may','20 may','21 may','22 may','23 may','24 may'];
const battPerfData = days7.map((d,i) => ({
  day: d,
  'Estado de carga (%)': Math.round(65 + Math.sin(i*.8)*18 + (Math.random()-.5)*10),
  'Temperatura (°C)':    Math.round(23 + Math.sin(i*.5)*4  + (Math.random()-.5)*2),
}));

const alertsByDay = days7.map((d,i) => ({
  day: d,
  'Críticas': Math.round(2 + (Math.random()-.5)*2),
  'Altas':    Math.round(5 + (Math.random()-.5)*3),
  'Medias':   Math.round(8 + (Math.random()-.5)*4),
  'Bajas':    Math.round(6 + (Math.random()-.5)*4),
}));

const maintImpact = days7.map((d,i) => ({
  day: d,
  'Disponibilidad (%)': Math.round(96 + Math.sin(i*.6)*2 + (Math.random()-.5)*1),
  'Órdenes mant.':      Math.round(3  + (Math.random()-.5)*3),
}));

const benchmarkData = [
  { rank:1, inst:'Planta Industrial Norte', eff:92,  delta:'+4 pp', gen:1.250, cons:850,  alerts:3,  avail:98.6, saving:21340, roi:24.3, up:true },
  { rank:2, inst:'Centro Comercial Solar',  eff:86,  delta:'+3 pp', gen:0.830, cons:620,  alerts:5,  avail:97.1, saving:13860, roi:21.8, up:true },
  { rank:3, inst:'Planta Logística Sur',    eff:78,  delta:'-2 pp', gen:0.640, cons:780,  alerts:12, avail:95.3, saving:9870,  roi:15.6, up:false },
  { rank:4, inst:'Oficinas Corporativas',   eff:100, delta:'+5 pp', gen:0.420, cons:310,  alerts:1,  avail:99.2, saving:7980,  roi:28.7, up:true },
  { rank:5, inst:'Sucursal Costa',          eff:45,  delta:'-6 pp', gen:0.120, cons:260,  alerts:18, avail:91.4, saving:1920,  roi:6.1,  up:false },
];

const reports = [
  { icon: '📊', title: 'Reporte de consumo',       desc: 'Análisis por instalación, fuente y tipo.',  color: 'var(--c-blue)' },
  { icon: '⚠',  title: 'Reporte de alertas',        desc: 'Resumen crítico por severidad y causa.',    color: 'var(--c-red)' },
  { icon: '🔧', title: 'Reporte de mantenimiento',  desc: 'Historial de órdenes y tiempos.',           color: 'var(--c-orange)' },
  { icon: '🛡', title: 'Reporte de SLA',             desc: 'Cumplimiento de acuerdos de servicio.',    color: 'var(--c-purple)' },
  { icon: '💰', title: 'Reporte de factura mensual',desc: 'Consumos, cargos y ahorro.',                color: 'var(--c-amber)' },
];

const insights = [
  { type:'alert',   title:'Baja eficiencia en Planta Logística Sur',     text:'La eficiencia cayó 2 pp vs. periodo anterior.',         time:'Hace 15 min', action:'Ver análisis' },
  { type:'info',    title:'Patrón: picos de consumo nocturno',            text:'Incrementos recurrentes entre 02:00–03:00.',            time:'Hace 27 min', action:'Ver detalle' },
  { type:'success', title:'Oportunidad de ahorro en Sucursal Costa',     text:'Ajustando configuración, podrías ahorrar +$320/mes.',   time:'Hace 1 h',    action:'Ver recomendación' },
  { type:'warn',    title:'Alta frecuencia de alertas críticas',         text:'Se recomienda revisión preventiva de inversores.',       time:'Hace 1 h',    action:'Ver alertas' },
];

function Sparkline({ up }) {
  const color = up ? 'var(--c-green)' : 'var(--c-red)';
  const pts   = up ? '0,14 4,10 8,12 12,6 16,8 20,2' : '0,2 4,6 8,4 12,10 16,8 20,14';
  return <svg width="24" height="16" viewBox="0 0 24 16"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function Analitica() {
  const [reportTab, setReportTab] = React.useState('predefinidos');

  return (
    <div className="page-content">
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        {[['Empresa','Soluciones Fotovoltaicas S.A.'],['Instalación','Todas las instalaciones'],['Período','Personalizado'],['Fuente energética','Todas'],['Modo de comparación','vs. período anterior']].map(([l,v]) => (
          <div key={l} className="filter-select">
            <div className="filter-label">{l}</div>
            <select className="header-select" style={{ minWidth: 160 }}><option>{v}</option></select>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-end', gap: 5 }}><Icons.filter />Filtros avanzados</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
        {[
          { icon:<Icons.zap />,      bg:'var(--c-green-light)',  color:'var(--c-green)',  label:'Generación total',    value:'1.248 MWh', delta:'+12,6%', dir:'up' },
          { icon:<Icons.activity />, bg:'var(--c-blue-light)',   color:'var(--c-blue)',   label:'Consumo total',       value:'830 MWh',   delta:'+8,4%',  dir:'up' },
          { icon:<Icons.dollar />,   bg:'var(--c-teal-light)',   color:'var(--c-teal)',   label:'Ahorro estimado',     value:'$186.540',  delta:'+9,8%',  dir:'up' },
          { icon:<Icons.sunCloud />, bg:'var(--c-green-light)',  color:'var(--c-green)',  label:'Emisiones evitadas',  value:'612 t CO₂', delta:'+11,3%', dir:'up' },
          { icon:<Icons.battery />,  bg:'var(--c-amber-light)',  color:'var(--c-amber)',  label:'Autonomía promedio',  value:'4,3 h',     delta:'+6,1%',  dir:'up' },
          { icon:<Icons.shield />,   bg:'var(--c-purple-light)', color:'var(--c-purple)', label:'Disponibilidad',      value:'97,8%',     delta:'+1,2 pp',dir:'up' },
        ].map(k => <MetricCard key={k.label} {...k} deltaDir={k.dir} />)}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 290px', gap: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Generación solar vs. red eléctrica <span className="info-icon"><Icons.info /></span></span>
            <select className="header-select" style={{ fontSize: 11 }}><option>15 min</option><option>1 h</option></select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            {[['#059669','Solar (kW)',''],['#1d4ed8','Red eléctrica (kW)','4 3'],['#94a3b8','Consumo (kW)','']].map(([c,l,d]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--gray-600)' }}>
                <svg width="16" height="3"><line x1="0" y1="1.5" x2="16" y2="1.5" stroke={c} strokeWidth="2" strokeDasharray={d}/></svg>{l}
              </div>
            ))}
          </div>
          <AreaSVGChart data={solarVsGridData} height={170} xKey="hora" intervalX={5}
            areas={[{ key:'Solar (kW)', color:'#059669' }]}
            lines={[{ key:'Red eléctrica (kW)', color:'#1d4ed8', dash:'4 3', width:1.5 }, { key:'Consumo (kW)', color:'#94a3b8', width:1 }]}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Comparación por instalación</span>
            <select className="header-select" style={{ fontSize: 11 }}><option>Generación (MWh)</option></select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            {[['#059669','Período actual'],['#d1fae5','Período anterior']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--gray-600)' }}><span style={{ width:10,height:10,borderRadius:2,background:c,display:'inline-block' }}/>{l}</div>
            ))}
          </div>
          <BarSVGChart data={compareData} keys={['Período actual','Período anterior']} colors={['#059669','#d1fae5']} height={170} xKey="day" grouped={true} />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Reportes y exportación <span className="info-icon"><Icons.info /></span></span></div>
          <div style={{ display:'flex', gap:0, marginBottom:10, borderBottom:'1px solid var(--gray-200)' }}>
            {[['predefinidos','Reportes predefinidos'],['exportar','Exportar datos']].map(([k,l]) => (
              <button key={k} onClick={() => setReportTab(k)} style={{ padding:'6px 8px', fontSize:11, fontWeight:reportTab===k ? 600 : 400, color:reportTab===k ? 'var(--c-blue)' : 'var(--gray-500)', borderBottom:reportTab===k ? '2px solid var(--c-blue)' : '2px solid transparent', background:'none', border:'none', borderBottom:reportTab===k ? '2px solid var(--c-blue)' : '2px solid transparent', cursor:'pointer', whiteSpace:'nowrap' }}>{l}</button>
            ))}
          </div>
          {reportTab === 'predefinidos' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {reports.map(r => (
                <div key={r.title} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:16, color:r.color }}>{r.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600 }}>{r.title}</div>
                    <div style={{ fontSize:10, color:'var(--gray-500)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.desc}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize:10, padding:'3px 7px', flexShrink:0 }}>Generar</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:12, color:'var(--gray-600)' }}>Exportar datos personalizados</div>
              <div className="filter-select">
                <div className="filter-label">Tipo de archivo</div>
                <select className="header-select"><option>CSV</option><option>PDF</option><option>Excel</option></select>
              </div>
              <button className="btn btn-primary btn-sm" style={{ justifyContent:'center' }}><Icons.download />Exportar</button>
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Rendimiento de baterías <span className="info-icon"><Icons.info /></span></span><select className="header-select" style={{ fontSize:11 }}><option>Hoy</option></select></div>
          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
            {[['#059669','Estado de carga (%)',''],['#d97706','Temperatura (°C)','4 3']].map(([c,l,d]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--gray-600)' }}><svg width="16" height="3"><line x1="0" y1="1.5" x2="16" y2="1.5" stroke={c} strokeWidth="2" strokeDasharray={d}/></svg>{l}</div>
            ))}
          </div>
          <AreaSVGChart data={battPerfData} height={150} xKey="day" intervalX={1}
            areas={[{ key:'Estado de carga (%)', color:'#059669' }]}
            lines={[{ key:'Temperatura (°C)', color:'#d97706', dash:'4 3', width:1.5 }]}
          />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Alertas por severidad en el tiempo <span className="info-icon"><Icons.info /></span></span><select className="header-select" style={{ fontSize:11 }}><option>Diario</option></select></div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            {[['#dc2626','Críticas'],['#ea580c','Altas'],['#d97706','Medias'],['#3b82f6','Bajas']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--gray-600)' }}><span style={{ width:8,height:8,borderRadius:2,background:c,display:'inline-block' }}/>{l}</div>
            ))}
          </div>
          <BarSVGChart data={alertsByDay} keys={['Críticas','Altas','Medias','Bajas']} colors={['#dc2626','#ea580c','#d97706','#3b82f6']} stacked={true} height={150} xKey="day" />
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Impacto del mantenimiento en disponibilidad <span className="info-icon"><Icons.info /></span></span></div>
          <div style={{ display:'flex', gap:10, marginBottom:8 }}>
            {[['#059669','Disponibilidad (%)',''],['#dbeafe','Órdenes mant.','']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--gray-600)' }}><span style={{ width:10,height:10,borderRadius:2,background:c }}/>{l}</div>
            ))}
          </div>
          <AreaSVGChart data={maintImpact} height={150} xKey="day" intervalX={1}
            areas={[{ key:'Disponibilidad (%)', color:'#059669' }]}
            lines={[{ key:'Órdenes mant.', color:'#3b82f6', dash:'3 2', width:1.5 }]}
          />
        </div>
      </div>

      {/* Benchmark + Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Benchmark de instalaciones</span><span className="card-link" style={{ fontSize:11 }}>🔗 Ver metodología</span></div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Instalación</th><th>Eficiencia</th><th>Gen.</th><th>Cons.</th><th>Alertas</th><th>Disponib.</th><th>Ahorro</th><th>ROI</th><th>Tendencia</th></tr></thead>
            <tbody>
              {benchmarkData.map(b => (
                <tr key={b.rank}>
                  <td style={{ fontWeight:700, color:'var(--gray-400)', fontSize:12 }}>{b.rank}</td>
                  <td style={{ fontWeight:600, fontSize:12 }}>{b.inst}</td>
                  <td><span style={{ fontWeight:700 }}>{b.eff}%</span><span style={{ marginLeft:4, fontSize:10, color:b.up ? 'var(--c-green)' : 'var(--c-red)', fontWeight:600 }}>{b.delta}</span></td>
                  <td className="mono">{b.gen.toFixed(3)}</td>
                  <td className="mono">{b.cons}</td>
                  <td style={{ fontWeight:600, color:b.alerts>10?'var(--c-red)':b.alerts>4?'var(--c-amber)':'var(--c-green)' }}>{b.alerts}</td>
                  <td className="mono">{b.avail}</td>
                  <td className="mono">${b.saving.toLocaleString('es-MX')}</td>
                  <td style={{ fontWeight:700 }}>{b.roi}%</td>
                  <td><Sparkline up={b.up} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Insights y recomendaciones <span className="info-icon"><Icons.info /></span></span></div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {insights.map((ins, i) => {
              const m = { alert:['var(--c-red-light)','var(--c-red)','⚠'], info:['var(--c-blue-light)','var(--c-blue)','ℹ'], success:['var(--c-green-light)','var(--c-green)','☀'], warn:['var(--c-orange-light)','var(--c-orange)','⚡'] };
              const [bg,color,icon] = m[ins.type]||m.info;
              return (
                <div key={i} style={{ borderRadius:8, padding:'10px 12px', background:bg, border:`1px solid ${color}25` }}>
                  <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                    <span style={{ color, fontSize:14, flexShrink:0 }}>{icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:12, marginBottom:2 }}>{ins.title}</div>
                      <div style={{ fontSize:11, color:'var(--gray-600)', lineHeight:1.4 }}>{ins.text}</div>
                    </div>
                    <span style={{ fontSize:10, color:'var(--gray-400)', whiteSpace:'nowrap' }}>{ins.time}</span>
                  </div>
                  <div style={{ textAlign:'right' }}><span style={{ fontSize:11, color, fontWeight:500, cursor:'pointer' }}>{ins.action} ›</span></div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:12 }}>
            <button className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center' }}>Ver todos los insights</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Analitica = Analitica;
