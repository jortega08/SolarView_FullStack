# telemetria/views.py
from django.db.models import Sum
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from datetime import datetime
from django.utils import timezone
import logging
from .models import Consumo, Bateria
from core.models import Domicilio
import json

logger = logging.getLogger(__name__)



@csrf_exempt
@require_http_methods(["POST"])
def registrar_datos(request):
    try:
        data = json.loads(request.body)
        domicilio_id = data.get("domicilio_id")
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)

        # --- Datos de consumo ---
        consumo = Consumo.objects.create(
            domicilio=domicilio,
            energia_consumida=data.get("energia_consumida"),
            potencia=data.get("potencia"),
            fuente=data.get("fuente"),
            costo=data.get("costo"),
        )

        # Ejecutar triggers de gamificación
        consumo.actualizar_puntaje()
        consumo.autonomia_solar()
        consumo.uso_solar_constante()
        consumo.reduccion_consumo_semanal()
        consumo.penalizacion_consumo_diario()
        consumo.penalizacion_picos_consumo()
        consumo.logro_mes_solar()
        consumo.logro_1MWh_generado()

        # --- Datos de batería ---
        bateria = Bateria.objects.create(
            domicilio=domicilio,
            voltaje=data.get("voltaje"),
            corriente=data.get("corriente"),
            temperatura=data.get("temperatura"),
            capacidad_bateria=data.get("capacidad_bateria"),
            porcentaje_carga=data.get("porcentaje_carga"),
            tiempo_restante=data.get("tiempo_restante"),
        )

        # Ejecutar triggers de alerta
        bateria.alerta_temperatura()
        bateria.alerta_carga()
        bateria.actualizar_puntaje_rendimiento(data.get("energia_generada", 0))

        return JsonResponse({
            "success": True,
            "timestamp": timezone.now().isoformat(),
            "consumo_id": consumo.idconsumo,
            "bateria_id": bateria.idbateria
        })

    except Domicilio.DoesNotExist:
        return JsonResponse({"success": False, "error": "Domicilio no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)
    
@csrf_exempt
@require_http_methods(["GET"])
def ver_datos(request):
    consumos = list(Consumo.objects.values().order_by('-idconsumo')[:10])
    baterias = list(Bateria.objects.values().order_by('-idbateria')[:10])
    return JsonResponse({
        "consumos": consumos,
        "baterias": baterias,
    }, safe=False)


@require_http_methods(["GET"])
def factura_mensual(request):
    domicilio_id = request.GET.get("domicilio_id")
    mes = request.GET.get("mes")
    ano = request.GET.get("ano")

    # ✅ Validar los parámetros antes de convertir a int
    if not domicilio_id or not mes or not ano:
        return JsonResponse({"error": "Faltan datos"}, status=400)

    try:
        domicilio_id = int(domicilio_id)
        mes = int(mes)
        ano = int(ano)
    except ValueError:
        return JsonResponse({"error": "Parámetros inválidos: debe ser número"}, status=400)

    try:
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
    except Domicilio.DoesNotExist:
        return JsonResponse({"error": "Domicilio no encontrado"}, status=404)

    consumos = Consumo.objects.filter(
        domicilio=domicilio,
        fecha__year=ano,
        fecha__month=mes
    )

    electrica = consumos.filter(fuente='electrica').aggregate(
        total=Sum('energia_consumida')
    )['total'] or 0

    solar = consumos.filter(fuente='solar').aggregate(
        total=Sum('energia_consumida')
    )['total'] or 0

    costo_total = consumos.aggregate(
        total=Sum('costo')
    )['total'] or 0

    usuario_nombre = getattr(domicilio.usuario, 'nombre', str(domicilio.usuario))
    ciudad_nombre = getattr(domicilio.ciudad, 'nombre', str(domicilio.ciudad))

    return JsonResponse({
        "electrica": float(electrica),
        "solar": float(solar),
        "costo": float(costo_total),
        "fecha_emision": timezone.now().strftime("%Y-%m-%d"),
        "usuario": usuario_nombre,
        "domicilio": str(domicilio),
        "ciudad": ciudad_nombre,
        # "consumos": list(consumos.values())  # Solo para depuración, si quieres ver datos
    })
