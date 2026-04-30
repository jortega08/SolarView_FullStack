/* ===== SOLEIM — Telemetría en tiempo real ===== */

// ---- Mock data ----
const instsTelemetria = [
  'Planta Industrial Norte',
  'Centro Comercial Solar',
  'Planta Logística Sur',
  'Oficinas Corporativas',
  'Sucursal Costa',
];

function makeTelStream(peak) {
  return Array.from({ length: 40 }, (_, i) => {
    const x = (i - 20) / 8;
    return { t: i, v: Math.round(Math.max(0, peak * Math.exp(-(x * x)) + (Math.random() - .5) * peak * .08)) };
  });
}

const sensors = [
  { id: 'INV-001', name: 'Inversor 1', tipo: 'Inversor', inst: 'Planta Industrial Norte', status: 'En línea', value: '420 kW',   unit: 'kW',   color: '#059669', stream: makeTelStream(420) },
  { id: 'INV-002', name: 'Inversor 2', tipo: 'Inversor', inst: 'Planta Industrial Norte', status: 'En línea', value: '380 kW',   unit: 'kW',   color: '#059669', stream: makeTelStream(380) },
  { id: 'INV-003', name: 'Inversor 3', tipo: 'Inversor', inst: 'Planta Industrial Norte', status: 'Alerta',   value: '1.250 kW', unit: 'kW',   color: '#dc2626', stream: makeTelStream(1250) },
  { id: 'BAT-001', name: 'Batería 1',  tipo: 'Batería',  inst: 'Centro Comercial Solar',  status: 'En línea', value: '86%',      unit: '%',    color: '#3b82f6', stream: makeTelStream(86) },
  { id: 'BAT-002', name: 'Batería 2',  tipo: 'Batería',  inst: 'Planta Logística Sur',    status: 'En línea', value: '74%',      unit: '%',    color: '#3b82f6', stream: makeTelStream(74) },
  { id: 'MED-001', name: 'Medidor Principal', tipo: 'Medidor', inst: 'Planta Logística Sur', status: 'En línea', value: '640 kW', unit: 'kW', color: '#7c3aed', stream: makeTelStream(640) },
  { id: 'TMP-001', name: 'Temp. Ambiente', tipo: 'Sensor', inst: 'Planta Industrial Norte', status: 'En línea', value: '26 °C',  unit: '°C',  color: '#d97706', stream: makeTelStream(26) },
  { id: 'IRR-001', name: 'Irradiancia',    tipo: 'Sensor', inst: 'Planta Industrial Norte', status: 'En línea', value: '850 W/m²', unit: 'W/m²', color: '#f59e0b', stream: makeTelStream(850) },
];

const logEvents = [
  { time: '15:42:18', sensor: 'INV-003', inst: 'Planta Industrial Norte', msg: 'Sobretemperatura detectada – 78°C', sev: 'Crítica' },
  { time: '15:41:55', sensor: 'INV-001', inst: 'Planta Industrial Norte', msg: 'Generación dentro de parámetros normales', sev: null },
  { time: '15:41:32', sensor: 'BAT-001', inst: 'Centro Comercial Solar',  msg: 'SOC estabilizado en 86%', sev: null },
  { time: '15:40:11', sensor: 'MED-001', inst: 'Planta Logística Sur',    msg: 'Pico de consumo: 720 kW', sev: 'Media' },
  { time: '15:39:48', sensor: 'IRR-001', inst: 'Planta Industrial Norte', msg: 'Irradiancia: 850 W/m²', sev: null },
  { time: '15:38:22', sensor: 'BAT-002', inst: 'Planta Logística Sur',    msg: 'SOC descendiendo: 74%', sev: null },
  { time: '15:37:05', sensor: 'TMP-001', inst: 'Planta Industrial Norte', msg: 'Temperatura ambiente: 26°C', sev: null },
  { time: '15:36:44', sensor: 'INV-002', inst: 'Planta Industrial Norte', msg: 'Reconexión tras fallo momentáneo', sev: 'Media' },
];

// ---- Sparkline mini chart ----
function SparklineStream({ data, color, height = 48, width = 120 }) {
  if (!data || !data.length) return null;
  const vals = data.map(d => d.v);
  const max = Math.max(...vals) || 1;
  const min = Math.min(...vals);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Last point dot */}
      {(() => {
        const last = data[data.length - 1];
        const lx = width;
        const ly = height - ((last.v - min) / range) * (height - 4) - 2;
        return <circle cx={lx} cy={ly} r="2.5" fill={color}/>;
      })()}
    </svg>
  );
}

// ---- Sensor card ----
function SensorCard({ sensor, selected, onSelect }) {
  const isAlert = sensor.status === 'Alerta';
  return (
    <div
      onClick={() => onSelect(sensor)}
      style={{
        background: '#fff',
        border: `1px solid ${selected ? 'var(--c-blue)' : isAlert ? 'var(--c-red-mid)' : 'var(--gray-200)'}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 2px var(--c-blue-mid)' : isAlert ? '0 0 0 2px var(--c-red-mid)' : 'var(--shadow-sm)',
        transition: 'all .12s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray-400)', marginBottom: 2 }}>{sensor.id}</div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-900)' }}>{sensor.name}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{sensor.inst}</div>
        </div>
        <StatusBadge status={sensor.status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 1 }}>Valor actual</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: isAlert ? 'var(--c-red)' : 'var(--gray-900)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{sensor.value}</div>
        </div>
        <SparklineStream data={sensor.stream} color={sensor.color} />
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
        <span className="badge badge-gray" style={{ fontSize: 10 }}>{sensor.tipo}</span>
        {isAlert && <span className="badge badge-alert" style={{ fontSize: 10 }}>⚠ Alerta activa</span>}
      </div>
    </div>
  );
}

// ---- Detail panel ----
function SensorDetailPanel({ sensor, onClose }) {
  const [tab, setTab] = React.useState('grafica');
  const tabs = ['grafica', 'parametros', 'historial'];
  const tabLabels = { grafica: 'Gráfica en vivo', parametros: 'Parámetros', historial: 'Historial' };

  // Extended stream for detail view
  const extStream = React.useMemo(() => {
    const base = [...sensor.stream];
    // Add simulated live tick
    return base.map((d, i) => ({ hora: `${String(Math.floor(i * 0.6)).padStart(2,'0')}:${String(Math.round((i * 0.6 % 1) * 60)).padStart(2,'0')}`, v: d.v }));
  }, [sensor]);

  const maxV = Math.max(...extStream.map(d => d.v)) || 1;
  const minV = Math.min(...extStream.map(d => d.v));
  const range = maxV - minV || 1;
  const W = 320, H = 120;
  const pts = extStream.map((d, i) => {
    const x = (i / (extStream.length - 1)) * W;
    const y = H - ((d.v - minV) / range) * (H - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const params = [
    ['Tipo', sensor.tipo],
    ['Instalación', sensor.inst],
    ['ID del sensor', sensor.id],
    ['Estado', sensor.status],
    ['Unidad', sensor.unit],
    ['Valor actual', sensor.value],
    ['Valor máximo (24h)', `${maxV} ${sensor.unit}`],
    ['Valor mínimo (24h)', `${minV} ${sensor.unit}`],
    ['Última lectura', '15:42:18'],
    ['Frecuencia', '5 segundos'],
    ['Protocolo', 'Modbus TCP'],
  ];

  return (
    <div style={{ position: 'fixed', top: 56, right: 0, bottom: 0, width: 380, background: '#fff', borderLeft: '1px solid var(--gray-200)', zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>{sensor.id}</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-900)', marginBottom: 2 }}>{sensor.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <StatusBadge status={sensor.status} />
            <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{sensor.inst}</span>
          </div>
        </div>
        <button className="btn btn-icon btn-secondary" onClick={onClose}><Icons.x /></button>
      </div>

      {/* Live value */}
      <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>Valor actual</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: sensor.status === 'Alerta' ? 'var(--c-red)' : 'var(--gray-900)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{sensor.value}</div>
        </div>
        <span className="header-live" style={{ fontSize: 11 }}><span className="header-live-dot" />En vivo</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', padding: '0 16px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 10px', fontSize: 12, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--c-blue)' : 'var(--gray-500)', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--c-blue)' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {tab === 'grafica' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 10 }}>Últimos 20 minutos</div>
            <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} style={{ display: 'block', marginBottom: 8 }}>
              <defs>
                <linearGradient id="dpg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sensor.color} stopOpacity="0.2"/>
                  <stop offset="100%" stopColor={sensor.color} stopOpacity="0"/>
                </linearGradient>
              </defs>
              {[0,.25,.5,.75,1].map((f,i) => {
                const yv = H - (((minV + range*f) - minV) / range) * (H-8) - 4;
                return <g key={i}><line x1="0" y1={yv} x2={W} y2={yv} stroke="#f1f5f9" strokeWidth="1"/><text x="2" y={yv - 2} fontSize="9" fill="#94a3b8">{Math.round(minV + range * f)}</text></g>;
              })}
              <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#dpg)"/>
              <polyline points={pts} fill="none" stroke={sensor.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['Mínimo', `${minV} ${sensor.unit}`],['Promedio', `${Math.round((maxV+minV)/2)} ${sensor.unit}`],['Máximo', `${maxV} ${sensor.unit}`]].map(([k,v]) => (
                <div key={k} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'parametros' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {params.map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-800)', fontFamily: ['Valor actual','Valor máximo (24h)','Valor mínimo (24h)'].includes(k) ? 'var(--font-mono)' : 'inherit' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {tab === 'historial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {logEvents.filter(e => e.sensor === sensor.id || true).slice(0, 8).map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray-400)', minWidth: 56 }}>{e.time}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-700)' }}>{e.msg}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{e.sensor} · {e.inst}</div>
                </div>
                {e.sev && <SevBadge sev={e.sev} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main page ----
function Telemetria() {
  const [selectedSensor, setSelectedSensor] = React.useState(null);
  const [filterInst, setFilterInst] = React.useState('Todas');
  const [filterTipo, setFilterTipo] = React.useState('Todos');
  const [search, setSearch] = React.useState('');
  const [view, setView] = React.useState('grid');

  const tipos = ['Todos', 'Inversor', 'Batería', 'Medidor', 'Sensor'];

  const filtered = sensors.filter(s =>
    (filterInst === 'Todas' || s.inst === filterInst) &&
    (filterTipo === 'Todos' || s.tipo === filterTipo) &&
    (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()))
  );

  const kpis = [
    { icon: <Icons.wifi />,     bg: 'var(--c-green-light)',  color: 'var(--c-green)',  label: 'Sensores en línea',  value: '124', delta: '97% del total', dir: 'up' },
    { icon: <Icons.alert />,    bg: 'var(--c-red-light)',    color: 'var(--c-red)',    label: 'Sensores en alerta', value: '3',   delta: '+1 vs. ayer',    dir: 'down' },
    { icon: <Icons.activity />, bg: 'var(--c-blue-light)',   color: 'var(--c-blue)',   label: 'Lecturas por min.',  value: '2.480', delta: 'Tiempo real',   dir: 'up' },
    { icon: <Icons.zap />,      bg: 'var(--c-purple-light)', color: 'var(--c-purple)', label: 'Potencia total',     value: '3.710 kW', delta: 'Todas las instalaciones', dir: 'up' },
    { icon: <Icons.clock />,    bg: 'var(--c-amber-light)',  color: 'var(--c-amber)',  label: 'Latencia promedio',  value: '180 ms', delta: 'Óptima',       dir: 'up' },
  ];

  return (
    <div className="page-content" style={{ paddingRight: selectedSensor ? 396 : 'var(--content-pad)' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
        {kpis.map(k => <MetricCard key={k.label} icon={k.icon} iconBg={k.bg} iconColor={k.color} label={k.label} value={k.value} delta={k.delta} deltaDir={k.dir} />)}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--r-sm)', padding: '0 10px' }}>
          <Icons.search />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sensor…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: 160, fontFamily: 'var(--font-base)' }} />
        </div>
        <div className="filter-select">
          <div className="filter-label">Instalación</div>
          <select className="header-select" value={filterInst} onChange={e => setFilterInst(e.target.value)}>
            {['Todas', ...instsTelemetria].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="filter-select">
          <div className="filter-label">Tipo de sensor</div>
          <select className="header-select" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
            {tipos.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button className={`btn btn-sm ${view==='grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('grid')}><Icons.grid /></button>
          <button className={`btn btn-sm ${view==='list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('list')}><Icons.list /></button>
          <span className="header-live" style={{ marginLeft: 8, alignSelf: 'center', fontSize: 11 }}><span className="header-live-dot" />En vivo</span>
        </div>
      </div>

      {/* Sensor grid */}
      <div style={{ display: 'grid', gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(240px,1fr))' : '1fr', gap: 10 }}>
        {filtered.map(s => (
          <SensorCard key={s.id} sensor={s} selected={selectedSensor?.id === s.id} onSelect={setSelectedSensor} />
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <Icons.wifi /><p>No se encontraron sensores con los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {/* Live event log */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Registro de eventos en tiempo real <span className="info-icon"><Icons.info /></span></span>
          <span className="header-live" style={{ fontSize: 11 }}><span className="header-live-dot" />En vivo</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Hora</th><th>Sensor</th><th>Instalación</th><th>Evento</th><th>Severidad</th></tr>
          </thead>
          <tbody>
            {logEvents.map((e, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{e.time}</td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--c-blue)' }}>{e.sensor}</span></td>
                <td style={{ fontSize: 12 }}>{e.inst}</td>
                <td style={{ fontSize: 12 }}>{e.msg}</td>
                <td>{e.sev ? <SevBadge sev={e.sev} /> : <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selectedSensor && <SensorDetailPanel sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />}
    </div>
  );
}

window.Telemetria = Telemetria;
