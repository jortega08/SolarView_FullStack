import { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
import { Zap, Sun, TrendingUp, TrendingDown, Calendar, Download } from "lucide-react"

const MONTH_MAP = {
  Ene: 0,
  Feb: 1,
  Mar: 2,
  Abr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dic: 11,
}

// Normaliza lo que venga del backend a { date, label, solar, electrica, ... }
function normalizeData(rawData, period) {
  if (!rawData || !Array.isArray(rawData)) return []

  return rawData
    .map((item) => {
      let date = null
      if (item.fecha) {
        date = new Date(item.fecha)
      } else if (item.bucket_start) {
        date = new Date(item.bucket_start)
      } else if (item.año && item.mes) {
        const monthIndex =
          typeof item.mes === "string"
            ? MONTH_MAP[item.mes] ?? 0
            : (item.mes ?? 1) - 1
        const day = item.dia ?? 1
        date = new Date(item.año, monthIndex, day)
      }
      const solar = item.solar ?? item.solar_kwh ?? 0
      const electrica = item.electrica ?? item.electrica_kwh ?? 0
      let label = ""
      if (period === "year" && item.mes && item.año) {
        label = `${item.mes} ${item.año}`
      } else if (date instanceof Date && !isNaN(date)) {
        if (period === "week" || period === "month" || period === "custom") {
          label = date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
          })
        } else if (period === "year") {
          label = date.toLocaleDateString("es-ES", {
            month: "short",
            year: "numeric",
          })
        } else {
          label = date.toLocaleDateString("es-ES")
        }
      } else if (item.mes) {
        label = item.mes
      } else {
        label = item.label ?? ""
      }
      return {
        ...item,
        date,
        label,
        solar,
        electrica,
      }
    })
    .sort((a, b) => {
      if (a.date && b.date) return a.date - b.date
      return 0
    })
}

// Agrupa y suma los consumos por período
function groupAndSumData(data, period) {
  const grouped = {}
  console.log("Datos del mes actual:", data)

  data.forEach((item) => {
    let dateObj = item.date instanceof Date ? item.date : (item.fecha ? new Date(item.fecha) : null)
    let key = ""
    if (!dateObj || isNaN(dateObj)) return

    switch (period) {
      case "week":
      case "month":
      case "custom":
        key = dateObj.toISOString().slice(0, 10) // YYYY-MM-DD
        break
      case "year":
        key = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) // YYYY-M
        break
      default:
        key = dateObj.toISOString().slice(0, 10)
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: dateObj,
        label:
          period === "year"
            ? dateObj.toLocaleDateString("es-ES", { month: "short", year: "numeric" })
            : dateObj.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
        solar: 0,
        electrica: 0,
      }
    }
    grouped[key].solar += item.solar || 0
    grouped[key].electrica += item.electrica || 0
  })

  return Object.values(grouped).sort((a, b) => a.date - b.date)
}

export default function ActivitiesChart({ data, periodo = "year", onPeriodChange }) {
  const [hoveredBar, setHoveredBar] = useState(null)
  const [selectedBar, setSelectedBar] = useState(null)

  const period = periodo

  // Filtrado, normalizado, agrupado
  const filteredData = useMemo(() => {
    const normData = normalizeData(data, period)
    return groupAndSumData(normData, period)
  }, [data, period])

  // Estadísticas
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalElectrica: 0,
        totalSolar: 0,
        total: 0,
        solarPercentage: 0,
        electricaPercentage: 0,
        trend: "up",
        trendPercentage: 0,
      }
    }

    const totalElectrica = filteredData.reduce(
      (sum, item) => sum + (item.electrica || 0),
      0
    )
    const totalSolar = filteredData.reduce(
      (sum, item) => sum + (item.solar || 0),
      0
    )
    const total = totalElectrica + totalSolar
    const solarPercentage = total > 0 ? ((totalSolar / total) * 100).toFixed(1) : 0
    const electricaPercentage =
      total > 0 ? ((totalElectrica / total) * 100).toFixed(1) : 0

    const midPoint = Math.floor(filteredData.length / 2)
    const firstHalf = filteredData.slice(0, midPoint)
    const secondHalf = filteredData.slice(midPoint)
    const firstHalfTotal = firstHalf.reduce(
      (sum, item) => sum + (item.solar || 0) + (item.electrica || 0),
      0
    )
    const secondHalfTotal = secondHalf.reduce(
      (sum, item) => sum + (item.solar || 0) + (item.electrica || 0),
      0
    )
    const trend = secondHalfTotal >= firstHalfTotal ? "up" : "down"
    const trendPercentage =
      firstHalfTotal > 0
        ? Math.abs(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100).toFixed(1)
        : 0

    return {
      totalElectrica,
      totalSolar,
      total,
      solarPercentage,
      electricaPercentage,
      trend,
      trendPercentage,
    }
  }, [filteredData])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload
      const total = (row.electrica || 0) + (row.solar || 0)
      const electricaPercent = total > 0 ? ((row.electrica / total) * 100).toFixed(1) : 0
      const solarPercent = total > 0 ? ((row.solar / total) * 100).toFixed(1) : 0

      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e5e7eb",
            minWidth: "200px",
          }}
        >
          <p
            style={{
              margin: "0 0 12px 0",
              fontWeight: "600",
              fontSize: "14px",
              color: "#1e293b",
            }}
          >
            {row.label}
          </p>
          {/* eléctrica */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <Zap size={16} style={{ color: "#1e293b" }} />
              <span style={{ fontSize: "13px", color: "#64748b" }}>Eléctrica:</span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginLeft: "auto",
                }}
              >
                {(row.electrica || 0).toFixed(2)} kWh
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                paddingLeft: "24px",
              }}
            >
              {electricaPercent}% del total
            </div>
          </div>
          {/* solar */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <Sun size={16} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "13px", color: "#64748b" }}>Solar:</span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#f59e0b",
                  marginLeft: "auto",
                }}
              >
                {(row.solar || 0).toFixed(2)} kWh
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                paddingLeft: "24px",
              }}
            >
              {solarPercent}% del total
            </div>
          </div>
          {/* total */}
          <div
            style={{
              paddingTop: "8px",
              borderTop: "1px solid #e5e7eb",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#64748b",
                }}
              >
                Total:
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#1e293b",
                }}
              >
                {total.toFixed(2)} kWh
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const handleExport = () => {
    const csvContent = [
      ["Período", "Eléctrica (kWh)", "Solar (kWh)", "Total (kWh)"],
      ...filteredData.map((item) => [
        item.label,
        (item.electrica || 0).toFixed(2),
        (item.solar || 0).toFixed(2),
        ((item.electrica || 0) + (item.solar || 0)).toFixed(2),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `consumo-energia-${period}-${new Date()
      .toISOString()
      .split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "48px 24px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          textAlign: "center",
          color: "#64748b",
        }}
      >
        <Calendar size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: "16px" }}>
          No hay datos para el período seleccionado
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* header + botones de periodo */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            Consumo Energético del Hogar
          </h3>
          <button
            onClick={handleExport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "#f1f5f9",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              color: "#475569",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#e2e8f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#f1f5f9")
            }
          >
            <Download size={16} />
            Exportar
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setSelectedBar(null)
              onPeriodChange && onPeriodChange("week")
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: period === "week" ? "#3b82f6" : "#f8fafc",
              color: period === "week" ? "white" : "#64748b",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Calendar size={16} />
            Última semana
          </button>

          <button
            onClick={() => {
              setSelectedBar(null)
              onPeriodChange && onPeriodChange("month")
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: period === "month" ? "#3b82f6" : "#f8fafc",
              color: period === "month" ? "white" : "#64748b",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Calendar size={16} />
            Último mes
          </button>

          <button
            onClick={() => {
              setSelectedBar(null)
              onPeriodChange && onPeriodChange("year")
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: period === "year" ? "#3b82f6" : "#f8fafc",
              color: period === "year" ? "white" : "#64748b",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Calendar size={16} />
            Año completo
          </button>
        </div>
      </div>

      {/* aquí irían las cards de stats usando "stats" (como ya las tenías) */}

      <div style={{ height: "400px", marginBottom: "16px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            onMouseMove={(e) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setHoveredBar(e.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setHoveredBar(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              style={{ fontSize: "13px", fontWeight: "500" }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: "13px", fontWeight: "500" }}
              label={{
                value: "kWh",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#64748b" },
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  {value === "electrica" ? "Energía Eléctrica" : "Energía Solar"}
                </span>
              )}
            />
            <Bar
              dataKey="electrica"
              fill="#1e293b"
              radius={[8, 8, 0, 0]}
              onClick={(_, index) => setSelectedBar(index)}
            >
              {filteredData.map((_, index) => (
                <Cell
                  key={`cell-electrica-${index}`}
                  fill={
                    hoveredBar === index || selectedBar === index
                      ? "#0f172a"
                      : "#1e293b"
                  }
                  style={{ cursor: "pointer" }}
                />
              ))}
            </Bar>
            <Bar
              dataKey="solar"
              fill="#f59e0b"
              radius={[8, 8, 0, 0]}
              onClick={(_, index) => setSelectedBar(index)}
            >
              {filteredData.map((_, index) => (
                <Cell
                  key={`cell-solar-${index}`}
                  fill={
                    hoveredBar === index || selectedBar === index
                      ? "#d97706"
                      : "#f59e0b"
                  }
                  style={{ cursor: "pointer" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* aquí va tu resumen usando stats.total, stats.solarPercentage, etc. */}
    </div>
  )
}
