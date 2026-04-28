import ReactECharts from "echarts-for-react"
import type { EChartsOption } from "echarts"
import { useMemo } from "react"
import type { TendenciaPunto } from "@/types/domain"

interface AreaTimeSeriesProps {
  data: TendenciaPunto[]
  height?: number
}

const SERIES_CONFIG = [
  { key: "generacion" as const, name: "Generación solar (kW)", color: "#16a34a" },
  { key: "consumo" as const, name: "Consumo (kW)", color: "#2563eb" },
  { key: "exportacion" as const, name: "Exportación a red (kW)", color: "#d97706" },
  { key: "importacion" as const, name: "Importación de red (kW)", color: "#9333ea" },
]

export function AreaTimeSeries({ data, height = 260 }: AreaTimeSeriesProps) {
  const option: EChartsOption = useMemo(() => {
    const labels = data.map((d) => d.fecha)
    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "#fff",
        borderColor: "#e2e8f0",
        textStyle: { color: "#0f172a", fontSize: 12 },
        axisPointer: { type: "cross", lineStyle: { color: "#94a3b8" } },
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: "#64748b" },
      },
      grid: { top: 10, left: 12, right: 12, bottom: 40, containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisTick: { show: false },
        axisLabel: { color: "#94a3b8", fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#94a3b8", fontSize: 11, formatter: (v: number) => `${v} kW` },
        splitLine: { lineStyle: { color: "#f1f5f9" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: SERIES_CONFIG.map((s) => ({
        name: s.name,
        type: "line" as const,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: s.color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: s.color + "33" },
              { offset: 1, color: s.color + "05" },
            ],
          },
        },
        data: data.map((d) => d[s.key] ?? 0),
      })),
    }
  }, [data])

  return <ReactECharts option={option} style={{ height }} notMerge />
}
