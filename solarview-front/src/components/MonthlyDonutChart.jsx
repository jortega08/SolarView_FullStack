"use client"

import { useState, useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Zap,
  Info,
} from "lucide-react"
import "../styles/MonthlyDonut.css"

/**
 * Espera data en este formato:
 * [
 *   { mes: "Ene", año: 2025, solar: 120.5, electrica: 200.3 },
 *   { mes: "Feb", año: 2025, solar: 90, electrica: 230 },
 *   ...
 * ]
 */
const COLORS = ["#1e293b", "#f59e0b"] // [eléctrica, solar]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="monthly-donut-tooltip">
        <div className="tooltip-title">{item.name}</div>
        <div className="tooltip-value">{item.value.toFixed(2)} kWh</div>
      </div>
    )
  }
  return null
}

const MonthlyDonutChart = ({ data = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(data.length - 1 || 0)

  const current = data[currentIndex] || {
    mes: "",
    año: "",
    solar: 0,
    electrica: 0,
  }

  const chartData = useMemo(() => {
    return [
      { name: "Energía Eléctrica", key: "electrica", value: current.electrica || 0 },
      { name: "Energía Solar", key: "solar", value: current.solar || 0 },
    ]
  }, [current])

  const totals = useMemo(() => {
    const total = (current.electrica || 0) + (current.solar || 0)
    const electricaPerc =
      total > 0 ? ((current.electrica || 0) / total) * 100 : 0
    const solarPerc =
      total > 0 ? ((current.solar || 0) / total) * 100 : 0

    let dominante = "Sin consumo registrado"
    if (total > 0) {
      if (current.electrica > current.solar) dominante = "La energía eléctrica fue la fuente predominante."
      else if (current.solar > current.electrica) dominante = "La energía solar fue la fuente predominante."
      else dominante = "El consumo estuvo balanceado entre energía eléctrica y solar."
    }

    return {
      total,
      electricaPerc: electricaPerc.toFixed(1),
      solarPerc: solarPerc.toFixed(1),
      dominante,
    }
  }, [current])

  const goPrevMonth = () => {
    if (!data.length) return
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length)
  }

  const goNextMonth = () => {
    if (!data.length) return
    setCurrentIndex((prev) => (prev + 1) % data.length)
  }

  return (
    <div className="monthly-donut-card">
      {/* Header */}
      <div className="monthly-donut-header">
        <div className="monthly-donut-title-group">
          <h3 className="monthly-donut-title">Distribución de Consumo Mensual</h3>
          <p className="monthly-donut-subtitle">
            Comparación entre energía eléctrica y energía solar.
          </p>
        </div>

        <div className="monthly-donut-month-switcher">
          <button
            type="button"
            className="monthly-donut-nav-button"
            onClick={goPrevMonth}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="monthly-donut-current-month">
            {current.mes && current.año ? `${current.mes} ${current.año}` : "Sin datos"}
          </div>
          <button
            type="button"
            className="monthly-donut-nav-button"
            onClick={goNextMonth}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="monthly-donut-content">
        <div className="monthly-donut-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={4}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.key}`}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="monthly-donut-center">
            <span className="center-label">Total</span>
            <span className="center-value">
              {totals.total.toFixed(2)} kWh
            </span>
          </div>
        </div>

        <div className="monthly-donut-legend">
          <div className="legend-item">
            <div className="legend-icon electrica">
              <Zap size={16} />
            </div>
            <div className="legend-text">
              <span className="legend-label">Energía Eléctrica</span>
              <span className="legend-value">
                {current.electrica?.toFixed(2) || "0.00"} kWh · {totals.electricaPerc}%
              </span>
            </div>
          </div>

          <div className="legend-item">
            <div className="legend-icon solar">
              <Sun size={16} />
            </div>
            <div className="legend-text">
              <span className="legend-label">Energía Solar</span>
              <span className="legend-value">
                {current.solar?.toFixed(2) || "0.00"} kWh · {totals.solarPerc}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Texto informativo */}
      <div className="monthly-donut-footer">
        <div className="footer-icon">
          <Info size={16} />
        </div>
        <p className="footer-text">
          En <strong>{current.mes || "este mes"}</strong> {current.año || ""} el consumo total fue de{" "}
          <strong>{totals.total.toFixed(2)} kWh</strong>. De este consumo,{" "}
          <strong>{totals.electricaPerc}%</strong> corresponde a energía eléctrica y{" "}
          <strong>{totals.solarPerc}%</strong> a energía solar. {totals.dominante}
        </p>
      </div>
    </div>
  )
}

export default MonthlyDonutChart
