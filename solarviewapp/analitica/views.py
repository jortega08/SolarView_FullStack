from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Sum, Avg, Count
from django.utils import timezone
from datetime import timedelta
from .models import Puntaje, Recomendacion
from core.models import Domicilio
from telemetria.models import Consumo, Bateria
import json
import traceback
from django.db.models import Sum
from django.db.models.functions import TruncDay, TruncWeek
from django.utils import timezone
from datetime import timedelta
from .gamificacion import construir_logros_para_domicilio


@csrf_exempt
@require_http_methods(["GET"])
def obtener_estadisticas(request):
    try:
        domicilio_id = request.GET.get('domicilio_id', 1)
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
        
        # Get puntaje
        puntaje = Puntaje.objects.filter(domicilio=domicilio).first()
        
        # Calculate statistics
        hoy = timezone.now().date()
        inicio_mes = hoy - timedelta(days=30)
        
        # Total projects (consumos registrados)
        total_registros = Consumo.objects.filter(domicilio=domicilio).count()
        
        # Completed tasks (días con datos completos)
        dias_completos = Consumo.objects.filter(
            domicilio=domicilio,
            fecha__date__gte=inicio_mes
        ).values('fecha__date').distinct().count()
        
        # Earnings (ahorro por uso solar)
        ahorro_solar = Consumo.objects.filter(
            domicilio=domicilio,
            fuente='solar',
            fecha__date__gte=inicio_mes
        ).aggregate(total=Sum('costo'))['total'] or 0
        
        return JsonResponse({
            'success': True,
            'data': {
                'open_projects': total_registros,
                'completed_tasks': dias_completos,
                'earnings': round(ahorro_solar, 2),
                'puntos': puntaje.puntos if puntaje else 0,
                'nivel': puntaje.nivel if puntaje else 'basico'
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def obtener_actividades_mensuales(request):
    try:
        domicilio_id = request.GET.get('domicilio_id', 1)
        periodo = request.GET.get('periodo', 'year')
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)

        hoy = timezone.localdate()
        actividades = []

        if periodo == 'week':
            # Últimos 7 días
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
                if fuente == 'solar':
                    mapa[dia]['solar'] += total
                elif fuente == 'electrica':
                    mapa[dia]['electrica'] += total
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
            # Consumos diarios del mes actual (desde el día 1 hasta hoy)
            from calendar import monthrange
            start_date = hoy.replace(day=1)
            end_date = hoy
            ultimo_dia = monthrange(hoy.year, hoy.month)[1]

            qs = Consumo.objects.filter(
                domicilio=domicilio,
                fecha__date__gte=start_date,
                fecha__date__lte=end_date
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
                if fuente == 'solar':
                    mapa[dia]['solar'] += total
                elif fuente == 'electrica':
                    mapa[dia]['electrica'] += total

            actividades = []
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

        else:  # year
            meses_labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            year = hoy.year
            month = hoy.month
            for _ in range(11, -1, -1):
                mes = month
                año = year
                solar = Consumo.objects.filter(
                    domicilio=domicilio,
                    fuente='solar',
                    fecha__year=año,
                    fecha__month=mes
                ).aggregate(total=Sum('energia_consumida'))['total'] or 0
                electrica = Consumo.objects.filter(
                    domicilio=domicilio,
                    fuente='electrica',
                    fecha__year=año,
                    fecha__month=mes
                ).aggregate(total=Sum('energia_consumida'))['total'] or 0
                actividades.append({
                    'mes': meses_labels[mes - 1],
                    'año': año,
                    'solar': round(solar, 2),
                    'electrica': round(electrica, 2)
                })
                month -= 1
                if month == 0:
                    month = 12
                    year -= 1
            actividades = list(reversed(actividades))

        return JsonResponse({
            'success': True,
            'data': actividades,
            'periodo': periodo
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def obtener_tareas_recientes(request):
    try:
        domicilio_id = request.GET.get('domicilio_id', 1)
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)
        
        # Get recent consumos as "tasks"
        consumos_recientes = Consumo.objects.filter(
            domicilio=domicilio
        ).order_by('-fecha')[:10]
        
        tareas = []
        for consumo in consumos_recientes:
            tareas.append({
                'id': consumo.idconsumo,
                'department': 'Energy',
                'stage': 'Monitoring',
                'assigned': domicilio.usuario.nombre,
                'team': consumo.fuente.capitalize(),
                'date': consumo.fecha.strftime('%Y-%m-%d'),
                'status': 'done' if consumo.fuente == 'solar' else 'pending',
                'energia': consumo.energia_consumida,
                'costo': consumo.costo
            })
        
        return JsonResponse({
            'success': True,
            'data': tareas
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def obtener_estado_bateria(request):
    try:
        domicilio_id = request.GET.get('domicilio_id', 1)
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)

        bateria = Bateria.objects.filter(domicilio=domicilio).order_by('-fecha_registro').first()

        if bateria:
            return JsonResponse({
                'success': True,
                'data': {
                    'voltaje': bateria.voltaje,
                    'corriente': bateria.corriente,
                    'temperatura': bateria.temperatura,
                    'capacidad': bateria.capacidad_bateria,
                    'porcentaje_carga': bateria.porcentaje_carga,
                    'tiempo_restante': bateria.tiempo_restante,
                    'fecha': bateria.fecha_registro.isoformat()
                }
            })
        else:
            return JsonResponse({
                'success': True,
                'data': None
            })
    except Exception as e:
        # Esto lo verás en tu terminal/aplicación para saber la razón exacta
        print("Error bateria API:", str(e))
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
@csrf_exempt
@require_http_methods(["GET"])
def obtener_logros(request):
  try:
    domicilio_id = request.GET.get("domicilio_id")

    if not domicilio_id:
      return JsonResponse(
          {"success": False, "error": "domicilio_id es requerido"},
          status=400,
      )

    domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)

    logros = construir_logros_para_domicilio(domicilio)

    return JsonResponse(
        {
            "success": True,
            "data": logros,
        }
    )
  except Domicilio.DoesNotExist:
    return JsonResponse(
        {"success": False, "error": "Domicilio no encontrado"},
        status=404,
    )
  except Exception as e:
    return JsonResponse(
        {"success": False, "error": str(e)},
        status=500,
    )
  
@csrf_exempt
@require_http_methods(["GET"])
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
    