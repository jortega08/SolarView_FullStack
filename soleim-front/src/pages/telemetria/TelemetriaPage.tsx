import { useState, useMemo } from "react"
import { format, subHours, subDays } from "date-fns"
import { Activity, BatteryMedium, RefreshCw, Zap, PlugZap, Thermometer, Gauge } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { MetricCard } from "@/components/data/MetricCard"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { ErrorState } from "@/components/feedback/ErrorState"
import { useInstalaciones } from "@/hooks/useInstalaciones"
import { useTelemetriaConsumos, useTelemetriaBaterias } from "@/hooks/useTelemetria"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from "recharts"
import { cn } from "@/lib/cn"

// ── Tipos de rango temporal ──────────────────────────────────────────────────
type Rango = "6h" | "24h" | "7d" | "30d"
const RANGOS: { value: Rango; label: string }[] = [
  { value: "6h",  label: "6 h" },
  { value: "24h", label: "24 h" },
  { value: "7d",  label: "7 días" },
  { value: "30d", label: "30 días" },
]

function getFechaGte(rango: Rango): string {
  const now = new Date()
  const date =
    rango === "6h"  ? subHours(now, 6)  :
    rango === "24h" ? subHours(now, 24) :
    rango === "7d"  ? subDays(now, 7)   :
                     subDays(now, 30)
  return date.toISOString()
}

function formatFecha(fecha: string, rango: Rango) {
  const d = new Date(fecha)
  return rango === "6h" || rango === "24h"
    ? format(d, "HH:mm")
    : format(d, "dd/MM")
}

// ── Colores ──────────────────────────────────────────────────────────────────
const COLOR_SOLAR     = "var(--color-solar-500)"
const COLOR_ELECTRICA = "var(--color-primary-500)"
const COLOR_BATERIA   = "var(--color-energy-500)"

// ── Tooltip personalizado para la gráfica de consumo ────────────────────────
function TooltipConsumo({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-[var(--color-text-primary)] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="font-medium">{p.name}:</span>
          <span>{p.value.toFixed(3)} kWh</span>
        </p>
      ))}
    </div>
  )
}

// ── Tooltip personalizado para la gráfica de batería ────────────────────────
function TooltipBateria({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-[var(--color-text-primary)] mb-1">{label}</p>
      <p className="text-[var(--color-energy-600)]">
        <span className="font-medium">Estado de carga (SOC):</span> {payload[0].value.toFixed(1)} %
      </p>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function TelemetriaPage() {
  const [instalacionId, setInstalacionId] = useState<number | undefined>()
  const [rango, setRango] = useState<Rango>("24h")

  const { data: instalaciones = [], isLoading: loadingInst } = useInstalaciones()

  const fechaGte = useMemo(() => getFechaGte(rango), [rango])
  const limit = rango === "30d" ? 500 : rango === "7d" ? 300 : 200

  const {
    data: consumosData,
    isLoading: loadingConsumos,   // true sólo la primera vez (sin caché)
    isFetching: fetchingConsumos, // true también en refetch en segundo plano
    isError: errorConsumos,
    refetch,
  } = useTelemetriaConsumos(instalacionId, { fechaGte, limit })

  const {
    data: bateriasData,
    isLoading: loadingBaterias,
    isFetching: fetchingBaterias,
  } = useTelemetriaBaterias(instalacionId, { fechaGte, limit: 100 })

  const consumos = useMemo(() => consumosData?.results ?? [], [consumosData])
  const baterias = useMemo(() => bateriasData?.results ?? [], [bateriasData])

  // ── Últimos valores (métricas) ───────────────────────────────────────────
  const ultimoConsumo    = consumos[consumos.length - 1]
  const ultimaBateria    = baterias[baterias.length - 1]
  const consumoSolar     = consumos.filter(c => c.fuente === "solar")
  const consumoElectrica = consumos.filter(c => c.fuente === "electrica")
  const totalSolar       = consumoSolar.reduce((s, c) => s + (c.energia_consumida ?? 0), 0)
  const totalElectrica   = consumoElectrica.reduce((s, c) => s + (c.energia_consumida ?? 0), 0)
  const pctSolar         = totalSolar + totalElectrica > 0
    ? Math.round((totalSolar / (totalSolar + totalElectrica)) * 100)
    : null

  // ── Datos para gráfica de consumo ────────────────────────────────────────
  const chartConsumo = useMemo(() => {
    const map = new Map<string, { label: string; solar: number; electrica: number }>()
    for (const c of consumos) {
      if (!c.fecha) continue
      const d = new Date(c.fecha)
      if (isNaN(d.getTime())) continue
      const key = formatFecha(c.fecha, rango)
      if (!map.has(key)) map.set(key, { label: key, solar: 0, electrica: 0 })
      const row = map.get(key)!
      if (c.fuente === "solar")     row.solar     += c.energia_consumida ?? 0
      if (c.fuente === "electrica") row.electrica += c.energia_consumida ?? 0
    }
    return Array.from(map.values())
  }, [consumos, rango])

  // ── Datos para gráfica de batería ────────────────────────────────────────
  const chartBateria = useMemo(() =>
    baterias
      .filter(b => b.fecha_registro && !isNaN(new Date(b.fecha_registro).getTime()))
      .map(b => ({
        label: formatFecha(b.fecha_registro, rango),
        soc:   b.porcentaje_carga ?? 0,
      })),
    [baterias, rango]
  )

  // "loading" = primera carga sin datos en caché → muestra skeletons completos
  const loading    = loadingConsumos || loadingBaterias
  // "refreshing" = recargando pero ya hay datos → muestra indicador suave
  const refreshing = !loading && (fetchingConsumos || fetchingBaterias)

  // Nombre de la instalación seleccionada
  const instalacionNombre = instalaciones.find(i => i.id === instalacionId)?.nombre

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Observabilidad operativa"
        title="Telemetría"
        description="Monitoreo en tiempo real de generación, consumo y baterías"
        actions={
          <div className="flex items-center gap-2">
            {/* Indicador suave de refresco automático */}
            {refreshing && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Actualizando…
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={fetchingConsumos}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", fetchingConsumos && "animate-spin")} />
              Actualizar
            </button>
          </div>
        }
      />

      {/* ── Controles ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Selector instalación */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
            Instalación
          </label>
          <select
            value={instalacionId ?? ""}
            onChange={e => setInstalacionId(e.target.value ? Number(e.target.value) : undefined)}
            className="input-ui w-56 text-sm"
          >
            <option value="">Selecciona una instalación</option>
            {loadingInst
              ? <option disabled>Cargando...</option>
              : instalaciones.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre}</option>
                ))
            }
          </select>
        </div>

        {/* Rango temporal */}
        <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
          {RANGOS.map(r => (
            <button
              key={r.value}
              onClick={() => setRango(r.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                rango === r.value
                  ? "bg-[var(--color-primary-600)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Indicador de instalación activa */}
        {instalacionNombre && (
          <span className="text-xs text-[var(--color-text-muted)]">
            Mostrando datos de <span className="font-medium text-[var(--color-text-secondary)]">{instalacionNombre}</span>
          </span>
        )}
      </div>

      {/* ── Sin instalación seleccionada ── */}
      {!instalacionId && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)]">
          <Activity className="mx-auto h-10 w-10 text-[var(--color-text-muted)] mb-3" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Selecciona una instalación</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Elige una instalación del selector para ver sus datos de telemetría
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {instalacionId && errorConsumos && (
        <ErrorState message="No se pudieron cargar los datos de telemetría" onRetry={refetch} />
      )}

      {/* ── Contenido ── */}
      {instalacionId && !errorConsumos && (
        <>
          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Potencia actual"
              description="Consumo instantáneo del último registro"
              value={loading ? "—" : `${ultimoConsumo?.potencia?.toFixed(1) ?? "0"} kW`}
              icon={Zap}
              iconColor="text-[var(--color-solar-600)]"
              iconBg="bg-[var(--color-solar-50)]"
              loading={loading}
            />
            <MetricCard
              title="Energía solar"
              description={`Energía generada desde paneles solares — últimas ${rango === "6h" ? "6 h" : rango === "24h" ? "24 h" : rango === "7d" ? "7 días" : "30 días"}`}
              value={loading ? "—" : `${totalSolar.toFixed(1)} kWh`}
              icon={Activity}
              iconColor="text-[var(--color-solar-600)]"
              iconBg="bg-[var(--color-solar-50)]"
              loading={loading}
            />
            <MetricCard
              title="Energía de red"
              description="Energía consumida desde la red eléctrica pública"
              value={loading ? "—" : `${totalElectrica.toFixed(1)} kWh`}
              icon={PlugZap}
              iconColor="text-[var(--color-primary-600)]"
              iconBg="bg-[var(--color-primary-50)]"
              loading={loading}
              delta={pctSolar != null ? `${pctSolar}% solar` : undefined}
              deltaPositive={pctSolar != null && pctSolar >= 50}
            />
            <MetricCard
              title="Estado de carga (SOC)"
              description="Nivel de carga actual de la batería"
              value={loading ? "—" : ultimaBateria ? `${ultimaBateria.porcentaje_carga?.toFixed(0) ?? "—"} %` : "Sin datos"}
              icon={BatteryMedium}
              iconColor="text-[var(--color-energy-600)]"
              iconBg="bg-[var(--color-energy-50)]"
              loading={loading}
            />
          </div>

          {/* Gráfica consumo solar vs eléctrica */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Energía consumida — Solar vs Red eléctrica</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Kilowatts-hora (kWh) por fuente de energía en el período seleccionado · Eje Y: energía consumida (kWh)
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : chartConsumo.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
                Sin datos para el período seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartConsumo} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLOR_SOLAR}     stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLOR_SOLAR}     stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradElectrica" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLOR_ELECTRICA} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLOR_ELECTRICA} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    unit=" kWh"
                    label={{ value: "Energía (kWh)", angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 10, fill: "var(--color-text-muted)" } }}
                  />
                  <Tooltip content={<TooltipConsumo />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value: string) =>
                      value === "solar" ? "Solar (paneles)" : "Red eléctrica"
                    }
                  />
                  <Area type="monotone" dataKey="solar"     name="solar"     stroke={COLOR_SOLAR}     fill="url(#gradSolar)"     strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="electrica" name="electrica" stroke={COLOR_ELECTRICA} fill="url(#gradElectrica)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfica batería */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Estado de carga de batería (SOC)</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Porcentaje de carga (0–100 %) en el período · 100 % = batería completamente cargada
                </p>
              </div>
              {ultimaBateria && (
                <div className="flex items-center gap-4 text-xs shrink-0 ml-4">
                  {ultimaBateria.temperatura != null && (
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                        <Thermometer className="h-3.5 w-3.5 text-[var(--color-danger-500)]" />
                        <span className="font-semibold text-[var(--color-text-primary)]">{ultimaBateria.temperatura.toFixed(1)} °C</span>
                      </span>
                      <span className="text-[var(--color-text-muted)]">Temperatura</span>
                    </div>
                  )}
                  {ultimaBateria.voltaje != null && (
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                        <Gauge className="h-3.5 w-3.5 text-[var(--color-primary-500)]" />
                        <span className="font-semibold text-[var(--color-text-primary)]">{ultimaBateria.voltaje.toFixed(1)} V</span>
                      </span>
                      <span className="text-[var(--color-text-muted)]">Voltaje</span>
                    </div>
                  )}
                  {ultimaBateria.corriente != null && (
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-[var(--color-text-primary)]">{ultimaBateria.corriente.toFixed(1)} A</span>
                      <span className="text-[var(--color-text-muted)]">Corriente</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : chartBateria.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
                Sin datos de batería para este período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartBateria} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    label={{ value: "Carga (%)", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10, fill: "var(--color-text-muted)" } }}
                  />
                  <Tooltip content={<TooltipBateria />} />
                  <Line type="monotone" dataKey="soc" name="SOC" stroke={COLOR_BATERIA} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabla de últimas lecturas */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Últimas lecturas de consumo</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Los 20 registros más recientes · cada fila es una medición de energía consumida
              </p>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : consumos.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
                Sin lecturas en este período
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] bg-[var(--color-neutral-50)]">
                      <th className="text-left px-5 py-3 font-medium">Fecha y hora</th>
                      <th className="text-left px-5 py-3 font-medium">Fuente de energía</th>
                      <th className="text-right px-5 py-3 font-medium">Energía consumida (kWh)</th>
                      <th className="text-right px-5 py-3 font-medium">Potencia instantánea (kW)</th>
                      <th className="text-right px-5 py-3 font-medium">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...consumos].reverse().slice(0, 20).map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-neutral-50)] transition-colors"
                      >
                        <td className="px-5 py-3 tabular text-[var(--color-text-secondary)] whitespace-nowrap">
                          {c.fecha ? format(new Date(c.fecha), "dd/MM/yyyy HH:mm:ss") : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            c.fuente === "solar"
                              ? "bg-[var(--color-solar-100)] text-[var(--color-solar-700)]"
                              : "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                          )}>
                            {c.fuente === "solar" ? "☀ Solar" : c.fuente === "electrica" ? "⚡ Red eléctrica" : c.fuente ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right tabular font-semibold text-[var(--color-text-primary)]">
                          {c.energia_consumida != null ? `${c.energia_consumida.toFixed(3)} kWh` : "—"}
                        </td>
                        <td className="px-5 py-3 text-right tabular text-[var(--color-text-secondary)]">
                          {c.potencia != null ? `${c.potencia.toFixed(2)} kW` : "—"}
                        </td>
                        <td className="px-5 py-3 text-right tabular text-[var(--color-text-muted)]">
                          {c.costo != null ? `$${c.costo.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
