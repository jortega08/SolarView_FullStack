import logging
from celery import shared_task

logger = logging.getLogger(__name__)


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
        logger.exception(f"Error procesando gamificacion para consumo {consumo_id}")
        raise self.retry(exc=exc, countdown=5)


@shared_task(bind=True, max_retries=3)
def process_battery_alerts(self, bateria_id, energia_generada):
    """Process battery alerts and score updates asynchronously."""
    try:
        from .models import Bateria
        bateria = Bateria.objects.get(idbateria=bateria_id)

        bateria.alerta_temperatura()
        bateria.alerta_carga()
        bateria.actualizar_puntaje_rendimiento(energia_generada)

        logger.info(f"Alertas de bateria procesadas para bateria {bateria_id}")
    except Exception as exc:
        logger.exception(f"Error procesando alertas de bateria {bateria_id}")
        raise self.retry(exc=exc, countdown=5)


@shared_task
def notify_realtime_update(domicilio_id, data_type, data):
    """Send real-time updates via WebSocket channels."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        group_name = f"domicilio_{domicilio_id}"

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'sensor_update',
                'data_type': data_type,
                'data': data,
            }
        )
        logger.info(f"WebSocket update enviado a {group_name}: {data_type}")
    except Exception as e:
        logger.warning(f"No se pudo enviar update WebSocket: {e}")