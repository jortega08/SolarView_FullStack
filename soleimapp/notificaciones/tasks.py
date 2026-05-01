"""Task Celery de envío de notificaciones."""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger("soleim")


@shared_task(bind=True, max_retries=5, default_retry_delay=30)
def enviar_notificacion(self, notif_id):
    """
    Resuelve el backend según el canal y envía.
    En caso de fallo, reintenta con backoff exponencial (30s, 60s, 120s, 240s, 480s).
    """
    from .backends import resolve_backend
    from .models import Notificacion

    try:
        notif = Notificacion.objects.select_related("usuario", "plantilla").get(
            idnotificacion=notif_id
        )
    except Notificacion.DoesNotExist:
        logger.warning("enviar_notificacion: id=%s no existe", notif_id)
        return

    if notif.estado in ("enviada", "leida"):
        logger.info("Notificación %s ya estaba enviada; skip.", notif_id)
        return

    try:
        backend = resolve_backend(notif.canal)
        backend.send(notif)
    except Exception as exc:
        notif.intentos += 1
        notif.estado = "fallida"
        notif.save(update_fields=["intentos", "estado"])
        logger.exception("Fallo enviando notificación %s", notif_id)
        # Backoff exponencial: 30s, 60s, 120s, 240s, 480s
        countdown = 30 * (2**self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)

    notif.estado = "enviada"
    notif.enviada_at = timezone.now()
    notif.save(update_fields=["estado", "enviada_at"])
