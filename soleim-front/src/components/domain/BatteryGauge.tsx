import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"
import { cn } from "@/lib/cn"

interface BatteryGaugeProps {
  soc: number
  className?: string
  size?: number
}

function socColor(soc: number): string {
  if (soc >= 70) return "var(--color-energy-500)"
  if (soc >= 40) return "var(--color-solar-500)"
  return "var(--color-danger-500)"
}

export function BatteryGauge({ soc, className, size = 140 }: BatteryGaugeProps) {
  const color = socColor(soc)
  const data = [{ value: soc }]

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        innerRadius={size * 0.35}
        outerRadius={size * 0.48}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background={{ fill: "var(--color-neutral-100)" }}
          dataKey="value"
          cornerRadius={8}
          fill={color}
          angleAxisId={0}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular" style={{ color }}>
          {soc}%
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">SOC</span>
      </div>
    </div>
  )
}
