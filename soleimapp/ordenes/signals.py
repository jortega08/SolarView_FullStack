"""
Signals de la app `ordenes`:

1. `pre_save` en OrdenTrabajo: detecta cambio de estado y prepara un flag
   para crear el comentario después del save.
2. `post_save` en OrdenTrabajo: si hubo cambio de estado, crea ComentarioOrden(tipo='cambio_estado').
3. `post_save` en alerta.Alerta: alerta crítica/alta nueva → dispara task Celery
   para crear OrdenTrabajo automáticamente (workflow del Lote 4).
"""
from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from alerta.models import Alerta

from .models import ComentarioOrden, OrdenTrabajo


# ---------------------------------------------------------------------------
# 1 + 2. Cambio de estado de orden → comentario automático
# ---------------------------------------------------------------------------

@receiver(pre_save, sender=OrdenTrabajo)
def _orden_pre_save_track_estado(sender, instance, **kwargs):
    """Antes de guardar, si la instancia ya existe, recordar el estado anterior."""
    if not instance.pk:
        instance._estado_changed = False
        instance._old_estado = None
        return
    try:
        anterior = OrdenTrabajo.objects.only('estado').get(pk=instance.pk)
    except OrdenTrabajo.DoesNotExist:
        instance._estado_changed = False
        instance._old_estado = None
        return
    if anterior.estado != instance.estado:
        instance._estado_changed = True
        instance._old_estado = anterior.estado
    else:
        instance._estado_changed = False
        instance._old_estado = None


@receiver(post_save, sender=OrdenTrabajo)
def _orden_post_save_log_estado(sender, instance, created, **kwargs):
    """Después de guardar, si hubo cambio de estado, registrar comentario."""
    if created:
        ComentarioOrden.objects.create(
            orden=instance,
            usuario=instance.creado_por,
            tipo='sistema',
            texto=f'Orden {instance.codigo} creada en estado "{instance.estado}".',
        )
        return
    if getattr(instance, '_estado_changed', False):
        ComentarioOrden.objects.create(
            orden=instance,
            usuario=None,  # cambio rastreado por el sistema
            tipo='cambio_estado',
            texto=f'Estado: {instance._old_estado} → {instance.estado}',
        )


# ---------------------------------------------------------------------------
# 3. Alerta crítica/alta → crear OrdenTrabajo (vía Celery, en Lote 4)
# ---------------------------------------------------------------------------

@receiver(post_save, sender=Alerta)
def _alerta_post_save_crear_orden(sender, instance, created, **kwargs):
    """
    Cuando se crea una alerta nueva con severidad crítica o alta y estado activa,
    dispara la task de creación de orden en el commit de la transacción.
    """
    if not created or instance.estado != 'activa':
        return
    if instance.severidad not in ('critica', 'alta'):
        return
    if not instance.instalacion_id:
        return
    # Idempotencia: si ya existe una orden ligada a esta alerta, no dupliques
    if instance.ordenes.exists():
        return

    # Encolar la task sólo después de que la transacción haya hecho COMMIT;
    # si no, la task podría leer la alerta antes de que esté en la BD.
    def _enqueue():
        from . import tasks  # import perezoso para evitar ciclo en migraciones
        tasks.crear_orden_para_alerta.delay(instance.idalerta)

    transaction.on_commit(_enqueue)
