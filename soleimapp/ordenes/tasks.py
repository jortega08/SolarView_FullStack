"""
Tasks Celery del flujo operativo:

- crear_orden_para_alerta(alerta_id)         → alerta crítica/alta → OT
- auto_asignar_orden(orden_id)               → busca técnico disponible y asigna
- generar_mantenimientos_preventivos()       → diario: crea OTs preventivas en ventana 7d
- verificar_sla_ordenes()                    → cada hora: marca SLA vencido y notifica
- recordatorio_mantenimientos_diario()       → cada día 08:00: notifica al técnico
"""

import json
import logging
from datetime import timedelta

from celery import shared_task
from django.db.models import Count, Q
from django.utils import timezone

logger = logging.getLogger("soleim")


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------


def _notificar_safe(**kwargs):
    """Wrapper que ignora errores si la app `notificaciones` aún no está cargada."""
    try:
        from notificaciones.api import notificar

        notificar(**kwargs)
    except Exception:
        logger.exception("No se pudo crear notificación: %s", kwargs)


def _buscar_y_asignar_tecnico(orden):
    """
    Busca el técnico óptimo para `orden` y la asigna si lo encuentra.
    Devuelve True si asignó, False si quedó sin asignar.
    """
    from tecnicos.models import PerfilTecnico

    if not orden.instalacion.ciudad_id:
        logger.warning(
            "Orden %s en instalación %s sin ciudad: no se puede auto-asignar.",
            orden.codigo,
            orden.instalacion_id,
        )
        return False

    candidatos = (
        PerfilTecnico.objects.filter(
            empresa_id=orden.instalacion.empresa_id,
            disponible=True,
            zonas=orden.instalacion.ciudad_id,
        )
        .annotate(
            carga=Count(
                "usuario__ordenes_asignadas",
                filter=Q(
                    usuario__ordenes_asignadas__estado__in=["asignada", "en_progreso"]
                ),
                distinct=True,
            )
        )
        .order_by("carga", "usuario__nombre")
    )

    perfil = candidatos.first()
    if not perfil:
        return False

    orden.asignado_a_id = perfil.usuario_id
    orden.estado = "asignada"
    orden.asignada_at = timezone.now()
    orden.save(update_fields=["asignado_a", "estado", "asignada_at"])

    _notificar_safe(
        usuario_id=perfil.usuario_id,
        canal="in_app",
        plantilla="orden_asignada",
        context={
            "codigo": orden.codigo,
            "titulo": orden.titulo,
            "orden_id": orden.idorden,
        },
    )
    logger.info(
        "Auto-asignada %s → técnico %s (carga previa=%s)",
        orden.codigo,
        perfil.usuario_id,
        perfil.carga,
    )
    return True


# ---------------------------------------------------------------------------
# Tasks principales
# ---------------------------------------------------------------------------


@shared_task(bind=True, max_retries=3)
def crear_orden_para_alerta(self, alerta_id):
    """
    Crea una OrdenTrabajo correctiva a partir de una Alerta crítica/alta
    e intenta auto-asignarla.
    """
    from alerta.models import Alerta
    from core.utils import system_user

    from .models import OrdenTrabajo

    try:
        alerta = Alerta.objects.select_related(
            "instalacion__empresa", "instalacion__ciudad"
        ).get(idalerta=alerta_id)
    except Alerta.DoesNotExist:
        logger.warning("crear_orden_para_alerta: alerta %s no existe", alerta_id)
        return

    # Idempotencia
    if alerta.ordenes.exists():
        logger.info("Alerta %s ya tiene orden; skip.", alerta_id)
        return
    if not alerta.instalacion_id:
        logger.warning("Alerta %s sin instalación; skip.", alerta_id)
        return

    # SLA según contrato si existe
    contrato = getattr(alerta.instalacion, "contrato", None)
    sla = contrato.horas_respuesta if contrato and contrato.activo else 24

    prioridad = "urgente" if alerta.severidad == "critica" else "alta"

    try:
        orden = OrdenTrabajo.objects.create(
            instalacion=alerta.instalacion,
            alerta=alerta,
            tipo="correctivo",
            prioridad=prioridad,
            estado="abierta",
            titulo=f"[{alerta.severidad.upper()}] {alerta.mensaje[:80]}",
            descripcion=alerta.causa_probable or alerta.mensaje,
            sla_objetivo_horas=sla,
            creado_por=system_user(),
        )
    except Exception as exc:
        logger.exception("Error creando orden desde alerta %s", alerta_id)
        raise self.retry(exc=exc, countdown=10)

    logger.info("Orden %s creada desde alerta %s", orden.codigo, alerta_id)

    # Disparar auto-asignación en otra task (no bloqueante)
    auto_asignar_orden.delay(orden.idorden)


@shared_task(bind=True, max_retries=3)
def auto_asignar_orden(self, orden_id):
    """Busca técnico disponible y asigna; si no hay, notifica al admin_empresa."""
    from core.models import RolInstalacion

    from .models import OrdenTrabajo

    try:
        orden = OrdenTrabajo.objects.select_related(
            "instalacion__empresa", "instalacion__ciudad"
        ).get(idorden=orden_id)
    except OrdenTrabajo.DoesNotExist:
        return

    if orden.estado != "abierta":
        return

    if _buscar_y_asignar_tecnico(orden):
        return

    # Sin técnicos disponibles → notificar a los admin_empresa de la instalación
    admins = (
        RolInstalacion.objects.filter(
            instalacion=orden.instalacion, rol="admin_empresa"
        )
        .values_list("usuario_id", flat=True)
        .distinct()
    )
    for uid in admins:
        _notificar_safe(
            usuario_id=uid,
            canal="email",
            plantilla="orden_sin_tecnico",
            context={
                "codigo": orden.codigo,
                "titulo": orden.titulo,
                "orden_id": orden.idorden,
            },
        )
    logger.warning(
        "Orden %s sin técnico disponible. Notificados %d admin(s) de empresa.",
        orden.codigo,
        len(list(admins)),
    )


@shared_task
def generar_mantenimientos_preventivos():
    """
    Diario (02:00) — Genera mantenimientos preventivos para los próximos 7 días.

    Para cada Instalación activa con ContratoServicio activo:
      próxima = (último_mantenimiento o fecha_instalacion o hoy) + plan.frecuencia_dias
      si próxima ≤ hoy+7 y no existe ya un mantenimiento programado: crear.
    """
    from core.models import Instalacion
    from core.utils import system_user
    from mantenimiento.models import Mantenimiento, PlanMantenimiento

    from .models import OrdenTrabajo

    hoy = timezone.localdate()
    ventana = hoy + timedelta(days=7)
    creados = 0

    instalaciones = Instalacion.objects.filter(estado="activa").select_related(
        "contrato"
    )

    for inst in instalaciones:
        contrato = getattr(inst, "contrato", None)
        if not contrato or not contrato.activo:
            continue

        plan = (
            PlanMantenimiento.objects.filter(
                tipo_sistema=inst.tipo_sistema, activo=True
            )
            .order_by("frecuencia_dias")
            .first()
        )
        if not plan:
            continue

        base = inst.ultimo_mantenimiento or inst.fecha_instalacion or hoy
        proxima = base + timedelta(days=plan.frecuencia_dias)
        if proxima > ventana:
            continue

        if Mantenimiento.objects.filter(
            instalacion=inst,
            fecha_programada=proxima,
            estado__in=["programado", "en_proceso"],
        ).exists():
            continue

        m = Mantenimiento.objects.create(
            instalacion=inst,
            plan=plan,
            fecha_programada=proxima,
            estado="programado",
        )
        ot = OrdenTrabajo.objects.create(
            instalacion=inst,
            mantenimiento=m,
            tipo="preventivo",
            prioridad="media",
            estado="abierta",
            titulo=f"Mantenimiento preventivo: {plan.nombre}",
            descripcion=json.dumps(plan.checklist, ensure_ascii=False),
            sla_objetivo_horas=72,
            creado_por=system_user(),
        )
        m.orden_trabajo = ot
        m.save(update_fields=["orden_trabajo"])

        inst.proximo_mantenimiento = proxima
        inst.save(update_fields=["proximo_mantenimiento"])

        # Auto-asignar (no falla si no hay técnico)
        auto_asignar_orden.delay(ot.idorden)
        creados += 1

    logger.info(
        "generar_mantenimientos_preventivos: %d mantenimientos creados.", creados
    )
    return creados


@shared_task
def verificar_sla_ordenes():
    """
    Cada hora — Marca como vencidas las órdenes que pasaron su SLA y notifica.
    Estrategia simple: si SLA está vencido y la prioridad no es 'urgente',
    sube la prioridad y dispara notificación a admin_empresa.
    """
    from core.models import RolInstalacion

    from .models import OrdenTrabajo

    activas = OrdenTrabajo.objects.filter(
        estado__in=OrdenTrabajo.ESTADOS_ACTIVOS,
    ).select_related("instalacion")

    escalados = 0
    for o in activas:
        if not o.es_sla_vencido():
            continue
        # Subir prioridad si todavía no es 'urgente'
        if o.prioridad != "urgente":
            o.prioridad = "urgente"
            o.save(update_fields=["prioridad"])

        admins = (
            RolInstalacion.objects.filter(
                instalacion=o.instalacion, rol="admin_empresa"
            )
            .values_list("usuario_id", flat=True)
            .distinct()
        )
        for uid in admins:
            _notificar_safe(
                usuario_id=uid,
                canal="email",
                plantilla="sla_vencido",
                context={"codigo": o.codigo, "titulo": o.titulo, "orden_id": o.idorden},
            )
        escalados += 1

    logger.info(
        "verificar_sla_ordenes: %d órdenes con SLA vencido escaladas.", escalados
    )
    return escalados


@shared_task
def recordatorio_mantenimientos_diario():
    """Cada día 08:00 — Recuerda al técnico asignado las visitas del día."""
    from .models import OrdenTrabajo

    hoy = timezone.localdate()
    ordenes_hoy = OrdenTrabajo.objects.filter(
        tipo="preventivo",
        estado__in=["asignada", "en_progreso"],
        mantenimiento__fecha_programada=hoy,
    ).select_related("mantenimiento", "instalacion", "asignado_a")
    for o in ordenes_hoy:
        if not o.asignado_a_id:
            continue
        _notificar_safe(
            usuario_id=o.asignado_a_id,
            canal="in_app",
            plantilla="mantenimiento_proximo",
            context={
                "codigo": o.codigo,
                "instalacion": o.instalacion.nombre,
                "titulo": o.titulo,
                "orden_id": o.idorden,
            },
        )
    logger.info(
        "recordatorio_mantenimientos_diario: %d notificaciones.", ordenes_hoy.count()
    )
