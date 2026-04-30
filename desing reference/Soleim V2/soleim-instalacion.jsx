/* ===== SOLEIM — Detalle de instalación ===== */

const instHours = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2,'0')}:00`);
function bellI(peak, sp, off=7) {
  return instHours.map((_,i) => { const x=(i-off)/sp; return i>=5&&i<=21 ? Math.round(Math.max(0, peak*Math.exp(-(x*x))+(Math.random()-.5)*peak*.05)) : 0; });
}
const iGen  = bellI(1250, 3.5);
const iCons = instHours.map((_,i) => Math.round(700 + Math.sin(i*.5)*100 + (Math.random()-.5)*60));
const iSOC  = instHours.map((_,i) => Math.min(100, Math.round(55 + i*1.6 - Math.max(0,(i-14)*2.5) + (Math.random()-.5)*3)));
const iIrr  = instHours.map((_,i) => { const x=(i-12)/3.8; return i>=5&&i<=20 ? Math.round(Math.max(0, 950*Math.exp(-(x*x)))+(Math.random()-.5)*40) : 0; });

const instChartData = instHours.map((h,i) => ({
  hora: h,
  'Generación solar (kW)': iGen[i],
  'Consumo (kW)': iCons[i],
  'Batería SOC (%)': iSOC[i],
  'Irradiancia (W/m²)': iIrr[i],
}));

const activeAlerts = [
  { id: 'ALT-2025-0012', title: 'Alta temperatura en Inversor 3', detail: 'Temperatura 78°C (Límite: 75°C)', sev: 'Crítica', time: 'Hace 5 min' },
  { id: 'ALT-2025-0011', title: 'Voltaje de batería elevado',    detail: 'Voltaje 742 V (Límite: 750 V)',   sev: 'Media',   time: 'Hace 18 min' },
];

const relatedOrders = [
  { id: 'OT-4587', title: 'Inspección Inversor 3', tech: 'Luis Ramírez', status: 'En progreso', sla: '4 h restantes' },
  { id: 'OT-4561', title: 'Revisión preventiva',   tech: 'Ana Gómez',    status: 'Completada',  sla: 'Completada el 23 may 2025' },
  { id: 'OT-4520', title: 'Limpieza de módulos',   tech: '—',            status: 'Abierta',     sla: 'Programada para 27 may' },
];

const liveTelemetry = [
  { time: '15:42:18', color: 'tl-green',  label: 'Generación solar',     value: '1.250 kW',           sub: 'Inversor 3' },
  { time: '15:42:18', color: 'tl-blue',   label: 'Consumo total',        value: '830 kW',             sub: 'Carga industrial' },
  { time: '15:42:18', color: 'tl-amber',  label: 'Batería descargando',  value: '-312 A',             sub: 'SOC 86%' },
  { time: '15:42:18', color: 'tl-amber',  label: 'Irradiancia',          value: '850 W/m²',           sub: 'Sensor en techo' },
  { time: '15:42:18', color: 'tl-blue',   label: 'Temperatura ambiente', value: '26°C',               sub: 'Estación meteorológica' },
  { time: '15:42:13', color: 'tl-green',  label: 'Modo de operación',    value: 'Híbrido Automático', sub: '' },
];

function SOCGauge({ pct }) {
  const color = pct >= 70 ? 'var(--c-green)' : pct >= 40 ? 'var(--c-amber)' : 'var(--c-red)';
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <SemiGauge pct={pct} size={160} color={color} />
      <div style={{ marginTop: -20, textAlign: 'center', lineHeight: 1.2 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-900)' }}>{pct}%</div>
        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>SOC</div>
      </div>
    </div>
  );
}

function QuickActions({ onNav }) {
  const acts = [
    { icon: '⚠', label: 'Resolver alerta',  color: 'var(--c-red)',    cb: () => onNav('alertas') },
    { icon: '📋', label: 'Crear orden',      color: 'var(--c-blue)',   cb: () => onNav('ordenes') },
    { icon: '📈', label: 'Ver histórico',    color: 'var(--c-purple)', cb: () => {} },
    { icon: '📡', label: 'Abrir telemetría', color: 'var(--c-green)',  cb: () => onNav('telemetria') },
    { icon: '⬇',  label: 'Exportar reporte',color: 'var(--c-amber)',  cb: () => onNav('reportes') },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {acts.map(a => (
        <button key={a.label} className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: 10, padding: '8px 12px' }} onClick={a.cb}>
          <span style={{ fontSize: 16, color: a.color }}>{a.icon}</span>
          <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function InstalacionDetalle({ onNav }) {
  const [period, setPeriod] = React.useState('Hoy');

  const kpis = [
    { icon: <Icons.zap />,         bg: 'var(--c-blue-light)',   color: 'var(--c-blue)',   label: 'Potencia actual',    value: '1.250 kW', sub: '50% de 2,5 MWp' },
    { icon: <Icons.sun />,         bg: 'var(--c-green-light)',  color: 'var(--c-green)',  label: 'Generación hoy',     value: '612 MWh',  sub: '92% de la meta' },
    { icon: <Icons.activity />,    bg: 'var(--c-purple-light)', color: 'var(--c-purple)', label: 'Consumo actual',     value: '830 kW',   sub: 'Desde la red: 0 kW' },
    { icon: <Icons.battery />,     bg: 'var(--c-green-light)',  color: 'var(--c-green)',  label: 'Batería (SOC)',      value: '86%',      sub: '1,03 MWh disponibles' },
    { icon: <Icons.clock />,       bg: 'var(--c-amber-light)',  color: 'var(--c-amber)',  label: 'Autonomía estimada', value: '3 h 42 min', sub: 'Con carga actual' },
    { icon: <Icons.thermometer />, bg: 'var(--c-teal-light)',   color: 'var(--c-teal)',   label: 'Temperatura',        value: '26°C',     sub: 'Ambiente' },
    { icon: <Icons.sun />,         bg: 'var(--c-amber-light)',  color: 'var(--c-amber)',  label: 'Irradiancia',        value: '850 W/m²', sub: 'Óptima' },
    { icon: <Icons.trendUp />,     bg: 'var(--c-green-light)',  color: 'var(--c-green)',  label: 'Eficiencia',         value: '96%',      sub: 'Excelente' },
  ];

  return (
    <div className="page-content">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span style={{ color: 'var(--c-blue)', cursor: 'pointer' }} onClick={() => onNav('dashboard')}>Inicio</span>
        <span className="breadcrumb-sep">›</span>
        <span style={{ color: 'var(--c-blue)', cursor: 'pointer' }} onClick={() => onNav('instalaciones')}>Instalaciones</span>
        <span className="breadcrumb-sep">›</span>
        <span>Planta Industrial Norte</span>
      </div>

      {/* Header card */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 56, borderRadius: 8, background: 'linear-gradient(135deg,#0f2027,#2c5364)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>☀</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Planta Industrial Norte</div>
            <div style={{ marginTop: 4 }}><StatusBadge status="En línea" /></div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--gray-200)', margin: '0 8px' }} />
          {[['Tipo de sistema','Híbrido'],['Capacidad solar','2,5 MWp'],['Capacidad batería','1,2 MWh'],['Ciudad','Monterrey, NL']].map(([k,v]) => (
            <div key={k} style={{ minWidth: 100 }}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Última actualización</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-green)', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
              <span className="header-live-dot" />Hace 8 segundos
            </div>
          </div>
        </div>
      </div>

      {/* 8 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 8 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ padding: '12px 14px' }}>
            <div style={{ width: 30, height: 30, borderRadius: 6, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, marginBottom: 6 }}>
              <span style={{ width: 16, height: 16 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--gray-500)' }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, margin: '3px 0' }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Battery + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px 160px', gap: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Generación, consumo y estado de batería <span className="info-icon"><Icons.info /></span></span>
            <div style={{ display: 'flex', gap: 5 }}>
              {['Hoy','7 días','30 días'].map(p => (
                <button key={p} className={`btn btn-sm ${period===p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            {[['#059669','Generación solar (kW)',''],['#1d4ed8','Consumo (kW)',''],['#7c3aed','Batería SOC (%)','5 3'],['#d97706','Irradiancia (W/m²)','3 3']].map(([c,l,d]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--gray-600)' }}>
                <svg width="16" height="3"><line x1="0" y1="1.5" x2="16" y2="1.5" stroke={c} strokeWidth="2" strokeDasharray={d}/></svg>{l}
              </div>
            ))}
          </div>
          <AreaSVGChart data={instChartData} height={200} xKey="hora" intervalX={4}
            areas={[{ key: 'Generación solar (kW)', color: '#059669' }]}
            lines={[
              { key: 'Consumo (kW)',      color: '#1d4ed8', width: 2 },
              { key: 'Batería SOC (%)',   color: '#7c3aed', dash: '5 3', right: true },
              { key: 'Irradiancia (W/m²)', color: '#d97706', dash: '3 3' },
            ]}
          />
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span className="card-link">Ver telemetría en vivo ›</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 12 }}>Batería y salud del sistema</span>
            <span className="badge badge-online" style={{ fontSize: 10 }}>Óptima</span>
          </div>
          <SOCGauge pct={86} />
          <div style={{ fontSize: 11, color: 'var(--gray-500)', textAlign: 'center', marginBottom: 8 }}>1,03 MWh disponibles de 1,20 MWh</div>
          <div className="divider" />
          {[['Estado','Descargando ↓'],['Voltaje','742 V'],['Corriente','-312 A'],['Temperatura','24 °C'],['Tiempo restante','3 h 42 min'],['Fuente principal','☀ Solar'],['Desde la red','0 kW']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
              <span style={{ color: 'var(--gray-500)' }}>{k}</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12, fontSize: 12 }}>Acciones rápidas</div>
          <QuickActions onNav={onNav} />
        </div>
      </div>

      {/* Live telemetry + Alerts + Orders + Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr 175px', gap: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title" style={{ fontSize: 12 }}>Telemetría en vivo</span>
            <span className="header-live" style={{ fontSize: 10 }}><span className="header-live-dot" />En vivo</span>
          </div>
          <div className="timeline">
            {liveTelemetry.map((t, i) => (
              <div key={i} className={`timeline-item ${t.color}`}>
                <span className="timeline-time">{t.time}</span>
                <div className="timeline-content">
                  <div style={{ fontWeight: 600, fontSize: 11 }}>{t.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.value}</div>
                  {t.sub && <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{t.sub}</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, textAlign: 'center' }}><span className="card-link" style={{ fontSize: 11 }}>Ver telemetría completa ›</span></div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Alertas activas <span style={{ background: 'var(--c-red)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>2</span></span>
            <span className="card-link">Ver todas</span>
          </div>
          {activeAlerts.map(al => (
            <div key={al.id} style={{ border: `1px solid ${al.sev==='Crítica' ? 'var(--c-red-mid)' : 'var(--c-amber-mid)'}`, borderRadius: 8, padding: '10px 12px', background: al.sev==='Crítica' ? 'var(--c-red-light)' : 'var(--c-amber-light)', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>⚠</span>
                <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{al.title}</span>
                <SevBadge sev={al.sev} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-600)', marginBottom: 6 }}>{al.detail}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--gray-500)' }}>{al.time}</span>
                <button className="btn btn-sm btn-danger">Resolver</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Órdenes relacionadas</span><span className="card-link">Ver todas</span></div>
          {relatedOrders.map(o => (
            <div key={o.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', marginBottom: 8 }}
                 onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
                 onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray-500)' }}>{o.id}</span>
                <WOBadge status={o.status} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{o.title}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Técnico: {o.tech}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>SLA: {o.sla}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12, fontSize: 12 }}>🔧 Próximo mantenimiento</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Revisión preventiva general</div>
          <WOBadge status="Programado" />
          <div className="divider" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}><span style={{ color: 'var(--c-blue)' }}>📅</span><strong>27 may 2025</strong></div>
            <div style={{ display: 'flex', gap: 6 }}><span style={{ color: 'var(--c-blue)' }}>🕐</span><span>09:00 – 12:00</span></div>
            <div className="divider" style={{ margin: '4px 0' }} />
            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Técnico asignado</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,var(--c-blue),var(--c-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>LR</div>
              <span style={{ fontWeight: 600 }}>Luis Ramírez</span>
            </div>
          </div>
          <div style={{ marginTop: 12, textAlign: 'center' }}><span className="card-link" style={{ fontSize: 11 }}>Ver plan de mantenimiento ›</span></div>
        </div>
      </div>
    </div>
  );
}

window.InstalacionDetalle = InstalacionDetalle;
