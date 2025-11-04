# telemetria/views.py
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.utils import timezone
from .models import Consumo, Bateria
from core.models import Domicilio
import json, random

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
