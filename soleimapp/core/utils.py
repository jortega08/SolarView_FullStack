"""Utilidades compartidas del módulo `core`."""
import logging
import secrets
from functools import lru_cache

from .models import Usuario

logger = logging.getLogger('soleim')

SYSTEM_USER_EMAIL = 'system@soleim.local'


@lru_cache(maxsize=1)
def _system_user_cached_id():
    """
    Devuelve el ID (cacheado en proceso) del Usuario de sistema, creándolo si no existe.

    El usuario de sistema se usa como `creado_por` en flujos automáticos
    (alertas → órdenes, mantenimientos preventivos generados por Celery Beat,
    notificaciones disparadas por el sistema, etc.).

    Características:
    - email: 'system@soleim.local'
    - rol: 'admin' (necesario para que pueda figurar en auditoría sin restricción)
    - is_active: False  → no se puede iniciar sesión con esta cuenta
    - contraseña: aleatoria de 64 chars (nadie puede usarla; queda hasheada)
    """
    user = Usuario.objects.filter(email=SYSTEM_USER_EMAIL).first()
    if user:
        return user.idusuario

    user = Usuario(
        nombre='Sistema Soleim',
        email=SYSTEM_USER_EMAIL,
        rol='admin',
        is_active=False,
    )
    user.set_password(secrets.token_urlsafe(48))
    user.save()
    logger.info('Usuario de sistema creado (id=%s)', user.idusuario)
    return user.idusuario


def system_user():
    """Devuelve la instancia Usuario del sistema (auto-creada si hace falta)."""
    return Usuario.objects.get(idusuario=_system_user_cached_id())
