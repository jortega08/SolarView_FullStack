import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_battery_alerts(self, bateria_id):
    try:
        from .models import Bateria

        bateria = Bateria.objects.get(idbateria=bateria_id)
        bateria.alerta_temperatura()
        bateria.alerta_carga()
        logger.info(f'Alertas de bateria procesadas para bateria {bateria_id}')
    except Exception as exc:
        logger.exception(f'Error procesando alertas de bateria {bateria_id}')
        raise self.retry(exc=exc, countdown=5)


@shared_task
def notify_realtime_update(instalacion_id=None, domicilio_id=None, data_type='sensor', data=None):
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        group_names = []
        if domicilio_id:
            group_names.append(f'domicilio_{domicilio_id}')
        if instalacion_id:
            group_names.append(f'instalacion_{instalacion_id}')

        for group_name in group_names:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'sensor_update',
                    'data_type': data_type,
                    'data': data or {},
                }
            )
        logger.info(f'WebSocket update enviado a {group_names}: {data_type}')
    except Exception as e:
        logger.warning(f'No se pudo enviar update WebSocket: {e}')
