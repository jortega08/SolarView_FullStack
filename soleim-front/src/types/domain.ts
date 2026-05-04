import type {
  EstadoInstalacion, EstadoAlerta, SeveridadAlerta,
  EstadoOrden, PrioridadOrden, TipoMantenimiento,
  EstadoMantenimiento, TipoSistema
} from "./enums"

export interface PanelEmpresa {
  empresaId: number | null
  empresa: string
  instalacionesActivas: number
  generacionHoy: number | null
  ahorroEstimado: number | null
  facturacionHoy: FacturacionHoy | null
  alertasCriticas: number
  ordenesAbiertas: number | null
  slaEnRiesgo: number | null
  instalaciones: InstalacionResumen[]
  clima: Clima | null
  fuentesEnergia: FuentesEnergia | null
}

export interface FacturacionHoy {
  valorConsumo: number
  valorAhorro: number
  valorTotal: number
  moneda: string
}

export interface Tarifa {
  id: number
  nombre: string
  ciudadId: number | null
  ciudadNombre: string | null
  instalacionId: number | null
  instalacionNombre: string | null
  valorKwh: number
  moneda: string
  vigenteDesde: string
  vigenteHasta: string | null
  scope: "instalacion" | "ciudad" | "global"
}

export interface InstalacionResumen {
  id: number
  nombre: string
  estado: EstadoInstalacion
  bateriaSoc: number | null
  potenciaActual: number | null
  generacionHoy: number | null
  tipoSistema: TipoSistema | null
  ciudad: string | null
  imagen: string | null
  riesgo: "bajo" | "medio" | "alto" | null
}

export interface EmpresaBasica {
  id: number
  nombre: string
  nit: string | null
  sector: string | null
  ciudadNombre: string | null
}

export interface Domicilio {
  id: number
  ciudadId: number | null
  usuarioId: number | null
  usuarioNombre: string | null
  ciudadNombre: string | null
}

export interface InstalacionDetalle {
  id: number
  nombre: string
  estado: EstadoInstalacion
  tipoSistema: TipoSistema
  capacidadSolarKwp: number
  capacidadBateriaKwh: number
  ciudad: string
  imagen: string | null
  ultimaActualizacion: string | null
  potenciaActual: number | null
  generacionHoy: number | null
  consumoActual: number | null
  bateriaSoc: number | null
  eficiencia: number | null
}

export interface InstalacionCrud {
  id: number
  empresaId: number
  empresaNombre: string | null
  nombre: string
  direccion: string
  ciudadId: number | null
  ciudadNombre: string | null
  tipoSistema: TipoSistema
  capacidadPanelKw: number
  capacidadBateriaKwh: number
  fechaInstalacion: string | null
  estado: EstadoInstalacion
  imagenUrl: string | null
}

export interface CiudadBasica {
  id: number
  nombre: string
  estadoNombre: string | null
}

export interface SensorInstalacion {
  id: number
  instalacionId: number | null
  instalacionNombre: string | null
  nombre: string
  codigo: string
  tipo: string
  unidad: string
  estado: "activo" | "inactivo" | "mantenimiento" | string
  ultimaLectura: number | null
  fechaUltimaLectura: string | null
  notas: string
}

export interface Alerta {
  id: number
  instalacionId: number
  instalacionNombre: string
  tipoAlertaId: number
  tipoAlertaNombre: string
  severidad: SeveridadAlerta
  estado: EstadoAlerta
  descripcion: string
  causaProbable: string | null
  fechaCreacion: string
  fechaResolucion: string | null
}

export interface Orden {
  id: number
  codigo: string
  instalacionId: number
  instalacionNombre: string
  empresaNombre: string | null
  tipo: string | null
  titulo: string
  descripcion: string | null
  notasResolucion: string | null
  estado: EstadoOrden
  prioridad: PrioridadOrden
  tecnicoId: number | null
  tecnicoNombre: string | null
  alertaId: number | null
  mantenimientoId: number | null
  fechaCreacion: string
  fechaAsignacion: string | null
  fechaInicio: string | null
  fechaCompletada: string | null
  fechaCerrada: string | null
  fechaVencimiento: string | null
  slaEstado: string | null
  slaVencido: boolean
  slaObjetivoHoras: number | null
  tiempoResolucionHoras: number | null
}

export interface ComentarioOrden {
  id: number
  ordenId: number
  usuarioId: number
  usuarioNombre: string
  tipo: string
  texto: string
  fechaCreacion: string
}

export interface EvidenciaOrden {
  id: number
  ordenId: number
  tipo: "foto" | "firma" | "documento" | string
  archivoUrl: string | null
  descripcion: string
  subidoPorId: number | null
  subidoPorNombre: string
  fechaCreacion: string
}

export interface MantenimientoProgramado {
  id: number
  instalacionId: number
  instalacionNombre: string
  planId: number | null
  planNombre: string | null
  /** Tipo derivado del plan */
  tipo: TipoMantenimiento
  fechaProgramada: string
  estado: EstadoMantenimiento
  notas: string | null
  ordenTrabajoId: number | null
  ordenCodigo: string | null
  creadoAt: string | null
  /** Campos legacy opcionales */
  tecnicoId: number | null
  tecnicoNombre: string | null
  contratoId: number | null
  prioridad: PrioridadOrden | null
}

export interface Contrato {
  id: number
  instalacionId: number
  instalacionNombre: string
  empresaNombre: string | null
  nivel: string
  horasRespuesta: number
  frecuenciaPreventivoDias: number
  fechaInicio: string
  fechaFin: string | null
  activo: boolean
}

export interface PlanMantenimiento {
  id: number
  nombre: string
  tipoSistema: string
  frecuenciaDias: number
  duracionEstimadaHoras: number
  checklist: PlanChecklistItem[]
  especialidadRequerida: number | null
  especialidadNombre: string | null
  activo: boolean
}

export interface PlanChecklistItem {
  titulo: string
  requerido: boolean | null
}

export interface Especialidad {
  id: number
  nombre: string
  descripcion: string | null
}

export interface Certificacion {
  nombre: string
  institucion?: string
  ano?: string
}

export interface Tecnico {
  id: number
  usuarioId: number | null
  nombre: string
  email: string | null
  cedula: string | null
  telefono: string | null
  empresaId: number | null
  empresaNombre: string | null
  especialidad: string | null
  especialidades: string[]
  especialidadesIds: number[]
  zona: string | null
  zonas: string[]
  zonasIds: number[]
  disponible: boolean
  areaProfesional: string | null
  resumenProfesional: string | null
  hojaVidaUrl: string | null
  estudios: string[]
  cargaTrabajo: number | null
  licenciaVence: string | null
  notas: string | null
  // Formación y competencias
  tituloAcademico: string | null
  nivelEducativo: string | null
  certificaciones: Certificacion[]
  capacidadOperacion: string | null
  // Sugerencia (solo al venir de /sugeridos/)
  score?: number
  razones?: string[]
}

export interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  tipo: string | null
  leida: boolean
  fechaCreacion: string
}

export interface TendenciaPunto {
  fecha: string
  generacion: number | null
  consumo: number | null
  bateriaSoc: number | null
  irradiancia: number | null
  exportacion: number | null
  importacion: number | null
}

export interface ActividadEnergetica {
  label: string
  fecha: string | null
  solar: number | null
  redElectrica: number | null
  consumoTotal: number | null
}

export interface ComparativaInstalacion {
  instalacionId: number
  instalacionNombre: string
  solarRatio: number | null
  costoTotal: number | null
  alertasActivas: number | null
}

export interface BateriaSalud {
  instalacionId: number
  soc: number
  voltaje: number | null
  corriente: number | null
  temperatura: number | null
  tiempoRestanteMinutos: number | null
  capacidadTotal: number | null
  capacidadDisponible: number | null
  estado: string | null
  fuentePrincipal: string | null
  desdeRed: number | null
}

export interface Autonomia {
  instalacionId: number
  autonomiaHoras: number | null
  autonomiaMinutos: number | null
}

export interface Clima {
  temperatura: number | null
  humedad: number | null
  viento: number | null
  descripcion: string | null
  irradiancia: number | null
}

export interface FuentesEnergia {
  solarKwh: number | null
  redKwh: number | null
  solarPct: number | null
  redPct: number | null
}

export interface FacturaMensual {
  electrica: number | null
  solar: number | null
  costo: number | null
  fechaEmision: string | null
  usuario: string | null
  domicilio: string | null
  ciudad: string | null
}

export type ReporteTipo = "consumo" | "alertas" | "mantenimiento" | "sla" | "factura"
export type ReporteFormato = "csv" | "pdf"

export interface ReportFiltersState {
  instalacionId?: number
  periodo: "7d" | "30d" | "90d" | "custom"
  fechaInicio?: string
  fechaFin?: string
  mes: number
  ano: number
  tipo: ReporteTipo
  fuente: "todas" | "solar" | "electrica"
}

export interface TelemetriaEvento {
  timestamp: string
  instalacionNombre: string | null
  tipo: string | null
  valor: number | null
  unidad: string | null
  descripcion: string | null
}
