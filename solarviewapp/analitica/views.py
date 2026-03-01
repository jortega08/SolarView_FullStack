import logging
import traceback
from calendar import monthrange
from datetime import timedelta

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db.models import Sum, Avg
from django.db.models.functions import TruncDay
from django.utils import timezone
from django.core.cache import cache

from .models import Puntaje, Recomendacion
from .gamificacion import construir_logros_para_domicilio
from core.models import Domicilio
from telemetria.models import Consumo, Bateria

logger = logging.getLogger(__name__)

CACHE_TTL_SHORT = 30   # 30 seconds for real-time data
CACHE_TTL_MEDIUM = 300  # 5 minutes for stats


@require_GET
def obtener_estadisticas(request):
    try:
        domicilio_id = request.GET.get('domicilio_id', 1)

        # Try cache first
        cache_key = f"stats_{domicilio_id}"
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({'success': True, 'data': cached, 'cached': True})

        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)

        puntaje = Puntaje.objects.filter(domicilio=domicilio).first()

        hoy = timezone.now().date()
        inicio_mes = hoy - timedelta(days=30)

        total_registros = Consumo.objects.filter(domicilio=domicilio).count()

        dias_completos = Consumo.objects.filter(
            domicilio=domicilio,
            fecha__date__gte=inicio_mes
        ).values('fecha__date').distinct().count()

        ahorro_solar = Consumo.objects.filter(
            domicilio=domicilio,
            fuente='solar',
            fecha__date__gte=inicio_mes
        ).aggregate(total=Sum('costo'))['total'] or 0

        data = {
            'open_projects': total_registros,
            'completed_tasks': dias_completos,
            'earnings': round(float(ahorro_solar), 2),
            'puntos': puntaje.puntos if puntaje else 0,
            'nivel': puntaje.nivel if puntaje else 'basico'
        }

        cache.set(cache_key, data, CACHE_TTL_MEDIUM)

        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        logger.exception("Error en obtener_estadisticas")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@require_GET
def obtener_actividades_mensuales(request):
    try:
        domicilio_id = request.GET.get('domicilio_id', 1)
        periodo = request.GET.get('periodo', 'year')

        cache_key = f"actividades_{domicilio_id}_{periodo}"
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({'success': True, 'data': cached, 'periodo': periodo, 'cached': True})

        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
        hoy = timezone.localdate()
        actividades = []

        if periodo == 'week':
            start_date = hoy - timedelta(days=6)
            qs = Consumo.objects.filter(
                domicilio=domicilio,
                fecha__date__gte=start_date,
                fecha__date__lte=hoy
            )
            agregados = (
                qs.annotate(dia=TruncDay('fecha'))
                  .values('dia', 'fuente')
                  .annotate(total=Sum('energia_consumida'))
            )
            mapa = {}
            for row in agregados:
                dia = row['dia'].date()
                fuente = row['fuente']
                total = float(row['total'] or 0)
                if dia not in mapa:
                    mapa[dia] = {'solar': 0.0, 'electrica': 0.0}
                if fuente in ('solar', 'electrica'):
                    mapa[dia][fuente] += total

            for i in range(6, -1, -1):
                fecha = hoy - timedelta(days=i)
                solar = mapa.get(fecha, {}).get('solar', 0.0)
                electrica = mapa.get(fecha, {}).get('electrica', 0.0)
                actividades.append({
                    'mes': fecha.strftime('%a %d'),
                    'fecha': fecha.isoformat(),
                    'solar': round(solar, 2),
                    'electrica': round(electrica, 2)
                })

        elif periodo == 'month':
            start_date = hoy.replace(day=1)
            ultimo_dia = monthrange(hoy.year, hoy.month)[1]

            qs = Consumo.objects.filter(
                domicilio=domicilio,
                fecha__date__gte=start_date,
                fecha__date__lte=hoy
            )
            agregados = (
                qs.annotate(dia=TruncDay('fecha'))
                .values('dia', 'fuente')
                .annotate(total=Sum('energia_consumida'))
                .order_by('dia')
            )
            mapa = {}
            for row in agregados:
                dia = row['dia'].date()
                fuente = row['fuente']
                total = float(row['total'] or 0)
                if dia not in mapa:
                    mapa[dia] = {'solar': 0.0, 'electrica': 0.0}
                if fuente in ('solar', 'electrica'):
                    mapa[dia][fuente] += total

            for day in range(1, ultimo_dia + 1):
                try:
                    fecha = hoy.replace(day=day)
                except ValueError:
                    continue
                solar = mapa.get(fecha, {}).get('solar', 0.0)
                electrica = mapa.get(fecha, {}).get('electrica', 0.0)
                actividades.append({
                    'mes': fecha.strftime('%a %d'),
                    'fecha': fecha.isoformat(),
                    'solar': round(solar, 2),
                    'electrica': round(electrica, 2),
                    'dia': day
                })

        else:  # year - optimized with single query
            meses_labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            year = hoy.year
            month = hoy.month

            # Single query for 12 months instead of 24 separate queries
            twelve_months_ago = hoy - timedelta(days=365)
            qs = Consumo.objects.filter(
                domicilio=domicilio,
                fecha__date__gte=twelve_months_ago,
                fecha__date__lte=hoy
            ).values(
                'fecha__year', 'fecha__month', 'fuente'
            ).annotate(
                total=Sum('energia_consumida')
            )

            mapa = {}
            for row in qs:
                key = (row['fecha__year'], row['fecha__month'])
                if key not in mapa:
                    mapa[key] = {'solar': 0.0, 'electrica': 0.0}
                fuente = row['fuente']
                if fuente in ('solar', 'electrica'):
                    mapa[key][fuente] = float(row['total'] or 0)

            for _ in range(11, -1, -1):
                key = (year, month)
                solar = mapa.get(key, {}).get('solar', 0.0)
                electrica = mapa.get(key, {}).get('electrica', 0.0)
                actividades.append({
                    'mes': meses_labels[month - 1],
                    'ano': year,
                    'solar': round(solar, 2),
                    'electrica': round(electrica, 2)
                })
                month -= 1
                if month == 0:
                    month = 12
                    year -= 1
            actividades = list(reversed(actividades))

        cache.set(cache_key, actividades, CACHE_TTL_SHORT)

        return JsonResponse({
            'success': True,
            'data': actividades,
            'periodo': periodo
        })
    except Exception as e:
        logger.exception("Error en obtener_actividades_mensuales")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@require_GET
def obtener_estado_bateria(request):
    try:
        domicilio_id = request.GET.get('domicilio_id', 1)

        cache_key = f"bateria_{domicilio_id}"
        cached = cache.get(cache_key)
        if cached is not None:
            return JsonResponse({'success': True, 'data': cached, 'cached': True})

        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
        bateria = Bateria.objects.filter(domicilio=domicilio).order_by('-fecha_registro').first()

        if bateria:
            data = {
                'voltaje': bateria.voltaje,
                'corriente': bateria.corriente,
                'temperatura': bateria.temperatura,
                'capacidad': bateria.capacidad_bateria,
                'porcentaje_carga': bateria.porcentaje_carga,
                'tiempo_restante': bateria.tiempo_restante,
                'fecha': bateria.fecha_registro.isoformat()
            }
        else:
            data = None

        cache.set(cache_key, data, CACHE_TTL_SHORT)

        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        logger.exception("Error en obtener_estado_bateria")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@require_GET
def obtener_logros(request):
    try:
        domicilio_id = request.GET.get("domicilio_id")

        if not domicilio_id:
            return JsonResponse(
                {"success": False, "error": "domicilio_id es requerido"},
                status=400,
            )

        cache_key = f"logros_{domicilio_id}"
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({"success": True, "data": cached, "cached": True})

        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
        logros = construir_logros_para_domicilio(domicilio)

        cache.set(cache_key, logros, CACHE_TTL_MEDIUM)

        return JsonResponse({"success": True, "data": logros})
    except Domicilio.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Domicilio no encontrado"},
            status=404,
        )
    except Exception as e:
        logger.exception("Error en obtener_logros")
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@require_GET
def nivel_usuario(request):
    domicilio_id = request.GET.get("domicilio_id")
    if not domicilio_id:
        return JsonResponse({"error": "Falta domicilio_id"}, status=400)
    puntaje = Puntaje.objects.filter(domicilio__iddomicilio=domicilio_id).order_by('-puntos').first()
    if not puntaje:
        return JsonResponse({"error": "No hay puntaje"}, status=404)
    return JsonResponse({
        "nivel": puntaje.nivel,
        "puntos": puntaje.puntos,
        "ultima_actualizacion": puntaje.ultima_actualizacion.strftime("%Y-%m-%d %H:%M"),
    })
