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
        periodo = request.GET.get('periodo', 'year')  # 'week', 'month', 'year'
        domicilio = Domicilio.objects.get(iddomicilio=domicilio_id)

        # MUY IMPORTANTE: usar la fecha local, no timezone.now() a pelo
        hoy = timezone.localdate()
        actividades = []

        if periodo == 'week':
            # Últimos 7 días (hoy incluido)
            start_date = hoy - timedelta(days=6)

            qs = Consumo.objects.filter(
                domicilio=domicilio,
                fecha__date__gte=start_date,
                fecha__date__lte=hoy
            )

            # Una sola query, agrupamos por día y fuente
            agregados = (
                qs.annotate(dia=TruncDay('fecha'))
                  .values('dia', 'fuente')
                  .annotate(total=Sum('energia_consumida'))
            )

            # Pasamos a un dict: {fecha: {'solar': x, 'electrica': y}}
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

            # Construimos la lista con TODOS los días, aunque tengan 0
            for i in range(6, -1, -1):
                fecha = hoy - timedelta(days=i)
                solar = mapa.get(fecha, {}).get('solar', 0.0)
                electrica = mapa.get(fecha, {}).get('electrica', 0.0)

                actividades.append({
                    'mes': fecha.strftime('%a %d'),  # Ej: "Tue 28"
                    'fecha': fecha.isoformat(),
                    'solar': round(solar, 2),
                    'electrica': round(electrica, 2)
                })

        elif periodo == 'month':
            # Últimas 4 semanas (agrupamos por semana ISO)
            end_date = hoy
            start_date = end_date - timedelta(weeks=4)

            qs = Consumo.objects.filter(
                domicilio=domicilio,
                fecha__date__gte=start_date,
                fecha__date__lte=end_date
            )

            agregados = (
                qs.annotate(semana=TruncWeek('fecha'))  # lunes como inicio de semana
                  .values('semana', 'fuente')
                  .annotate(total=Sum('energia_consumida'))
                  .order_by('semana')
            )

            # {semana_inicio: {'solar': x, 'electrica': y}}
            mapa = {}
            for row in agregados:
                semana_inicio = row['semana'].date()
                fuente = row['fuente']
                total = float(row['total'] or 0)
                if semana_inicio not in mapa:
                    mapa[semana_inicio] = {'solar': 0.0, 'electrica': 0.0}
                if fuente == 'solar':
                    mapa[semana_inicio]['solar'] += total
                elif fuente == 'electrica':
                    mapa[semana_inicio]['electrica'] += total

            semanas_ordenadas = sorted(mapa.keys())
            # Nos quedamos con las últimas 4 semanas (por si hay más)
            semanas_ordenadas = semanas_ordenadas[-4:]

            for idx, semana_inicio in enumerate(semanas_ordenadas, start=1):
                semana_fin = semana_inicio + timedelta(days=6)
                # Limitamos semana_fin para no pasar de hoy
                if semana_fin > end_date:
                    semana_fin = end_date

                solar = mapa[semana_inicio]['solar']
                electrica = mapa[semana_inicio]['electrica']

                actividades.append({
                    'mes': f'Sem {idx}',
                    'fecha_inicio': semana_inicio.isoformat(),
                    'fecha_fin': semana_fin.isoformat(),
                    'solar': round(solar, 2),
                    'electrica': round(electrica, 2)
                })

        else:  # year
            # Últimos 12 meses (mantengo tu lógica, solo más clara)
            meses_labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

            # Empezamos 11 meses atrás hasta el mes actual
            year = hoy.year
            month = hoy.month

            for _ in range(11, -1, -1):
                # mes/year actuales
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

                # retrocedemos un mes
                month -= 1
                if month == 0:
                    month = 12
                    year -= 1

            # ahora están de más antiguo a más nuevo; si los quieres al revés, haz:
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
        
        # Get latest battery data
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
    