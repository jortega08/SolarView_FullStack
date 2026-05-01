/* ===== SOLEIM — Centro de control (Dashboard) ===== */

// ---- Mock data ----
const hours = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2,'0')}:00`);
function bell(peak, sp) {
  return hours.map((_, i) => { const x=(i-7)/sp; return i>=5&&i<=21 ? Math.round(Math.max(0, peak*Math.exp(-(x*x))+(Math.random()-.5)*peak*.06)) : 0; });
}
const solarGen  = bell(1250, 3.5);
const consumption = hours.map((_,i) => Math.round(600 + Math.sin(i*.4)*80 + (Math.random()-.5)*60));
const exportNet = hours.map((_,i) => Math.max(0, solarGen[i] - consumption[i] - 50));
const importNet = hours.map((_,i) => Math.max(0, consumption[i] - solarGen[i] + 30));

const chartData = hours.map((h,i) => ({
  hora: h,
  'Solar (kW)': solarGen[i],
  'Consumo (kW)': consumption[i],
  'Export. red (kW)': exportNet[i],
  'Import. red (kW)': importNet[i],
}));

const batteryHealth = [
  { name: 'Óptima (>90%)',   value: 18, color: '#059669' },
  { name: 'Buena (70–90%)',  value: 7,  color: '#3b82f6' },
  { name: 'Regular (50–70%)',value: 2,  color: '#f59e0b' },
  { name: 'Crítica (<50%)',  value: 1,  color: '#dc2626' },
];

const installations = [
  { id: 1, name: 'Planta Industrial Norte', cap: '2,5 MWp', status: 'En línea', battery: 92,  power: '1.250 kW', gen: '612 MWh',  risk: 'Bajo' },
  { id: 2, name: 'Centro Comercial Solar',  cap: '1,2 MWp', status: 'En línea', battery: 88,  power: '830 kW',   gen: '398 MWh',  risk: 'Medio' },
  { id: 3, name: 'Planta Logística Sur',    cap: '1,8 MWp', status: 'En línea', battery: 78,  power: '640 kW',   gen: '287 MWh',  risk: 'Medio' },
  { id: 4, name: 'Oficinas Corporativas',   cap: '500 kWp', status: 'En línea', battery: 100, power: '420 kW',   gen: '186 MWh',  risk: 'Bajo' },
  { id: 5, name: 'Sucursal Costa',          cap: '750 kWp', status: 'Alerta',   battery: 45,  power: '120 kW',   gen: '52 MWh',   risk: 'Alto' },
];

const recentTelemetry = [
  { inst: 'Planta Industrial Norte', device: 'Inversor 3',       value: '1.250 kW', status: 'En línea' },
  { inst: 'Centro Comercial Solar',  device: 'Batería 2',        value: '86%',      status: 'En línea' },
  { inst: 'Planta Logística Sur',    device: 'Medidor Principal', value: '640 kW',  status: 'En línea' },
  { inst: 'Oficinas Corporativas',   device: 'Inversor 1',       value: '420 kW',   status: 'En línea' },
];

const notifications = [
  { id: 1, type: 'alert',   text: 'Alerta crítica en Planta Industrial Norte', sub: 'Inversor 3 – Sobretemperatura',    time: 'Hace 5 min' },
  { id: 2, type: 'warn',    text: 'SLA en riesgo en 2 instalaciones',          sub: 'Requiere atención',                time: 'Hace 15 min' },
  { id: 3, type: 'info',    text: 'Orden #OT-4587 asignada',                   sub: 'Mantenimiento preventivo',         time: 'Hace 35 min' },
  { id: 4, type: 'success', text: 'Respaldo completado',                       sub: 'Todos los datos sincronizados',    time: 'Hace 1 h' },
];

const criticalAlerts = [
  { name: 'Planta Industrial Norte – Inversor 3', sub: 'Sobretemperatura',     time: 'Hace 5 min' },
  { name: 'Sucursal Costa – Batería 1',           sub: 'Estado de carga bajo', time: 'Hace 18 min' },
  { name: 'Planta Logística Sur – String 4.2',    sub: 'Fallo de aislamiento', time: 'Hace 42 min' },
];

const maintenances = [
  { inst: 'Centro Comercial Solar',  type: 'Mantenimiento preventivo', date: '25 may 2025' },
  { inst: 'Planta Industrial Norte', type: 'Limpieza de módulos',      date: '26 may 2025' },
  { inst: 'Oficinas Corporativas',   type: 'Inspección de inversores', date: '27 may 2025' },
];

// ---- Battery donut ----
function BatteryDonut() {
  const total = batteryHealth.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DonutSVG segments={batteryHealth} innerR={46} outerR={64} size={140} />
        <div style={{ position: 'absolute', textAlign: 'center', lineHeight: 1.2 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>92%</div>
          <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>Salud prom.</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {batteryHealth.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--gray-600)' }}>{d.name}</span>
            <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontFamily: 'var(--font-mono)' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnergySourcesBar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: '72%', background: 'var(--c-green)' }} />
        <div style={{ width: '28%', background: 'var(--c-blue)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--c-amber)', fontSize: 16 }}>☀</span>
            <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--gray-900)' }}>72%</span>
            <span style={{ color: 'var(--gray-500)', fontSize: 11 }}>Solar</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>1.248 MWh</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--gray-900)' }}>28%</span>
            <span style={{ color: 'var(--gray-500)', fontSize: 11 }}>Red eléctrica</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>482 MWh</div>
        </div>
      </div>
    </div>
  );
}

function NotifIcon({ type }) {
  const map = { alert: ['var(--c-red-light)','var(--c-red)','⚠'], warn: ['var(--c-orange-light)','var(--c-orange)','⚡'], info: ['var(--c-blue-light)','var(--c-blue)','ℹ'], success: ['var(--c-green-light)','var(--c-green)','✓'] };
  const [bg, color, icon] = map[type] || map.info;
  return <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{icon}</div>;
}

function RiskBadge({ risk }) {
  const map = { 'Bajo': 'badge badge-online', 'Medio': 'badge badge-maint', 'Alto': 'badge badge-alert' };
  return <span className={map[risk] || 'badge badge-gray'}>{risk}</span>;
}

// ---- Legend row ----
function ChartLegend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
      {items.map(([color, label, dash]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-600)' }}>
          <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke={color} strokeWidth="2" strokeDasharray={dash || ''}/></svg>
          {label}
        </div>
      ))}
    </div>
  );
}

// ---- Dashboard ----
function Dashboard({ onNav }) {
  const [period, setPeriod] = React.useState('Hoy');

  return (
    <div className="page-content">
      {/* KPI row */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
        <MetricCard icon={<Icons.building />} iconBg="var(--c-green-light)" iconColor="var(--c-green)"   label="Instalaciones activas"  value="128"        delta="+5 vs. ayer"     deltaDir="up" />
        <MetricCard icon={<Icons.zap />}      iconBg="var(--c-blue-light)"  iconColor="var(--c-blue)"    label="Generación solar hoy"   value="1.248"  unit="MWh" delta="+12,6% vs. ayer" deltaDir="up" />
        <MetricCard icon={<Icons.dollar />}   iconBg="var(--c-teal-light)"  iconColor="var(--c-teal)"    label="Ahorro estimado"        value="$186.540"   delta="+5 vs. ayer"  deltaDir="up" />
        <MetricCard icon={<Icons.alert />}    iconBg="var(--c-red-light)"   iconColor="var(--c-red)"     label="Alertas críticas"       value="12"         delta="+2 vs. ayer"     deltaDir="down" />
        <MetricCard icon={<Icons.clipboard />}iconBg="var(--c-orange-light)"iconColor="var(--c-orange)"  label="Órdenes abiertas"       value="34"         delta="-3 vs. ayer"     deltaDir="up" />
        <MetricCard icon={<Icons.shield />}   iconBg="var(--c-purple-light)"iconColor="var(--c-purple)"  label="SLA en riesgo"          value="7"          delta="+1 vs. ayer"     deltaDir="down" />
      </div>

      {/* Main chart + right panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Generación y consumo en tiempo real <span className="info-icon"><Icons.info /></span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select className="header-select" value={period} onChange={e => setPeriod(e.target.value)}>
                {['Hoy','7 días','30 días'].map(o => <option key={o}>{o}</option>)}
              </select>
              <span className="header-live" style={{ fontSize: 11 }}><span className="header-live-dot" />En vivo</span>
            </div>
          </div>
          <ChartLegend items={[['#059669','Generación solar (kW)'],['#1d4ed8','Consumo (kW)'],['#d97706','Export. red (kW)','4 3'],['#7c3aed','Import. red (kW)','4 3']]} />
          <AreaSVGChart data={chartData} height={220} xKey="hora" intervalX={4}
            areas={[{ key: 'Solar (kW)', color: '#059669' }, { key: 'Consumo (kW)', color: '#1d4ed8' }]}
            lines={[{ key: 'Export. red (kW)', color: '#d97706', dash: '4 3', width: 1.5 }, { key: 'Import. red (kW)', color: '#7c3aed', dash: '4 3', width: 1.5 }]}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Salud de baterías <span className="info-icon"><Icons.info /></span></span>
              <span className="card-link">Ver detalle</span>
            </div>
            <BatteryDonut />
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Fuentes de energía hoy <span className="info-icon"><Icons.info /></span></span>
              <span className="card-link">Ver detalle</span>
            </div>
            <EnergySourcesBar />
          </div>
        </div>
      </div>

      {/* Telemetry + Weather */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Telemetría reciente <span className="info-icon"><Icons.info /></span></span>
            <span className="card-link">Ver todas</span>
          </div>
          {recentTelemetry.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < recentTelemetry.length-1 ? '1px solid var(--gray-100)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', flexShrink: 0 }}><Icons.activity /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.inst}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{t.device}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)', marginRight: 8 }}>{t.value}</div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Clima e irradiancia <span className="info-icon"><Icons.info /></span></span>
            <span className="card-link">Ver pronóstico</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>☀</div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>26°C</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>Despejado</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Irradiancia actual</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-amber)' }}>850 W/m²</div>
              <div style={{ fontSize: 11, color: 'var(--c-green)' }}>Óptima</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--gray-600)', marginBottom: 10, flexWrap: 'wrap' }}>
            <span>Humedad <strong>32%</strong></span><span>Viento <strong>14 km/h NE</strong></span><span>Amanecer <strong>06:22</strong></span><span>Atardecer <strong>18:04</strong></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, textAlign: 'center' }}>
            {[['Ahora','☀','850'],['15:00','☀','920'],['18:00','🌤','870'],['21:00','🌙','520'],['00:00','🌙','120']].map(([t,ic,v]) => (
              <div key={t} style={{ background: 'var(--gray-50)', borderRadius: 6, padding: '6px 4px' }}>
                <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 2 }}>{t}</div>
                <div style={{ fontSize: 16 }}>{ic}</div>
                <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Installations table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Instalaciones</span><span className="card-link" onClick={() => onNav('instalaciones')}>Ver todas</span></div>
        <table className="data-table">
          <thead><tr><th>Instalación</th><th>Estado</th><th>Batería</th><th>Potencia actual</th><th>Generación hoy</th><th>Riesgo</th><th>Acciones</th></tr></thead>
          <tbody>
            {installations.map(inst => (
              <tr key={inst.id}>
                <td><div style={{ fontWeight: 600 }}>{inst.name}</div><div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{inst.cap}</div></td>
                <td><StatusBadge status={inst.status} /></td>
                <td style={{ minWidth: 120 }}><BatteryBar pct={inst.battery} /></td>
                <td className="mono">{inst.power}</td>
                <td className="mono">{inst.gen}</td>
                <td><RiskBadge risk={inst.risk} /></td>
                <td><div className="icon-actions">
                  <button className="btn btn-icon btn-secondary"><Icons.barChart /></button>
                  <button className="btn btn-icon btn-secondary" onClick={() => onNav('instalacion')}><Icons.eye /></button>
                  <button className="btn btn-icon btn-secondary"><Icons.moreVert /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alerts + Maintenance + Notifications */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title" style={{ color: 'var(--c-red)' }}>⚠ Alertas críticas</span><span className="card-link" onClick={() => onNav('alertas')}>Ver todas</span></div>
          {criticalAlerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < criticalAlerts.length-1 ? '1px solid var(--gray-100)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--c-red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--c-red)', fontWeight: 700 }}>⚠</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{a.sub}</div></div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{a.time}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🔧 Próximos mantenimientos</span><span className="card-link" onClick={() => onNav('mantenimiento')}>Ver todos</span></div>
          {maintenances.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < maintenances.length-1 ? '1px solid var(--gray-100)' : 'none', alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-amber)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{m.inst}</div><div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{m.type}</div></div>
              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{m.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Notificaciones recientes <span className="info-icon"><Icons.info /></span></span><span className="card-link" onClick={() => onNav('notificaciones')}>Ver todas</span></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {notifications.map(n => (
            <div key={n.id} style={{ flex: 1, minWidth: 200, display: 'flex', gap: 10, padding: 10, borderRadius: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
              <NotifIcon type={n.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{n.text}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{n.sub}</div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{n.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
