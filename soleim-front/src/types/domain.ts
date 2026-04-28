import type {
  EstadoInstalacion, EstadoAlerta, SeveridadAlerta,
  EstadoOrden, PrioridadOrden, TipoMantenimiento,
  EstadoMantenimiento, TipoSistema
} from "./enums"

export interface PanelEmpresa {
  empresa: string
  instalacionesActivas: number
  generacionHoy: number | null
  ahorroEstimado: number | null
  alertasCriticas: number
  ordenesAbiertas: number | null
  slaEnRiesgo: number | null
  instalaciones: InstalacionResumen[]
  clima: Clima | null
  fuentesEnergia: FuentesEnergia | null
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
  titulo: string
  descripcion: string | null
  estado: EstadoOrden
  prioridad: PrioridadOrden
  tecnicoId: number | null
  tecnicoNombre: string | null
  fechaCreacion: string
  fechaVencimiento: string | null
  slaEstado: string | null
}

export interface MantenimientoProgramado {
  id: number
  instalacionId: number
  instalacionNombre: string
  tipo: TipoMantenimiento
  fechaProgramada: string
  tecnicoId: number | null
  tecnicoNombre: string | null
  contratoId: number | null
  estado: EstadoMantenimiento
  prioridad: PrioridadOrden | null
}

export interface Tecnico {
  id: number
  nombre: string
  especialidad: string | null
  zona: string | null
  disponible: boolean
  cargaTrabajo: number | null
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

export interface TelemetriaEvento {
  timestamp: string
  instalacionNombre: string | null
  tipo: string | null
  valor: number | null
  unidad: string | null
  descripcion: string | null
}
