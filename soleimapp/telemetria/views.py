import json
import logging

from django.conf import settings
from django.db import IntegrityError
from django.db.models import Sum
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from core.access import get_user_installation_queryset
from core.models import ConfiguracionUser, Domicilio, Instalacion
from core.permissions import IsActiveUser
from soleimapp.pagination import (
    BateriaTimeSeriesCursorPagination,
    TimeSeriesCursorPagination,
)

from .models import Bateria, Consumo
from .serializers import BateriaSerializer, ConsumoSerializer
from .task import IOT_BATERIA_BUFFER_KEY, IOT_CONSUMO_BUFFER_KEY

logger = logging.getLogger("soleim")

FUENTES_VALIDAS = {"solar", "electrica"}
REALTIME_OPTIONAL_FIELDS = {
    "energia_generada",
    "irradiancia",
    "exportacion",
    "importacion",
    "temperatura_ambiente",
    "humedad",
    "viento",
    "timestamp",
}


# ---------------------------------------------------------------------------
# Helpers de validación
# ---------------------------------------------------------------------------


def _validate_positive_float(value, field_name):
    if value is None:
        raise ValueError(f"El campo '{field_name}' es requerido.")
    try:
        val = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"El campo '{field_name}' debe ser un número válido.") from exc
    if val < 0:
        raise ValueError(f"El campo '{field_name}' no puede ser negativo.")
    return val


def _optional_realtime_fields(data):
    values = {}
    for field in REALTIME_OPTIONAL_FIELDS:
        value = data.get(field)
        if value is None:
            continue
        if field == "timestamp":
            values[field] = str(value)
            continue
        try:
            values[field] = float(value)
        except (TypeError, ValueError):
            logger.warning("registrar_datos: campo opcional invalido: %s", field)
    return values


def _optional_positive_int(value, field_name):
    if value in (None, ""):
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"El campo '{field_name}' debe ser un entero valido.") from exc
    if parsed <= 0:
        raise ValueError(f"El campo '{field_name}' debe ser mayor que cero.")
    return parsed


def _resolve_ingest_ids(data):
    domicilio_id = _optional_positive_int(data.get("domicilio_id"), "domicilio_id")
    instalacion_id = _optional_positive_int(
        data.get("instalacion_id"), "instalacion_id"
    )

    if not domicilio_id and not instalacion_id:
        raise ValueError("domicilio_id o instalacion_id es requerido")

    # Fast path for MQTT: the publisher sends instalacion_id, so avoid a DB
    # lookup for every sensor sample.
    if instalacion_id or not domicilio_id:
        return domicilio_id, instalacion_id

    # Legacy domicilio-only payloads can still be linked to an installation.
    instalacion_id = (
        ConfiguracionUser.objects.filter(
            domicilio_id=domicilio_id, instalacion__isnull=False
        )
        .values_list("instalacion_id", flat=True)
        .first()
    )
    return domicilio_id, instalacion_id


def _resolve_operational_context(data):
    domicilio_id = data.get("domicilio_id")
    instalacion_id = data.get("instalacion_id")

    if not domicilio_id and not instalacion_id:
        raise ValueError("domicilio_id o instalacion_id es requerido")

    instalacion = (
        Instalacion.objects.get(idinstalacion=instalacion_id)
        if instalacion_id
        else None
    )
    domicilio = (
        Domicilio.objects.get(iddomicilio=domicilio_id) if domicilio_id else None
    )

    # Modo legacy: enlazar domicilio ↔ instalacion via ConfiguracionUser
    if domicilio and not instalacion:
        config = (
            ConfiguracionUser.objects.select_related("instalacion")
            .filter(domicilio=domicilio, instalacion__isnull=False)
            .first()
        )
        if config:
            instalacion = config.instalacion

    return domicilio, instalacion


def _validate_iot_key(request):
    """
    Valida la clave compartida del consumer MQTT.
    Si IOT_SHARED_SECRET está vacío, el check se omite (desarrollo local).
    """
    secret = getattr(settings, "IOT_SHARED_SECRET", "")
    if not secret:
        return True  # Sin secreto configurado → permitir (sólo en dev)
    provided = request.headers.get("X-IoT-Key", "")
    return provided == secret


# ---------------------------------------------------------------------------
# Endpoint de ingesta IoT (llamado por el consumer MQTT)
# ---------------------------------------------------------------------------


def _push_to_iot_buffer(
    redis_client, consumo_payload: dict, bateria_payload: dict
) -> None:
    """
    Push validated IoT payloads to the Redis write-ahead buffer.
    Uses a pipeline to minimise round-trips.
    """
    pipe = redis_client.pipeline()
    pipe.rpush(IOT_CONSUMO_BUFFER_KEY, json.dumps(consumo_payload))
    pipe.rpush(IOT_BATERIA_BUFFER_KEY, json.dumps(bateria_payload))
    pipe.execute()


@csrf_exempt
@require_http_methods(["POST"])
def registrar_datos(request):
    """
    Endpoint de ingesta para el consumer MQTT.
    Autenticación: clave compartida (X-IoT-Key).
    No usa JWT porque es una llamada M2M dentro de la red Docker.

    P2 — Modo buffer (IOT_BUFFER_ENABLED=True en settings):
      Valida el payload, lo serializa y lo encola en Redis (RPUSH).
      Retorna 202 Accepted inmediatamente; la escritura real a Postgres la
      hace el task flush_iot_buffer (Celery Beat cada 3 s) con bulk_create.
      WebSocket update se sigue enviando de forma asíncrona para UI en tiempo real.

    Modo sync (por defecto / IOT_BUFFER_ENABLED=False):
      Comportamiento original — escribe directamente a Postgres.
    """
    if not _validate_iot_key(request):
        logger.warning(
            "registrar_datos: clave IoT inválida desde %s",
            request.META.get("REMOTE_ADDR"),
        )
        return JsonResponse({"success": False, "error": "No autorizado"}, status=401)

    try:
        data = json.loads(request.body)
        domicilio_id, instalacion_id = _resolve_ingest_ids(data)

        energia_consumida = _validate_positive_float(
            data.get("energia_consumida"), "energia_consumida"
        )
        potencia = _validate_positive_float(data.get("potencia"), "potencia")
        costo = _validate_positive_float(data.get("costo"), "costo")

        fuente = data.get("fuente", "electrica")
        if fuente not in FUENTES_VALIDAS:
            return JsonResponse(
                {
                    "success": False,
                    "error": f"fuente debe ser una de: {', '.join(FUENTES_VALIDAS)}",
                },
                status=400,
            )

        voltaje = _validate_positive_float(data.get("voltaje"), "voltaje")
        corriente = _validate_positive_float(data.get("corriente"), "corriente")
        temperatura = float(data.get("temperatura", 0))
        capacidad_bateria = _validate_positive_float(
            data.get("capacidad_bateria"), "capacidad_bateria"
        )
        porcentaje_carga_val = float(data.get("porcentaje_carga", 0))
        if not 0 <= porcentaje_carga_val <= 100:
            return JsonResponse(
                {
                    "success": False,
                    "error": "porcentaje_carga debe estar entre 0 y 100",
                },
                status=400,
            )
        tiempo_restante = _validate_positive_float(
            data.get("tiempo_restante"), "tiempo_restante"
        )

        realtime_extra = _optional_realtime_fields(data)
        realtime_payload = {
            "instalacion_id": instalacion_id,
            "domicilio_id": domicilio_id,
            "energia_consumida": energia_consumida,
            "potencia": potencia,
            "fuente": fuente,
            "costo": costo,
            "voltaje": voltaje,
            "corriente": corriente,
            "temperatura": temperatura,
            "capacidad_bateria": capacidad_bateria,
            "porcentaje_carga": porcentaje_carga_val,
            "tiempo_restante": tiempo_restante,
            **realtime_extra,
        }

        buffer_enabled = getattr(settings, "IOT_BUFFER_ENABLED", False)

        if buffer_enabled:
            # ---- Async / buffered path (P2) ----
            try:
                from django_redis import get_redis_connection

                redis = get_redis_connection("default")
                _push_to_iot_buffer(
                    redis,
                    consumo_payload={
                        "instalacion_id": instalacion_id,
                        "domicilio_id": domicilio_id,
                        "energia_consumida": energia_consumida,
                        "potencia": potencia,
                        "fuente": fuente,
                        "costo": costo,
                    },
                    bateria_payload={
                        "instalacion_id": instalacion_id,
                        "domicilio_id": domicilio_id,
                        "voltaje": voltaje,
                        "corriente": corriente,
                        "temperatura": temperatura,
                        "capacidad_bateria": capacidad_bateria,
                        "porcentaje_carga": porcentaje_carga_val,
                        "tiempo_restante": tiempo_restante,
                    },
                )
            except Exception:
                logger.exception(
                    "registrar_datos: Redis buffer write failed, falling back to sync"
                )
                buffer_enabled = False  # fall through to synchronous write below

            if buffer_enabled:
                # WebSocket update still fires immediately (lightweight, no DB)
                from .tasks import notify_realtime_update

                notify_realtime_update.delay(
                    instalacion_id=instalacion_id,
                    domicilio_id=domicilio_id,
                    data_type="sensor",
                    data={**realtime_payload, "buffered": True},
                )
                return JsonResponse(
                    {
                        "success": True,
                        "buffered": True,
                        "timestamp": timezone.now().isoformat(),
                        "instalacion_id": instalacion_id,
                        "domicilio_id": domicilio_id,
                    },
                    status=202,
                )

        # ---- Synchronous / direct-write path (original behaviour) ----
        consumo = Consumo.objects.create(
            domicilio_id=domicilio_id,
            instalacion_id=instalacion_id,
            energia_consumida=energia_consumida,
            potencia=potencia,
            fuente=fuente,
            costo=costo,
        )

        bateria = Bateria.objects.create(
            domicilio_id=domicilio_id,
            instalacion_id=instalacion_id,
            voltaje=voltaje,
            corriente=corriente,
            temperatura=temperatura,
            capacidad_bateria=capacidad_bateria,
            porcentaje_carga=porcentaje_carga_val,
            tiempo_restante=tiempo_restante,
        )

        from .tasks import notify_realtime_update, process_battery_alerts

        process_battery_alerts.delay(bateria.idbateria)
        notify_realtime_update.delay(
            instalacion_id=instalacion_id,
            domicilio_id=domicilio_id,
            data_type="sensor",
            data={
                **realtime_payload,
                "consumo_id": consumo.idconsumo,
                "bateria_id": bateria.idbateria,
            },
        )

        return JsonResponse(
            {
                "success": True,
                "timestamp": timezone.now().isoformat(),
                "consumo_id": consumo.idconsumo,
                "bateria_id": bateria.idbateria,
                "domicilio_id": domicilio_id,
                "instalacion_id": instalacion_id,
            }
        )

    except Domicilio.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Domicilio no encontrado"}, status=400
        )
    except Instalacion.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Instalación no encontrada"}, status=400
        )
    except ValueError as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "JSON inválido"}, status=400)
    except IntegrityError:
        return JsonResponse(
            {
                "success": False,
                "error": "domicilio_id o instalacion_id no existe",
            },
            status=400,
        )
    except Exception:
        logger.exception("Error en registrar_datos")
        return JsonResponse(
            {"success": False, "error": "Error interno del servidor"}, status=500
        )


# ---------------------------------------------------------------------------
# Endpoints de consulta (accedidos por el frontend con JWT)
# ---------------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def ver_datos(request):
    """Devuelve los últimos 10 registros de consumo y batería del usuario."""
    user = request.user
    consumos_qs = Consumo.objects.order_by("-idconsumo")
    baterias_qs = Bateria.objects.order_by("-idbateria")

    if user.rol != "admin":
        ids = list(
            get_user_installation_queryset(user).values_list("idinstalacion", flat=True)
        )
        consumos_qs = consumos_qs.filter(instalacion_id__in=ids)
        baterias_qs = baterias_qs.filter(instalacion_id__in=ids)

    return JsonResponse(
        {
            "consumos": list(consumos_qs.values()[:10]),
            "baterias": list(baterias_qs.values()[:10]),
        },
        safe=False,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def factura_mensual(request):
    """Factura mensual de consumo para un domicilio."""
    domicilio_id = request.GET.get("domicilio_id")
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")

    if not domicilio_id or not mes or not ano:
        return JsonResponse({"error": "Faltan datos"}, status=400)

    try:
        domicilio_id = int(domicilio_id)
        mes = int(mes)
        ano = int(ano)
    except ValueError:
        return JsonResponse(
            {"error": "Parámetros inválidos: deben ser números"}, status=400
        )

    try:
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
    except Domicilio.DoesNotExist:
        return JsonResponse({"error": "Domicilio no encontrado"}, status=404)

    # Verificar que el usuario tiene acceso al domicilio
    user = request.user
    if user.rol != "admin" and domicilio.usuario != user:
        return JsonResponse({"error": "Sin acceso a este domicilio"}, status=403)

    consumos = Consumo.objects.filter(
        domicilio=domicilio,
        fecha__year=ano,
        fecha__month=mes,
    )

    electrica = (
        consumos.filter(fuente="electrica").aggregate(total=Sum("energia_consumida"))[
            "total"
        ]
        or 0
    )
    solar = (
        consumos.filter(fuente="solar").aggregate(total=Sum("energia_consumida"))[
            "total"
        ]
        or 0
    )
    costo_total = consumos.aggregate(total=Sum("costo"))["total"] or 0

    return JsonResponse(
        {
            "electrica": float(electrica),
            "solar": float(solar),
            "costo": float(costo_total),
            "fecha_emision": timezone.now().strftime("%Y-%m-%d"),
            "usuario": getattr(domicilio.usuario, "nombre", str(domicilio.usuario)),
            "domicilio": str(domicilio),
            "ciudad": getattr(domicilio.ciudad, "nombre", str(domicilio.ciudad)),
        }
    )


# ---------------------------------------------------------------------------
# P2 — Cursor-paginated ViewSets for time-series data
#
# These replace the old ver_datos function view.  The cursor pagination avoids
# the O(N) OFFSET issue on large Consumo/Bateria tables.
#
# Frontend migration:
#   Old:  GET /api/telemetria/ver_datos/   → always returns last 10 rows
#   New:  GET /api/telemetria/consumos/    → cursor-paginated, filterable
#         GET /api/telemetria/baterias/    → cursor-paginated, filterable
# The old ver_datos endpoint is kept for backwards compatibility.
# ---------------------------------------------------------------------------


class ConsumoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Cursor-paginated read-only list of Consumo records.
    Supports ?instalacion=<id> and ?fuente=solar|electrica filters.
    """

    serializer_class = ConsumoSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    pagination_class = TimeSeriesCursorPagination
    filterset_fields = ["fuente", "instalacion"]

    def get_queryset(self):
        user = self.request.user
        qs = Consumo.objects.select_related("instalacion").order_by("-fecha")
        if user.rol != "admin":
            ids = list(
                get_user_installation_queryset(user).values_list(
                    "idinstalacion", flat=True
                )
            )
            qs = qs.filter(instalacion_id__in=ids)
        # Optional ?instalacion filter (already handled by filterset_fields but
        # we guard here so non-authorised instalacion IDs are silently ignored)
        inst_id = self.request.query_params.get("instalacion")
        if inst_id:
            qs = qs.filter(instalacion_id=inst_id)
        return qs


class BateriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Cursor-paginated read-only list of Bateria records.
    Supports ?instalacion=<id> filter.
    """

    serializer_class = BateriaSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    pagination_class = BateriaTimeSeriesCursorPagination
    filterset_fields = ["instalacion"]

    def get_queryset(self):
        user = self.request.user
        qs = Bateria.objects.select_related("instalacion").order_by("-fecha_registro")
        if user.rol != "admin":
            ids = list(
                get_user_installation_queryset(user).values_list(
                    "idinstalacion", flat=True
                )
            )
            qs = qs.filter(instalacion_id__in=ids)
        inst_id = self.request.query_params.get("instalacion")
        if inst_id:
            qs = qs.filter(instalacion_id=inst_id)
        return qs
