import json
import logging

from django.db.models import Sum
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.models import ConfiguracionUser, Domicilio, Instalacion

from .models import Bateria, Consumo

logger = logging.getLogger(__name__)

FUENTES_VALIDAS = {'solar', 'electrica'}


def _validate_positive_float(value, field_name):
    if value is None:
        raise ValueError(f"El campo '{field_name}' es requerido.")
    try:
        val = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"El campo '{field_name}' debe ser un numero valido.") from exc
    if val < 0:
        raise ValueError(f"El campo '{field_name}' no puede ser negativo.")
    return val


def _resolve_operational_context(data):
    domicilio_id = data.get('domicilio_id')
    instalacion_id = data.get('instalacion_id')

    if not domicilio_id and not instalacion_id:
        raise ValueError('domicilio_id o instalacion_id es requerido')

    instalacion = Instalacion.objects.get(idinstalacion=instalacion_id) if instalacion_id else None
    domicilio = Domicilio.objects.get(iddomicilio=domicilio_id) if domicilio_id else None

    # Modo legacy: intentar enlazar domicilio ↔ instalacion via ConfiguracionUser
    if domicilio and not instalacion:
        config = (
            ConfiguracionUser.objects
            .select_related('instalacion')
            .filter(domicilio=domicilio, instalacion__isnull=False)
            .first()
        )
        if config:
            instalacion = config.instalacion

    return domicilio, instalacion


@csrf_exempt
@require_http_methods(['POST'])
def registrar_datos(request):
    try:
        data = json.loads(request.body)
        domicilio, instalacion = _resolve_operational_context(data)

        energia_consumida = _validate_positive_float(data.get('energia_consumida'), 'energia_consumida')
        potencia = _validate_positive_float(data.get('potencia'), 'potencia')
        costo = _validate_positive_float(data.get('costo'), 'costo')

        fuente = data.get('fuente', 'electrica')
        if fuente not in FUENTES_VALIDAS:
            return JsonResponse(
                {'success': False, 'error': f"fuente debe ser una de: {', '.join(FUENTES_VALIDAS)}"},
                status=400,
            )

        consumo = Consumo.objects.create(
            domicilio=domicilio,
            instalacion=instalacion,
            energia_consumida=energia_consumida,
            potencia=potencia,
            fuente=fuente,
            costo=costo,
        )

        voltaje = _validate_positive_float(data.get('voltaje'), 'voltaje')
        corriente = _validate_positive_float(data.get('corriente'), 'corriente')
        temperatura = float(data.get('temperatura', 0))
        capacidad_bateria = _validate_positive_float(data.get('capacidad_bateria'), 'capacidad_bateria')
        porcentaje_carga_val = float(data.get('porcentaje_carga', 0))
        if porcentaje_carga_val < 0 or porcentaje_carga_val > 100:
            return JsonResponse({'success': False, 'error': 'porcentaje_carga debe estar entre 0 y 100'}, status=400)
        tiempo_restante = _validate_positive_float(data.get('tiempo_restante'), 'tiempo_restante')

        bateria = Bateria.objects.create(
            domicilio=domicilio,
            instalacion=instalacion,
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
            instalacion_id=instalacion.idinstalacion if instalacion else None,
            domicilio_id=domicilio.iddomicilio if domicilio else None,
            data_type='sensor',
            data={
                'consumo_id': consumo.idconsumo,
                'bateria_id': bateria.idbateria,
                'instalacion_id': instalacion.idinstalacion if instalacion else None,
                'domicilio_id': domicilio.iddomicilio if domicilio else None,
                'energia_consumida': energia_consumida,
                'fuente': fuente,
                'porcentaje_carga': porcentaje_carga_val,
                'temperatura': temperatura,
            },
        )

        return JsonResponse({
            'success': True,
            'timestamp': timezone.now().isoformat(),
            'consumo_id': consumo.idconsumo,
            'bateria_id': bateria.idbateria,
            'domicilio_id': domicilio.iddomicilio if domicilio else None,
            'instalacion_id': instalacion.idinstalacion if instalacion else None,
        })

    except Domicilio.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Domicilio no encontrado'}, status=400)
    except Instalacion.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Instalacion no encontrada'}, status=400)
    except ValueError as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'JSON invalido'}, status=400)
    except Exception as e:
        logger.exception('Error en registrar_datos')
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(['GET'])
def ver_datos(request):
    consumos = list(Consumo.objects.values().order_by('-idconsumo')[:10])
    baterias = list(Bateria.objects.values().order_by('-idbateria')[:10])
    return JsonResponse({
        'consumos': consumos,
        'baterias': baterias,
    }, safe=False)


@require_http_methods(['GET'])
def factura_mensual(request):
    domicilio_id = request.GET.get('domicilio_id')
    mes = request.GET.get('mes')
    ano = request.GET.get('ano')

    if not domicilio_id or not mes or not ano:
        return JsonResponse({'error': 'Faltan datos'}, status=400)

    try:
        domicilio_id = int(domicilio_id)
        mes = int(mes)
        ano = int(ano)
    except ValueError:
        return JsonResponse({'error': 'Parametros invalidos: debe ser numero'}, status=400)

    try:
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
    except Domicilio.DoesNotExist:
        return JsonResponse({'error': 'Domicilio no encontrado'}, status=404)

    consumos = Consumo.objects.filter(
        domicilio=domicilio,
        fecha__year=ano,
        fecha__month=mes
    )

    electrica = consumos.filter(fuente='electrica').aggregate(total=Sum('energia_consumida'))['total'] or 0
    solar = consumos.filter(fuente='solar').aggregate(total=Sum('energia_consumida'))['total'] or 0
    costo_total = consumos.aggregate(total=Sum('costo'))['total'] or 0

    usuario_nombre = getattr(domicilio.usuario, 'nombre', str(domicilio.usuario))
    ciudad_nombre = getattr(domicilio.ciudad, 'nombre', str(domicilio.ciudad))

    return JsonResponse({
        'electrica': float(electrica),
        'solar': float(solar),
        'costo': float(costo_total),
        'fecha_emision': timezone.now().strftime('%Y-%m-%d'),
        'usuario': usuario_nombre,
        'domicilio': str(domicilio),
        'ciudad': ciudad_nombre,
    })
