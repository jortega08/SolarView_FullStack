import { useCallback, useEffect, useState } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { env } from "@/lib/env"
import type { TelemetriaEvento } from "@/types/domain"
import type { ConexionWS } from "@/types/enums"

interface SensorMessage {
  type?: string
  severidad?: string
  instalacion_id?: number
  instalacion_nombre?: string
  timestamp?: string
  valor?: number
  unidad?: string
  tipo?: string
  descripcion?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

function readyStateToConexion(rs: ReadyState, hasConnectionIssue: boolean): ConexionWS {
  if (rs === ReadyState.CONNECTING) return "conectando"
  if (rs === ReadyState.OPEN) return "en_vivo"
  if (hasConnectionIssue && rs === ReadyState.CLOSED) return "error"
  return "desconectado"
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function inferUnidad(tipo: string | null, data: Record<string, unknown>): string | null {
  if (tipo === "bateria" || data.porcentaje_carga != null) return "%"
  if (tipo === "temperatura" || data.temperatura != null) return "°C"
  if (tipo === "voltaje" || data.voltaje != null) return "V"
  if (tipo === "corriente" || data.corriente != null) return "A"
  if (data.energia_consumida != null) return "kWh"
  if (data.potencia != null) return "kW"
  return null
}

function normalizeMessage(msg: SensorMessage): TelemetriaEvento {
  const data = msg.data ?? {}
  const tipo =
    getString(msg.tipo) ??
    getString(data.tipo) ??
    getString(msg.type) ??
    getString(data.fuente)
  const valor =
    getNumber(msg.valor) ??
    getNumber(data.valor) ??
    getNumber(data.porcentaje_carga) ??
    getNumber(data.potencia) ??
    getNumber(data.energia_consumida) ??
    getNumber(data.temperatura) ??
    getNumber(data.voltaje) ??
    getNumber(data.corriente)

  return {
    timestamp:
      getString(msg.timestamp) ??
      getString(data.timestamp) ??
      getString(data.fecha) ??
      getString(data.fecha_registro) ??
      new Date().toISOString(),
    instalacionNombre: getString(msg.instalacion_nombre) ?? getString(data.instalacion_nombre),
    tipo,
    valor,
    unidad: getString(msg.unidad) ?? getString(data.unidad) ?? inferUnidad(tipo, data),
    descripcion:
      getString(msg.descripcion) ??
      getString(data.descripcion) ??
      getString(data.mensaje) ??
      (tipo ? `Lectura ${tipo}` : "Lectura de sensor"),
  }
}

export function useSensorSocket(instalacionId: number | null) {
  const qc = useQueryClient()
  const [messages, setMessages] = useState<TelemetriaEvento[]>([])
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false)

  const socketUrl = instalacionId != null ? `${env.wsUrl}/ws/sensor/${instalacionId}/` : null

  const { lastJsonMessage, readyState } = useWebSocket<SensorMessage>(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 5,
    reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    onOpen: () => setHasConnectionIssue(false),
    onError: () => setHasConnectionIssue(true),
    onClose: () => setHasConnectionIssue(true),
  })

  const isReconnecting = hasConnectionIssue && readyState === ReadyState.CONNECTING
  const connectionStatus: ConexionWS = isReconnecting
    ? "reintentando"
    : readyStateToConexion(readyState, hasConnectionIssue)

  const handleMessage = useCallback(
    (msg: SensorMessage) => {
      const evento = normalizeMessage(msg)
      const severidad = msg.severidad ?? getString(msg.data?.severidad)

      setMessages((current) => [evento, ...current].slice(0, 50))

      qc.invalidateQueries({ queryKey: ["analitica-bateria", instalacionId] })
      qc.invalidateQueries({ queryKey: ["analitica-autonomia", instalacionId] })
      qc.invalidateQueries({ queryKey: ["analitica-tendencia"] })

      if (severidad === "critica") {
        toast.error(`Alerta crítica: ${evento.descripcion ?? "Nueva alerta detectada"}`, {
          duration: 8_000,
        })
        qc.invalidateQueries({ queryKey: ["alertas"] })
        qc.invalidateQueries({ queryKey: ["panel-empresa"] })
      }
    },
    [instalacionId, qc]
  )

  useEffect(() => {
    if (lastJsonMessage) handleMessage(lastJsonMessage)
  }, [lastJsonMessage, handleMessage])

  return {
    connectionStatus,
    isReconnecting,
    messages,
    lastMessage: messages[0] ?? null,
  }
}
