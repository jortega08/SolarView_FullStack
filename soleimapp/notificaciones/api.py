"""
API pública de la app `notificaciones`.

Usar desde cualquier otra app:

    from notificaciones.api import notificar
    notificar(usuario_id=42, canal='in_app', plantilla='orden_asignada',
              context={'codigo': 'OT-2025-0001', 'titulo': 'Cambio de batería'})
"""
import logging

from .models import Notificacion, PlantillaNotificacion

logger = logging.getLogger('soleim')


def _render_template(plantilla: PlantillaNotificacion, context: dict):
    """Renderiza asunto y cuerpo a partir de la plantilla y el context."""
    ctx = context or {}
    try:
        asunto = plantilla.asunto.format(**ctx)
        cuerpo = plantilla.cuerpo_txt.format(**ctx)
    except KeyError as exc:
        logger.warning(
            'Faltó key %s al renderizar plantilla %s; dejando placeholders.',
            exc, plantilla.clave,
        )
        asunto = plantilla.asunto
        cuerpo = plantilla.cuerpo_txt
    return asunto, cuerpo


def notificar(
    usuario_id: int,
    canal: str,
    plantilla: str | None = None,
    context: dict | None = None,
    asunto_override: str | None = None,
    cuerpo_override: str | None = None,
    enlace: str = '',
    metadata: dict | None = None,
) -> Notificacion:
    """
    Crea una `Notificacion(estado='pendiente')` y dispara la task asíncrona de envío.

    Reglas:
    - Si se pasa `plantilla` (clave), se usa para asunto/cuerpo (con .format(context)).
    - Si se pasan overrides, prevalecen sobre la plantilla.
    - Si no hay ni plantilla ni overrides → ValueError.
    """
    plant = None
    if plantilla:
        plant = PlantillaNotificacion.objects.filter(clave=plantilla, activo=True).first()
        if not plant:
            logger.warning('Plantilla %r no encontrada o inactiva.', plantilla)

    asunto = asunto_override
    cuerpo = cuerpo_override
    if (not asunto or not cuerpo) and plant:
        a, c = _render_template(plant, context or {})
        asunto = asunto or a
        cuerpo = cuerpo or c

    if not asunto or not cuerpo:
        raise ValueError(
            'notificar() requiere `plantilla` con `context` o `asunto_override`+`cuerpo_override`.'
        )

    notif = Notificacion.objects.create(
        usuario_id=usuario_id,
        canal=canal,
        plantilla=plant,
        asunto=asunto,
        cuerpo=cuerpo,
        enlace=enlace,
        metadata=metadata or {},
        estado='pendiente',
    )

    # Disparo asíncrono — import perezoso para no romper en migraciones
    from .tasks import enviar_notificacion
    enviar_notificacion.delay(notif.idnotificacion)
    return notif
