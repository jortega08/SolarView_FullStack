/** Shapes tal como llegan del backend Django */

export interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  error?: string
  errors?: unknown
  detail?: string
  cached?: boolean
}

export interface ApiLoginResponse {
  success: boolean
  user: ApiUser
  tokens: { access: string; refresh?: string }
}

export interface ApiUser {
  id?: number
  idusuario?: number
  nombre: string
  email: string
  rol: string
  empresa?: number
  fecha_registro?: string
  is_active?: boolean
}

export interface ApiPanelEmpresa {
  empresa: string | { id: number; nombre: string } | null
  resumen?: {
    total?: number
    con_alerta_critica?: number
    en_mantenimiento?: number
  }
  instalaciones_activas?: number
  total_generacion_hoy?: number
  ahorro_estimado?: number
  alertas_criticas?: number
  ordenes_abiertas?: number
  sla_en_riesgo?: number
  instalaciones: ApiInstalacionResumen[]
  clima?: ApiClima | null
  fuentes_energia?: ApiFuentesEnergia | null
}

export interface ApiInstalacionResumen {
  id: number
  nombre: string
  estado: string
  empresa?: string
  bateria_soc?: number
  bateria_pct?: number
  alertas_criticas?: number
  ultimo_registro?: string | null
  potencia_actual?: number
  generacion_hoy?: number
  tipo_sistema?: string
  ciudad?: string
  imagen?: string | null
  riesgo?: "bajo" | "medio" | "alto" | null
}

export interface ApiInstalacionDetalle {
  id?: number
  idinstalacion?: number
  nombre?: string
  estado: string
  empresa?: string
  direccion?: string
  tipo_sistema: string
  capacidad_solar_kwp?: number
  capacidad_panel_kw?: number
  capacidad_bateria_kwh: number
  ciudad?: string | null
  imagen?: string | null
  ultima_actualizacion?: string | null
  fecha_instalacion?: string | null
  potencia_actual?: number
  generacion_hoy?: number
  consumo_actual?: number
  bateria_soc?: number
  eficiencia?: number
}

export interface ApiDetalleInstalacionResponse {
  instalacion?: ApiInstalacionDetalle
  bateria?: ApiAnaliticaBateria | null
  consumo_hoy?: {
    solar?: number
    electrica?: number
    costo?: number
  }
  alertas_activas?: Array<{
    id: number
    mensaje?: string
    severidad?: string
    causa_probable?: string | null
    accion_sugerida?: string | null
    fecha?: string
    tipo?: string | null
  }>
  autonomia_estimada_horas?: number | null
}

export interface ApiAlerta {
  id?: number
  idalerta?: number
  instalacion?: number
  instalacion_nombre?: string
  tipo_alerta?: number
  tipoalerta?: number
  tipo_alerta_nombre?: string
  tipo_nombre?: string
  tipo?: string
  severidad: string
  estado: string
  descripcion?: string
  mensaje?: string
  causa_probable?: string
  fecha_creacion?: string
  fecha?: string
  fecha_resolucion?: string | null
}

export interface ApiOrden {
  id?: number
  idorden?: number
  codigo?: string
  instalacion: number
  instalacion_nombre?: string
  titulo: string
  descripcion?: string
  estado: string
  prioridad: string
  tecnico?: number
  tecnico_nombre?: string
  asignado_a?: number | null
  asignado_a_nombre?: string | null
  fecha_creacion?: string
  creada_at?: string
  fecha_asignacion?: string | null
  asignada_at?: string | null
  fecha_vencimiento?: string | null
  sla_estado?: string
  sla_vencido?: boolean
  sla_objetivo_horas?: number | null
}

export interface ApiMantenimientoProgramado {
  id?: number
  idmantenimiento?: number
  instalacion: number
  instalacion_nombre?: string
  tipo?: string
  plan_nombre?: string
  fecha_programada: string
  tecnico?: number
  tecnico_nombre?: string
  contrato?: number
  estado: string
  prioridad?: string
  plan?: number
  orden_trabajo?: number | null
  orden_codigo?: string | null
}

export interface ApiTecnico {
  id?: number
  idperfil?: number
  usuario?: number
  usuario_nombre?: string
  usuario_email?: string
  empresa?: number
  empresa_nombre?: string
  nombre?: string
  especialidad?: string
  especialidades?: number[]
  especialidades_nombres?: string[]
  zona?: string
  zonas?: number[]
  zonas_nombres?: string[]
  telefono?: string
  disponible: boolean
  carga_trabajo?: number
  carga_actual?: number
}

export interface ApiNotificacion {
  id?: number
  idnotificacion?: number
  titulo?: string
  asunto?: string
  mensaje?: string
  cuerpo?: string
  tipo?: string
  canal?: string
  estado?: string
  leida?: boolean
  leida_at?: string | null
  fecha_creacion?: string
  creada_at?: string
}

export interface ApiTendencia {
  fecha: string
  generacion?: number
  consumo?: number
  solar?: number
  electrica?: number
  bateria_soc?: number
  bateria_avg?: number | null
  irradiancia?: number
  exportacion?: number
  importacion?: number
}

export interface ApiAnaliticaBateria {
  instalacion_id?: number
  soc?: number
  porcentaje_carga?: number
  voltaje?: number
  corriente?: number
  temperatura?: number
  tiempo_restante_minutos?: number
  tiempo_restante?: number
  capacidad_total?: number
  capacidad?: number
  capacidad_bateria?: number
  capacidad_disponible?: number
  estado?: string
  fuente_principal?: string
  desde_red?: number
  fecha?: string
}

export interface ApiAnaliticaAutonomia {
  instalacion_id?: number
  autonomia_horas?: number
  autonomia_minutos?: number
}

export interface ApiClima {
  temperatura?: number
  humedad?: number
  viento?: number
  descripcion?: string
  irradiancia?: number
}

export interface ApiFuentesEnergia {
  solar_kwh?: number
  red_kwh?: number
  solar_pct?: number
  red_pct?: number
}

export interface ApiTelemetriaItem {
  id?: number
  instalacion?: number
  instalacion_nombre?: string
  timestamp: string
  tipo?: string
  valor?: number
  unidad?: string
  descripcion?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
