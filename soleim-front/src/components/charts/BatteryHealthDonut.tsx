import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface HealthSegment {
  label: string
  count: number
  color: string
}

const DEFAULT_SEGMENTS: HealthSegment[] = [
  { label: "Óptima (>90%)", count: 0, color: "var(--color-energy-500)" },
  { label: "Buena (70-90%)", count: 0, color: "var(--color-primary-500)" },
  { label: "Regular (50-70%)", count: 0, color: "var(--color-solar-500)" },
  { label: "Crítica (<50%)", count: 0, color: "var(--color-danger-500)" },
]

interface BatteryHealthDonutProps {
  segments?: HealthSegment[]
  promedioSoc?: number
  height?: number
}

export function BatteryHealthDonut({
  segments = DEFAULT_SEGMENTS,
  promedioSoc,
  height = 180,
}: BatteryHealthDonutProps) {
  const data = segments.filter((s) => s.count > 0)
  type DisplayItem = Record<string, unknown> & HealthSegment
  const displayData: DisplayItem[] =
    data.length > 0
      ? data.map((segment) => ({ ...segment }))
      : [{ label: "Sin datos", count: 1, color: "var(--color-neutral-200)" }]

  return (
    <div className="flex items-center gap-4">
      <div style={{ width: height, height, flexShrink: 0 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={displayData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              strokeWidth={0}
            >
              {displayData.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [v, name]}
              contentStyle={{ fontSize: 12, borderColor: "var(--color-border)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        {promedioSoc != null && (
          <p className="text-2xl font-bold tabular text-[var(--color-text-primary)] mb-1">
            {promedioSoc}%
            <span className="text-xs font-normal text-[var(--color-text-secondary)] ml-1">promedio</span>
          </p>
        )}
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-semibold tabular text-[var(--color-text-primary)]">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
