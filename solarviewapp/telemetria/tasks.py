import logging

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False

    # Stub: tasks run synchronously when Celery is not installed (local dev)
    class _SyncTask:
        def __init__(self, func):
            self._func = func

        def delay(self, *args, **kwargs):
            try:
                self._func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Task {self._func.__name__} failed: {e}")

        def __call__(self, *args, **kwargs):
            return self._func(*args, **kwargs)

    def shared_task(*args, **kwargs):
        # Support both @shared_task and @shared_task(bind=True, ...)
        def decorator(func):
            return _SyncTask(func)
        if len(args) == 1 and callable(args[0]):
            return _SyncTask(args[0])
        return decorator


if CELERY_AVAILABLE:
    @shared_task(bind=True, max_retries=3)
    def process_gamification(self, consumo_id):
        """Process all gamification triggers asynchronously."""
        try:
            from .models import Consumo
            consumo = Consumo.objects.get(idconsumo=consumo_id)
            consumo.actualizar_puntaje()
            consumo.autonomia_solar()
            consumo.uso_solar_constante()
            consumo.reduccion_consumo_semanal()
            consumo.penalizacion_consumo_diario()
            consumo.penalizacion_picos_consumo()
            consumo.logro_mes_solar()
            consumo.logro_1MWh_generado()
            logger.info(f"Gamificacion procesada para consumo {consumo_id}")
        except Exception as exc:
            logger.exception(f"Error procesando gamificacion consumo {consumo_id}")
            raise self.retry(exc=exc, countdown=5)

    @shared_task(bind=True, max_retries=3)
    def process_battery_alerts(self, bateria_id, energia_generada):
        """Process battery alerts asynchronously."""
        try:
            from .models import Bateria
            bateria = Bateria.objects.get(idbateria=bateria_id)
            bateria.alerta_temperatura()
            bateria.alerta_carga()
            bateria.actualizar_puntaje_rendimiento(energia_generada)
            logger.info(f"Alertas bateria procesadas para bateria {bateria_id}")
        except Exception as exc:
            logger.exception(f"Error procesando alertas bateria {bateria_id}")
            raise self.retry(exc=exc, countdown=5)

    @shared_task
    def notify_realtime_update(domicilio_id, data_type, data):
        """Send real-time WebSocket updates."""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if channel_layer is None:
                return
            async_to_sync(channel_layer.group_send)(
                f"domicilio_{domicilio_id}",
                {'type': 'sensor_update', 'data_type': data_type, 'data': data}
            )
        except Exception as e:
            logger.warning(f"No se pudo enviar update WebSocket: {e}")

else:
    # Synchronous fallback for local development without Celery
    def _process_gamification_sync(consumo_id):
        from .models import Consumo
        consumo = Consumo.objects.get(idconsumo=consumo_id)
        consumo.actualizar_puntaje()
        consumo.autonomia_solar()
        consumo.uso_solar_constante()
        consumo.reduccion_consumo_semanal()
        consumo.penalizacion_consumo_diario()
        consumo.penalizacion_picos_consumo()
        consumo.logro_mes_solar()
        consumo.logro_1MWh_generado()

    def _process_battery_alerts_sync(bateria_id, energia_generada):
        from .models import Bateria
        bateria = Bateria.objects.get(idbateria=bateria_id)
        bateria.alerta_temperatura()
        bateria.alerta_carga()
        bateria.actualizar_puntaje_rendimiento(energia_generada)

    def _notify_realtime_sync(domicilio_id, data_type, data):
        pass  # No WebSocket without channels in local dev

    process_gamification = _SyncTask(_process_gamification_sync)
    process_battery_alerts = _SyncTask(_process_battery_alerts_sync)
    notify_realtime_update = _SyncTask(_notify_realtime_sync)
