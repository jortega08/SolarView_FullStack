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
  facturacion_hoy?: ApiFacturacionHoy | null
  alertas_criticas?: number
  ordenes_abiertas?: number
  sla_en_riesgo?: number
  instalaciones: ApiInstalacionResumen[]
  clima?: ApiClima | null
  fuentes_energia?: ApiFuentesEnergia | null
}

export interface ApiFacturacionHoy {
  valor_consumo: number
  valor_ahorro: number
  valor_total: number
  moneda: string
}

export interface ApiTarifa {
  idtarifa: number
  nombre: string
  ciudad: number | null
  ciudad_nombre?: string | null
  instalacion: number | null
  instalacion_nombre?: string | null
  valor_kwh: string  // backend serializa Decimal como string
  moneda: string
  vigente_desde: string
  vigente_hasta: string | null
  creado_at?: string
  actualizado_at?: string
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

export interface ApiEmpresaBasica {
  idempresa: number
  nombre: string
  nit?: string
  sector?: string
  ciudad?: number | null
  ciudad_nombre?: string | null
  fecha_registro?: string
}

export interface ApiDomicilio {
  iddomicilio: number
  ciudad?: number
  usuario?: number
  usuario_nombre?: string
  ciudad_nombre?: string
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
  imagen_url?: string | null
  empresa_nombre?: string | null
  ciudad_nombre?: string | null
  ultima_actualizacion?: string | null
  fecha_instalacion?: string | null
  potencia_actual?: number
  generacion_hoy?: number
  consumo_actual?: number
  bateria_soc?: number
  eficiencia?: number
}

export interface ApiInstalacionCrud {
  idinstalacion: number
  empresa: number
  empresa_nombre?: string | null
  nombre: string
  direccion?: string
  ciudad?: number | null
  ciudad_nombre?: string | null
  tipo_sistema: string
  capacidad_panel_kw: number
  capacidad_bateria_kwh: number
  fecha_instalacion?: string | null
  estado: string
  imagen?: string | null
  imagen_url?: string | null
}

export interface ApiCiudad {
  idciudad: number
  nombre: string
  estado?: number
  estado_nombre?: string
}

export interface ApiSensor {
  idsensor: number
  instalacion?: number | null
  instalacion_nombre?: string | null
  nombre: string
  codigo: string
  tipo: string
  unidad?: string
  estado: string
  ultima_lectura?: number | null
  fecha_ultima_lectura?: string | null
  notas?: string
  creado_at?: string
  actualizado_at?: string
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
  empresa_nombre?: string
  alerta?: number | null
  mantenimiento?: number | null
  tipo?: string
  titulo: string
  descripcion?: string
  notas_resolucion?: string
  estado: string
  prioridad: string
  tecnico?: number
  tecnico_nombre?: string
  asignado_a?: number | null
  asignado_a_nombre?: string | null
  creado_por?: number | null
  creado_por_nombre?: string | null
  fecha_creacion?: string
  creada_at?: string
  fecha_asignacion?: string | null
  asignada_at?: string | null
  iniciada_at?: string | null
  completada_at?: string | null
  cerrada_at?: string | null
  fecha_vencimiento?: string | null
  sla_estado?: string
  sla_vencido?: boolean
  sla_objetivo_horas?: number | null
  tiempo_resolucion_horas?: number | null
}

export interface ApiComentarioOrden {
  idcomentario: number
  orden: number
  usuario: number
  usuario_nombre?: string
  tipo?: string
  texto: string
  creado_at: string
}

export interface ApiEvidenciaOrden {
  idevidencia: number
  orden: number
  tipo: string
  archivo?: string | null
  archivo_url?: string | null
  descripcion?: string
  subido_por?: number
  subido_por_nombre?: string
  creado_at: string
}

export interface ApiMantenimientoProgramado {
  id?: number
  idmantenimiento?: number
  instalacion: number
  instalacion_nombre?: string
  /** Computado del nombre del plan o del tipo */
  tipo?: string
  plan?: number | null
  plan_nombre?: string | null
  fecha_programada: string
  estado: string
  notas?: string | null
  orden_trabajo?: number | null
  orden_codigo?: string | null
  creado_at?: string
  /** Estos campos pueden llegar de endpoints legacy */
  tecnico?: number
  tecnico_nombre?: string
  contrato?: number
  prioridad?: string
}

export interface ApiContrato {
  idcontrato: number
  instalacion: number
  instalacion_nombre?: string
  empresa_nombre?: string
  nivel: string
  horas_respuesta: number
  frecuencia_preventivo_dias: number
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  creado_at?: string
  actualizado_at?: string
}

export interface ApiPlanMantenimiento {
  idplan: number
  nombre: string
  tipo_sistema: string
  frecuencia_dias: number
  duracion_estimada_horas: number | string
  checklist: Array<string | { titulo?: string; title?: string; requerido?: boolean; required?: boolean }> | string | null
  especialidad_requerida?: number | null
  especialidad_nombre?: string | null
  activo: boolean
  creado_at?: string
}

export interface ApiEspecialidad {
  idespecialidad: number
  nombre: string
  descripcion?: string | null
}

export interface ApiTecnico {
  id?: number
  idperfil?: number
  usuario?: number
  usuario_nombre?: string
  usuario_email?: string
  empresa?: number
  empresa_nombre?: string
  cedula?: string
  nombre?: string
  especialidad?: string
  especialidades?: number[]
  especialidades_nombres?: string[]
  zona?: string
  zonas?: number[]
  zonas_nombres?: string[]
  telefono?: string
  disponible: boolean
  area_profesional?: string
  resumen_profesional?: string
  hoja_vida?: string | null
  hoja_vida_url?: string | null
  estudios?: string[] | Array<{ titulo?: string; institucion?: string; ano?: string; estado?: string }>
  carga_trabajo?: number
  carga_actual?: number
  licencia_vence?: string | null
  notas?: string
  // Formación y competencias
  titulo_academico?: string
  nivel_educativo?: string
  certificaciones?: Array<{ nombre: string; institucion?: string; ano?: string }>
  capacidad_operacion?: string
  // Sugerencia
  score?: number
  razones?: string[]
  creado_at?: string
  actualizado_at?: string
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

export interface ApiAnaliticaActividad {
  mes?: string
  fecha?: string
  dia?: number
  ano?: number
  solar?: number
  electrica?: number
}

export interface ApiAnaliticaComparativa {
  instalacion_id: number
  instalacion_nombre: string
  solar_ratio?: number
  costo_total?: number
  alertas_activas?: number
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

export interface ApiFacturaMensual {
  electrica?: number
  solar?: number
  costo?: number
  fecha_emision?: string
  usuario?: string
  domicilio?: string
  ciudad?: string
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
