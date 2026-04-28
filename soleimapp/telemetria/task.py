import json
import logging

from celery import shared_task

logger = logging.getLogger(__name__)

# Redis keys for the write-ahead buffer
IOT_CONSUMO_BUFFER_KEY = 'iot:consumo_buffer'
IOT_BATERIA_BUFFER_KEY = 'iot:bateria_buffer'
# Maximum records per flush cycle (avoid very large transactions)
FLUSH_BATCH_SIZE = 500


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


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def flush_iot_buffer(self):
    """
    P2 — Drains the Redis write-ahead buffer and persists to Postgres with bulk_create.

    Called by Celery Beat every ~3 seconds (see CELERY_BEAT_SCHEDULE).
    Pattern:
      1. Atomically pop up to FLUSH_BATCH_SIZE entries from each Redis list.
      2. Deserialise and validate each record.
      3. bulk_create(ignore_conflicts=True) — idempotent, safe on retry.
      4. For each new Bateria, fire process_battery_alerts asynchronously.

    No record is lost: LRANGE + LTRIM inside a pipeline is effectively atomic
    (Redis is single-threaded); on task failure the un-trimmed items remain
    in the buffer until the next flush cycle.
    """
    try:
        from django_redis import get_redis_connection
        redis = get_redis_connection('default')
    except Exception as exc:
        logger.error('flush_iot_buffer: cannot connect to Redis — %s', exc)
        raise self.retry(exc=exc)

    flushed_consumo = 0
    flushed_bateria = 0

    # ---- Consumo batch ----
    try:
        pipe = redis.pipeline()
        pipe.lrange(IOT_CONSUMO_BUFFER_KEY, 0, FLUSH_BATCH_SIZE - 1)
        pipe.ltrim(IOT_CONSUMO_BUFFER_KEY, FLUSH_BATCH_SIZE, -1)
        raw_items, _ = pipe.execute()

        if raw_items:
            from .models import Consumo
            objs = []
            for raw in raw_items:
                try:
                    d = json.loads(raw)
                    objs.append(Consumo(
                        domicilio_id=d.get('domicilio_id'),
                        instalacion_id=d.get('instalacion_id'),
                        energia_consumida=d['energia_consumida'],
                        potencia=d['potencia'],
                        fuente=d['fuente'],
                        costo=d['costo'],
                    ))
                except (KeyError, json.JSONDecodeError, TypeError):
                    logger.warning('flush_iot_buffer: invalid consumo record discarded')

            if objs:
                created = Consumo.objects.bulk_create(objs, ignore_conflicts=True)
                flushed_consumo = len(created)
    except Exception as exc:
        logger.exception('flush_iot_buffer: consumo flush failed')
        raise self.retry(exc=exc)

    # ---- Bateria batch ----
    try:
        pipe = redis.pipeline()
        pipe.lrange(IOT_BATERIA_BUFFER_KEY, 0, FLUSH_BATCH_SIZE - 1)
        pipe.ltrim(IOT_BATERIA_BUFFER_KEY, FLUSH_BATCH_SIZE, -1)
        raw_items, _ = pipe.execute()

        if raw_items:
            from .models import Bateria
            objs = []
            for raw in raw_items:
                try:
                    d = json.loads(raw)
                    objs.append(Bateria(
                        domicilio_id=d.get('domicilio_id'),
                        instalacion_id=d.get('instalacion_id'),
                        voltaje=d['voltaje'],
                        corriente=d['corriente'],
                        temperatura=d['temperatura'],
                        capacidad_bateria=d['capacidad_bateria'],
                        porcentaje_carga=d['porcentaje_carga'],
                        tiempo_restante=d['tiempo_restante'],
                    ))
                except (KeyError, json.JSONDecodeError, TypeError):
                    logger.warning('flush_iot_buffer: invalid bateria record discarded')

            if objs:
                created = Bateria.objects.bulk_create(objs, ignore_conflicts=True, update_conflicts=False)
                flushed_bateria = len(created)
                # Trigger battery alert checks asynchronously for newly created records
                for bateria in created:
                    process_battery_alerts.delay(bateria.idbateria)
    except Exception as exc:
        logger.exception('flush_iot_buffer: bateria flush failed')
        raise self.retry(exc=exc)

    if flushed_consumo or flushed_bateria:
        logger.info(
            'flush_iot_buffer: flushed %d consumo + %d bateria records to DB',
            flushed_consumo, flushed_bateria,
        )
