/* ===== SOLEIM — Mantenimiento y técnicos ===== */

// ---- Mock data ----
const calendarDays = [
  { day: 28, prev: true,  events: [] },
  { day: 29, prev: true,  events: [] },
  { day: 30, prev: true,  events: [] },
  { day: 1,  events: [] },
  { day: 2,  events: [] },
  { day: 3,  events: [] },
  { day: 4,  events: [] },
  { day: 5,  events: [] },
  { day: 6,  events: [{ type: 'inspeccion', label: 'Inspección Planta Norte', color: 'var(--c-blue)' }] },
  { day: 7,  events: [] },
  { day: 8,  events: [{ type: 'preventivo', label: '3 preventivos', color: 'var(--c-green)' }] },
  { day: 9,  events: [] },
  { day: 10, events: [] },
  { day: 11, events: [] },
  { day: 12, events: [] },
  { day: 13, events: [] },
  { day: 14, events: [{ type: 'revision', label: 'Revisión Oficinas Corp.', color: 'var(--c-purple)' }] },
  { day: 15, events: [{ type: 'correctivo', label: 'Correctivo Sucursal Costa', color: 'var(--c-red)' }] },
  { day: 16, events: [] },
  { day: 17, events: [] },
  { day: 18, events: [] },
  { day: 19, events: [{ type: 'preventivo', label: '2 preventivos', color: 'var(--c-green)' }] },
  { day: 20, events: [] },
  { day: 21, events: [] },
  { day: 22, events: [{ type: 'inspeccion', label: 'Inspección Batería 1', color: 'var(--c-blue)' }] },
  { day: 23, events: [] },
  { day: 24, today: true, events: [] },
  { day: 25, events: [] },
  { day: 26, events: [{ type: 'preventivo', label: 'Preventivo Centro Solar', color: 'var(--c-green)' }] },
  { day: 27, events: [] },
  { day: 28, events: [] },
  { day: 29, events: [] },
  { day: 30, events: [] },
  { day: 31, events: [] },
  { day: 1, next: true, events: [] },
];

const maintenanceTasks = [
  { inst: 'Planta Industrial Norte', cap: '2,5 MWp', tipo: 'Preventivo', fecha: '24 may 2025 09:00', prioridad: 'Alta',  tech: 'Juan Pérez',  contrato: 'PREM-001', estado: 'Programado' },
  { inst: 'Centro Comercial Solar',  cap: '1,2 MWp', tipo: 'Inspección', fecha: '24 may 2025 11:00', prioridad: 'Baja',  tech: 'María López', contrato: 'EST-004', estado: 'Programado' },
  { inst: 'Planta Logística Sur',    cap: '1,8 MWp', tipo: 'Preventivo', fecha: '25 may 2025 08:00', prioridad: 'Media', tech: 'Carlos Ruiz', contrato: 'PREM-002', estado: 'Programado' },
  { inst: 'Oficinas Corporativas',   cap: '500 kWp', tipo: 'Revisión',   fecha: '27 may 2025 14:00', prioridad: 'Baja',  tech: 'Ana Torres',  contrato: 'BAS-001', estado: 'Programado' },
  { inst: 'Sucursal Costa',          cap: '750 kWp', tipo: 'Correctivo', fecha: '28 may 2025 08:00', prioridad: 'Alta',  tech: 'Luis Vega',   contrato: 'EST-003', estado: 'Programado' },
];

const technicians = [
  { name: 'Juan Pérez',   esp: 'Solar FV',  zona: 'Norte',  load: 45, status: 'Disponible', initials: 'JP' },
  { name: 'María López',  esp: 'Eléctrica', zona: 'Centro', load: 30, status: 'Disponible', initials: 'ML' },
  { name: 'Carlos Ruiz',  esp: 'Mecánica',  zona: 'Sur',    load: 60, status: 'Disponible', initials: 'CR' },
  { name: 'Ana Torres',   esp: 'Eléctrica', zona: 'Centro', load: 20, status: 'Disponible', initials: 'AT' },
  { name: 'Luis Vega',    esp: 'Solar FV',  zona: 'Costa',  load: 85, status: 'En tarea',   initials: 'LV' },
];

const contracts = [
  { id: 'PREM-001', inst: 'Planta Industrial Norte', plan: 'Premium',  renewal: '24 jun 2025', sla: '8 h' },
  { id: 'PREM-002', inst: 'Planta Logística Sur',    plan: 'Premium',  renewal: '15 jul 2025', sla: '8 h' },
  { id: 'EST-004',  inst: 'Sucursal Costa',           plan: 'Estándar', renewal: '02 ago 2025', sla: '12 h' },
  { id: 'EST-004B', inst: 'Centro Comercial Solar',   plan: 'Estándar', renewal: '18 ago 2025', sla: '12 h' },
  { id: 'BAS-001',  inst: 'Oficinas Corporativas',    plan: 'Básico',   renewal: '05 sep 2025', sla: '24 h' },
];

const checklist = [
  { item: '1. Inspección visual de módulos',   status: 'Completado', done: true },
  { item: '2. Limpieza de módulos',            status: 'Completado', done: true },
  { item: '3. Revisión de conexiones DC',      status: 'Pendiente',  done: false },
  { item: '4. Prueba de aislamiento',          status: 'Pendiente',  done: false },
  { item: '5. Verificación de inversores',     status: 'Completado', done: true },
];

const weekDays = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];

// ---- Calendar ----
function MaintenanceCalendar() {
  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Semana','Mes'].map(v => (
            <button key={v} className={`btn btn-sm ${v === 'Mes' ? 'btn-primary' : 'btn-secondary'}`}>{v}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-icon btn-secondary">‹</button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>mayo 2025</span>
          <button className="btn btn-icon btn-secondary">›</button>
          <button className="btn btn-secondary btn-sm">Hoy</button>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
          {[['var(--c-green)','Preventivo'],['var(--c-red)','Correctivo'],['var(--c-blue)','Inspección'],['var(--c-purple)','Revisión']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</div>
          ))}
        </div>
      </div>
      {/* Week day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
        {weekDays.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', padding: '4px 0' }}>{d}</div>)}
      </div>
      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {calendarDays.map((d, i) => (
          <div key={i} style={{
            minHeight: 64, padding: '4px 6px', borderRadius: 6,
            background: d.today ? 'var(--c-blue-light)' : d.prev || d.next ? 'transparent' : 'var(--gray-50)',
            border: d.today ? '2px solid var(--c-blue)' : '1px solid var(--gray-200)',
            opacity: d.prev || d.next ? .4 : 1,
          }}>
            <div style={{ fontSize: 12, fontWeight: d.today ? 700 : 400, color: d.today ? 'var(--c-blue)' : 'var(--gray-700)', marginBottom: 3, textAlign: 'center',
              ...(d.today ? { background: 'var(--c-blue)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' } : {}) }}>{d.day}</div>
            {d.events.map((ev, j) => (
              <div key={j} style={{ background: ev.color, color: '#fff', borderRadius: 4, padding: '2px 5px', fontSize: 9, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.label}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Technician load bar ----
function TechLoad({ pct }) {
  const color = pct < 50 ? 'var(--c-green)' : pct < 75 ? 'var(--c-amber)' : 'var(--c-red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// ---- Plan badge ----
function PlanBadge({ plan }) {
  const map = { 'Premium': 'badge badge-purple', 'Estándar': 'badge badge-info', 'Básico': 'badge badge-gray' };
  return <span className={map[plan] || 'badge badge-gray'}>{plan}</span>;
}

// ---- Main page ----
function Mantenimiento() {
  return (
    <div className="page-content">
      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Gestione mantenimientos, técnicos y contratos de servicio</div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
        {[
          { icon: <Icons.calendar />,  bg: 'var(--c-blue-light)',   color: 'var(--c-blue)',   label: 'Mantenimientos programados', value: '48', delta: '+15 vs. mes anterior', dir: 'up' },
          { icon: <Icons.fileText />,  bg: 'var(--c-green-light)',  color: 'var(--c-green)',  label: 'Contratos activos',          value: '27', delta: '+3 vs. mes anterior', dir: 'up' },
          { icon: <Icons.users />,     bg: 'var(--c-teal-light)',   color: 'var(--c-teal)',   label: 'Técnicos disponibles',       value: '12', delta: '+4 vs. hoy', dir: 'up' },
          { icon: <Icons.alert />,     bg: 'var(--c-red-light)',    color: 'var(--c-red)',    label: 'Mantenimientos vencidos',    value: '3',  delta: '-1 vs. ayer', dir: 'up' },
          { icon: <Icons.shield />,    bg: 'var(--c-purple-light)', color: 'var(--c-purple)', label: 'Cumplimiento SLA',           value: '96%', delta: '+4% vs. mes anterior', dir: 'up' },
        ].map(k => <MetricCard key={k.label} {...k} deltaDir={k.dir} />)}
      </div>

      {/* Calendar + Technician availability */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap-md)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Calendario de mantenimientos programados <span className="info-icon"><Icons.info /></span></span>
            <button className="btn btn-primary btn-sm"><Icons.plus />Programar mantenimiento</button>
          </div>
          <MaintenanceCalendar />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          {/* Technician availability */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Disponibilidad de técnicos <span className="info-icon"><Icons.info /></span></span>
              <span className="card-link">Ver todos</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {technicians.map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--c-blue),var(--c-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-800)' }}>{t.name}</span>
                      <span className={`badge ${t.status === 'Disponible' ? 'badge-online' : 'badge-warn'}`} style={{ fontSize: 9 }}>● {t.status}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 4 }}>{t.esp} · {t.zona}</div>
                    <TechLoad pct={t.load} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment suggestion */}
          <div className="card" style={{ background: 'var(--c-blue-light)', border: '1px solid var(--c-blue-mid)' }}>
            <div className="card-header" style={{ marginBottom: 10 }}>
              <span className="card-title" style={{ color: 'var(--c-blue)' }}>Sugerencia de asignación <span className="info-icon"><Icons.info /></span></span>
              <span className="card-link" style={{ fontSize: 12 }}>✕</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>Planta Industrial Norte</div>
                <div style={{ color: 'var(--gray-500)', fontSize: 11 }}>Preventivo · 24 may 2025</div>
              </div>
              <span style={{ color: 'var(--c-blue)', fontSize: 18 }}>→</span>
              <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>Juan Pérez</div>
                <div style={{ color: 'var(--c-green)', fontSize: 11 }}>Disponible · 45% carga</div>
              </div>
            </div>
            <button className="btn btn-green btn-sm" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>Asignar</button>
          </div>
        </div>
      </div>

      {/* Maintenance tasks table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Tareas de mantenimiento programadas <span className="info-icon"><Icons.info /></span></span>
          <span className="card-link">Ver todas</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Instalación</th><th>Tipo</th><th>Fecha</th><th>Prioridad</th><th>Técnico asignado</th><th>Contrato</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {maintenanceTasks.map((t, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.inst}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{t.cap}</div>
                </td>
                <td><span className="badge badge-info">{t.tipo}</span></td>
                <td className="mono" style={{ fontSize: 12 }}>{t.fecha}</td>
                <td><SevBadge sev={t.prioridad} /></td>
                <td style={{ fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,var(--c-blue),var(--c-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.tech.split(' ').map(n=>n[0]).join('')}</div>
                    {t.tech}
                  </div>
                </td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray-600)' }}>{t.contrato}</span></td>
                <td><WOBadge status={t.estado} /></td>
                <td>
                  <div className="icon-actions">
                    <button className="btn btn-icon btn-secondary" title="Ver"><Icons.eye /></button>
                    <button className="btn btn-icon btn-secondary" title="Editar"><Icons.edit /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm"><Icons.users />Asignar técnico</button>
            <button className="btn btn-secondary btn-sm"><Icons.clipboard />Generar orden</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
            Mostrando 1–5 de 48 tareas
            {[1,2,3,'...',10].map(p => (
              <button key={p} className={`btn btn-sm ${p === 1 ? 'btn-primary' : 'btn-secondary'}`} style={{ minWidth: 28, padding: '4px 8px' }}>{p}</button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm"><Icons.download />Exportar</button>
        </div>
      </div>

      {/* Service contracts + Checklist */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Contratos de servicio</span>
            <span className="card-link">Ver todos</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Contrato</th><th>Instalación</th><th>Plan</th><th>Próx. renovación</th><th>SLA</th></tr></thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--c-blue)' }}>{c.id}</span></td>
                  <td style={{ fontSize: 12 }}>{c.inst}</td>
                  <td><PlanBadge plan={c.plan} /></td>
                  <td className="mono" style={{ fontSize: 11 }}>{c.renewal}</td>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{c.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Checklist preventivo</span>
            <span className="card-link">Ver todos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, background: 'var(--gray-200)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: 'var(--c-amber)', borderRadius: 4 }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-amber)' }}>60%</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 10 }}>Planta Industrial Norte – Preventivo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checklist.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: c.done ? 'var(--c-green)' : 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {c.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontSize: 12, color: c.done ? 'var(--gray-500)' : 'var(--gray-800)', textDecoration: c.done ? 'line-through' : 'none' }}>{c.item}</span>
                <span className={`badge ${c.done ? 'badge-online' : 'badge-warn'}`} style={{ fontSize: 10 }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Mantenimiento = Mantenimiento;
