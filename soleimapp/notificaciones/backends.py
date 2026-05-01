"""
Backends de envío de notificaciones. Cada backend implementa `.send(notificacion)`.

El task `enviar_notificacion` resuelve el backend según `notificacion.canal`
mediante `settings.NOTIFICATION_BACKENDS`.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils.module_loading import import_string

logger = logging.getLogger("soleim")


class NotificationBackend:
    """Interfaz base."""

    def send(self, notificacion) -> None:
        raise NotImplementedError


class InAppBackend(NotificationBackend):
    """
    Backend in-app: la notificación ya está persistida en la BD;
    el frontend la consulta vía /api/notificaciones/.
    No requiere acción adicional.
    """

    def send(self, notificacion) -> None:
        logger.info(
            "in_app notif id=%s usuario=%s asunto=%r",
            notificacion.idnotificacion,
            notificacion.usuario_id,
            notificacion.asunto,
        )


class EmailBackend(NotificationBackend):
    """Backend email: usa django.core.mail con DEFAULT_FROM_EMAIL."""

    def send(self, notificacion) -> None:
        destinatario = notificacion.usuario.email
        if not destinatario:
            raise ValueError(f"Usuario {notificacion.usuario_id} no tiene email.")
        send_mail(
            subject=notificacion.asunto,
            message=notificacion.cuerpo,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@soleim.io"),
            recipient_list=[destinatario],
            fail_silently=False,
        )
        logger.info(
            "email enviado: id=%s → %s", notificacion.idnotificacion, destinatario
        )


class WebhookBackend(NotificationBackend):
    """
    Backend webhook: POST a la URL almacenada en metadata['webhook_url']
    (o, si no, en settings.DEFAULT_WEBHOOK_URL).
    """

    def send(self, notificacion) -> None:
        import requests  # ya está en requirements

        url = (notificacion.metadata or {}).get("webhook_url") or getattr(
            settings, "DEFAULT_WEBHOOK_URL", ""
        )
        if not url:
            raise ValueError("Webhook URL no configurada para esta notificación.")

        payload = {
            "id": notificacion.idnotificacion,
            "asunto": notificacion.asunto,
            "cuerpo": notificacion.cuerpo,
            "usuario_id": notificacion.usuario_id,
            "enlace": notificacion.enlace,
            "metadata": notificacion.metadata,
        }
        resp = requests.post(url, json=payload, timeout=5)
        resp.raise_for_status()
        logger.info(
            "webhook enviado: id=%s → %s (status=%s)",
            notificacion.idnotificacion,
            url,
            resp.status_code,
        )


# ---------------------------------------------------------------------
# Resolver de backends
# ---------------------------------------------------------------------

_DEFAULT_MAP = {
    "in_app": "notificaciones.backends.InAppBackend",
    "email": "notificaciones.backends.EmailBackend",
    "webhook": "notificaciones.backends.WebhookBackend",
    # 'sms', 'push' → quedan para futuras integraciones (Twilio, FCM…)
}


def resolve_backend(canal: str) -> NotificationBackend:
    backends_map = getattr(settings, "NOTIFICATION_BACKENDS", {}) or _DEFAULT_MAP
    cls_path = backends_map.get(canal) or _DEFAULT_MAP.get(canal)
    if not cls_path:
        raise ValueError(f"Backend no configurado para canal {canal!r}.")
    cls = import_string(cls_path)
    return cls()
