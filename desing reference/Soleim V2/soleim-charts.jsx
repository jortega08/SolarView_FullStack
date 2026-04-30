/* ===== SOLEIM — Lightweight SVG chart components (no external deps) ===== */

// ---- Helpers ----
function svgNum(n) { return isNaN(n) ? 0 : n; }

function calcRange(data, keys) {
  let min = Infinity, max = -Infinity;
  data.forEach(d => keys.forEach(k => {
    const v = +d[k]; if (!isNaN(v)) { if (v < min) min = v; if (v > max) max = v; }
  }));
  return { min: Math.min(0, min), max: max === min ? max + 1 : max };
}

// ---- Area/Line Chart ----
function AreaSVGChart({ data = [], height = 200, xKey = 'hora', areas = [], lines = [], yRight = [], intervalX = 4 }) {
  const VW = 600, VH = height;
  const pad = { t: 8, r: yRight.length ? 36 : 8, b: 26, l: 38 };
  const iw = VW - pad.l - pad.r, ih = VH - pad.t - pad.b;

  const allLeftKeys  = [...areas.map(a => a.key), ...lines.filter(l => !l.right).map(l => l.key)];
  const allRightKeys = [...yRight.map(l => l.key), ...lines.filter(l => l.right).map(l => l.key)];

  const { max: maxL } = calcRange(data, allLeftKeys.length ? allLeftKeys : ['_']);
  const { max: maxR } = allRightKeys.length ? calcRange(data, allRightKeys) : { max: 100 };

  const xPos  = i => svgNum(pad.l + (i / Math.max(data.length - 1, 1)) * iw);
  const yLeft  = v => svgNum(pad.t + ih - (Math.max(0, +v) / (maxL || 1)) * ih);
  const yRight2 = v => svgNum(pad.t + ih - (Math.max(0, +v) / (maxR || 1)) * ih);

  function pathFor(key, isRight) {
    const yFn = isRight ? yRight2 : yLeft;
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i)},${yFn(+d[key] || 0)}`).join(' ');
  }
  function areaFor(key) {
    const pts = data.map((d, i) => `${xPos(i)},${yLeft(+d[key] || 0)}`).join(' L ');
    return `M${xPos(0)},${yLeft(0)} L${pts} L${xPos(data.length - 1)},${yLeft(0)} Z`;
  }

  const gridLines = [0, .25, .5, .75, 1].map(f => ({ v: Math.round(maxL * f), y: yLeft(maxL * f) }));

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: VH, display: 'block', overflow: 'visible' }}>
      <defs>
        {areas.map(a => (
          <linearGradient key={a.key} id={`ag-${a.key.replace(/[^a-zA-Z0-9]/g,'_')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={a.color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={a.color} stopOpacity="0"/>
          </linearGradient>
        ))}
      </defs>

      {/* Grid */}
      {gridLines.map(({ v, y }, i) => (
        <g key={i}>
          <line x1={pad.l} y1={y} x2={pad.l + iw} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
          <text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{v.toLocaleString('es-MX')}</text>
        </g>
      ))}

      {/* Right Y axis */}
      {allRightKeys.length > 0 && [0, .5, 1].map((f, i) => (
        <text key={i} x={pad.l + iw + 4} y={yRight2(maxR * f) + 3} textAnchor="start" fontSize="9" fill="#94a3b8">{Math.round(maxR * f)}</text>
      ))}

      {/* Area fills */}
      {areas.map(a => (
        <path key={`af-${a.key}`} d={areaFor(a.key)} fill={`url(#ag-${a.key.replace(/[^a-zA-Z0-9]/g,'_')})`}/>
      ))}
      {/* Area strokes */}
      {areas.map(a => (
        <path key={`al-${a.key}`} d={pathFor(a.key, false)} fill="none" stroke={a.color} strokeWidth={a.width || 2} strokeLinecap="round" strokeLinejoin="round"/>
      ))}
      {/* Lines */}
      {lines.map(l => (
        <path key={`ll-${l.key}`} d={pathFor(l.key, !!l.right)} fill="none" stroke={l.color} strokeWidth={l.width || 1.5} strokeDasharray={l.dash || ''} strokeLinecap="round" strokeLinejoin="round"/>
      ))}

      {/* X axis labels */}
      {data.map((d, i) => {
        if (i % intervalX !== 0 && i !== data.length - 1) return null;
        return <text key={i} x={xPos(i)} y={VH - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">{d[xKey]}</text>;
      })}

      {/* X axis */}
      <line x1={pad.l} y1={pad.t + ih} x2={pad.l + iw} y2={pad.t + ih} stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}

// ---- Donut Chart ----
function DonutSVG({ segments = [], innerR = 48, outerR = 66, size = 140 }) {
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;

  function arc(pct, start) {
    const a = start * 2 * Math.PI - Math.PI / 2;
    const b = (start + pct) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + outerR * Math.cos(a), y1 = cy + outerR * Math.sin(a);
    const x2 = cx + outerR * Math.cos(b), y2 = cy + outerR * Math.sin(b);
    const x3 = cx + innerR * Math.cos(b), y3 = cy + innerR * Math.sin(b);
    const x4 = cx + innerR * Math.cos(a), y4 = cy + innerR * Math.sin(a);
    const large = pct > 0.5 ? 1 : 0;
    return `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${large} 0 ${x4},${y4} Z`;
  }

  let startAngle = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const path = arc(pct, startAngle);
        startAngle += pct;
        return <path key={i} d={path} fill={seg.color} stroke="#fff" strokeWidth="2"/>;
      })}
    </svg>
  );
}

// ---- Bar Chart ----
function BarSVGChart({ data = [], keys = [], colors = [], stacked = false, height = 160, xKey = 'day', grouped = false }) {
  const VW = 560, VH = height;
  const pad = { t: 8, r: 8, b: 26, l: 36 };
  const iw = VW - pad.l - pad.r, ih = VH - pad.t - pad.b;

  const maxY = stacked
    ? Math.max(...data.map(d => keys.reduce((s, k) => s + (+d[k] || 0), 0)))
    : Math.max(...data.flatMap(d => keys.map(k => +d[k] || 0)));
  const maxVal = maxY || 1;

  const colW = iw / data.length;
  const barPad = grouped ? colW * 0.08 : colW * 0.15;
  const barW = grouped ? (colW - barPad * 2) / keys.length : colW - barPad * 2;

  const gridLines = [0, .25, .5, .75, 1].map(f => ({ v: Math.round(maxVal * f), y: pad.t + ih - (maxVal * f / maxVal) * ih }));

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: VH, display: 'block' }}>
      {gridLines.map(({ v, y }, i) => (
        <g key={i}>
          <line x1={pad.l} y1={y} x2={pad.l + iw} y2={y} stroke="#f1f5f9" strokeWidth="1"/>
          <text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
        </g>
      ))}

      {data.map((d, di) => {
        const baseX = pad.l + di * colW + barPad;
        let stackY = pad.t + ih;
        return keys.map((k, ki) => {
          const val = +d[k] || 0;
          const bh = (val / maxVal) * ih;
          if (stacked) {
            stackY -= bh;
            return <rect key={k} x={baseX} y={stackY} width={Math.max(0, barW - 2)} height={Math.max(0, bh)} fill={colors[ki] || '#3b82f6'} rx={ki === keys.length - 1 ? 2 : 0}/>;
          }
          const bx = baseX + ki * barW;
          return <rect key={k} x={bx} y={pad.t + ih - bh} width={Math.max(0, barW - 1)} height={Math.max(0, bh)} fill={colors[ki] || '#3b82f6'} rx="2"/>;
        });
      })}

      {data.map((d, i) => (
        <text key={i} x={pad.l + i * colW + colW / 2} y={VH - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">{d[xKey]}</text>
      ))}
      <line x1={pad.l} y1={pad.t + ih} x2={pad.l + iw} y2={pad.t + ih} stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}

// ---- Semi-circle gauge ----
function SemiGauge({ pct = 86, size = 160, color }) {
  const r = (size / 2) * 0.72, sw = 13, cx = size / 2, cy = size * 0.56;
  const gaugeColor = color || (pct >= 70 ? 'var(--c-green)' : pct >= 40 ? 'var(--c-amber)' : 'var(--c-red)');
  const total = Math.PI * r;
  const fill  = total * (pct / 100);
  return (
    <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--gray-200)" strokeWidth={sw} strokeLinecap="round"/>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={gaugeColor} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${fill} ${total}`}/>
    </svg>
  );
}

// ---- Export ----
Object.assign(window, { AreaSVGChart, DonutSVG, BarSVGChart, SemiGauge });
