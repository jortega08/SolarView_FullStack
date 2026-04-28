import logging
from calendar import monthrange
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Avg, Case, Count, FloatField, Sum, When
from django.db.models.functions import TruncDay
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from alerta.models import Alerta
from core.models import Domicilio, Empresa, Instalacion
from core.permissions import IsActiveUser
from telemetria.models import Bateria, Consumo

logger = logging.getLogger('soleim')

CACHE_TTL_SHORT = 30
CACHE_TTL_MEDIUM = 300


def _resolve_context(request):
    domicilio_id = request.GET.get('domicilio_id')
    instalacion_id = request.GET.get('instalacion_id')

    domicilio = Domicilio.objects.filter(iddomicilio=domicilio_id).first() if domicilio_id else None
    instalacion = Instalacion.objects.filter(idinstalacion=instalacion_id).first() if instalacion_id else None
    return domicilio, instalacion


def _build_filters(domicilio=None, instalacion=None):
    if instalacion is not None:
        return {'instalacion': instalacion}
    if domicilio is not None:
        return {'domicilio': domicilio}
    return {}


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def obtener_actividades_mensuales(request):
    try:
        domicilio, instalacion = _resolve_context(request)
        periodo = request.GET.get('periodo', 'year')
        context_key = instalacion.idinstalacion if instalacion else (domicilio.iddomicilio if domicilio else 1)
        filtros = _build_filters(domicilio=domicilio, instalacion=instalacion)

        cache_key = f'actividades_{context_key}_{periodo}'
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({'success': True, 'data': cached, 'periodo': periodo, 'cached': True})

        hoy = timezone.localdate()
        actividades = []

        if periodo == 'week':
            start_date = hoy - timedelta(days=6)
            qs = Consumo.objects.filter(
                **filtros,
                fecha__date__gte=start_date,
                fecha__date__lte=hoy,
            )
            agregados = (
                qs.annotate(dia=TruncDay('fecha'))
                .values('dia', 'fuente')
                .annotate(total=Sum('energia_consumida'))
            )
            mapa = {}
            for row in agregados:
                dia = row['dia'].date()
                mapa.setdefault(dia, {'solar': 0.0, 'electrica': 0.0})
                if row['fuente'] in ('solar', 'electrica'):
                    mapa[dia][row['fuente']] += float(row['total'] or 0)

            for i in range(6, -1, -1):
                fecha = hoy - timedelta(days=i)
                actividades.append({
                    'mes': fecha.strftime('%a %d'),
                    'fecha': fecha.isoformat(),
                    'solar': round(mapa.get(fecha, {}).get('solar', 0.0), 2),
                    'electrica': round(mapa.get(fecha, {}).get('electrica', 0.0), 2),
                })

        elif periodo == 'month':
            start_date = hoy.replace(day=1)
            ultimo_dia = monthrange(hoy.year, hoy.month)[1]
            qs = Consumo.objects.filter(
                **filtros,
                fecha__date__gte=start_date,
                fecha__date__lte=hoy,
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
                mapa.setdefault(dia, {'solar': 0.0, 'electrica': 0.0})
                if row['fuente'] in ('solar', 'electrica'):
                    mapa[dia][row['fuente']] += float(row['total'] or 0)

            for day in range(1, ultimo_dia + 1):
                fecha = hoy.replace(day=day)
                actividades.append({
                    'mes': fecha.strftime('%a %d'),
                    'fecha': fecha.isoformat(),
                    'solar': round(mapa.get(fecha, {}).get('solar', 0.0), 2),
                    'electrica': round(mapa.get(fecha, {}).get('electrica', 0.0), 2),
                    'dia': day,
                })

        else:
            meses_labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            year = hoy.year
            month = hoy.month
            twelve_months_ago = hoy - timedelta(days=365)
            qs = (
                Consumo.objects
                .filter(**filtros, fecha__date__gte=twelve_months_ago, fecha__date__lte=hoy)
                .values('fecha__year', 'fecha__month', 'fuente')
                .annotate(total=Sum('energia_consumida'))
            )
            mapa = {}
            for row in qs:
                key = (row['fecha__year'], row['fecha__month'])
                mapa.setdefault(key, {'solar': 0.0, 'electrica': 0.0})
                if row['fuente'] in ('solar', 'electrica'):
                    mapa[key][row['fuente']] = float(row['total'] or 0)

            for _ in range(11, -1, -1):
                key = (year, month)
                actividades.append({
                    'mes': meses_labels[month - 1],
                    'ano': year,
                    'solar': round(mapa.get(key, {}).get('solar', 0.0), 2),
                    'electrica': round(mapa.get(key, {}).get('electrica', 0.0), 2),
                })
                month -= 1
                if month == 0:
                    month = 12
                    year -= 1
            actividades = list(reversed(actividades))

        cache.set(cache_key, actividades, CACHE_TTL_SHORT)
        return JsonResponse({'success': True, 'data': actividades, 'periodo': periodo})
    except Exception as e:
        logger.exception('Error en obtener_actividades_mensuales')
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def obtener_estado_bateria(request):
    try:
        domicilio, instalacion = _resolve_context(request)
        context_key = instalacion.idinstalacion if instalacion else (domicilio.iddomicilio if domicilio else 1)
        filtros = _build_filters(domicilio=domicilio, instalacion=instalacion)

        cache_key = f'bateria_{context_key}'
        cached = cache.get(cache_key)
        if cached is not None:
            return JsonResponse({'success': True, 'data': cached, 'cached': True})

        bateria = Bateria.objects.filter(**filtros).order_by('-fecha_registro').first()
        if bateria:
            data = {
                'voltaje': bateria.voltaje,
                'corriente': bateria.corriente,
                'temperatura': bateria.temperatura,
                'capacidad': bateria.capacidad_bateria,
                'porcentaje_carga': bateria.porcentaje_carga,
                'tiempo_restante': bateria.tiempo_restante,
                'fecha': bateria.fecha_registro.isoformat(),
            }
        else:
            data = None

        cache.set(cache_key, data, CACHE_TTL_SHORT)
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        logger.exception('Error en obtener_estado_bateria')
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def autonomia_instalacion(request):
    try:
        instalacion_id = request.GET.get('instalacion_id')
        if not instalacion_id:
            return JsonResponse({'success': False, 'error': 'instalacion_id es requerido'}, status=400)

        cache_key = f'autonomia_{instalacion_id}'
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({'success': True, 'data': cached, 'cached': True})

        instalacion = Instalacion.objects.get(idinstalacion=instalacion_id)
        bateria = Bateria.objects.filter(instalacion=instalacion).order_by('-fecha_registro').first()
        if not bateria:
            data = {'autonomia_horas': None}
        else:
            desde = timezone.now() - timedelta(hours=24)
            total_24h = (
                Consumo.objects
                .filter(instalacion=instalacion, fecha__gte=desde)
                .aggregate(total=Sum('energia_consumida'))
                .get('total') or 0
            )
            promedio_hora = total_24h / 24 if total_24h else 0
            if promedio_hora <= 0:
                data = {'autonomia_horas': None}
            else:
                autonomia_horas = (bateria.capacidad_bateria * (bateria.porcentaje_carga / 100)) / promedio_hora
                data = {'autonomia_horas': round(float(autonomia_horas), 2)}

        cache.set(cache_key, data, CACHE_TTL_SHORT)
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        logger.exception('Error en autonomia_instalacion')
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def tendencia_instalacion(request):
    try:
        instalacion_id = request.GET.get('instalacion_id')
        dias = int(request.GET.get('dias', 7))
        if not instalacion_id:
            return JsonResponse({'success': False, 'error': 'instalacion_id es requerido'}, status=400)

        cache_key = f'tendencia_{instalacion_id}_{dias}'
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({'success': True, 'data': cached, 'cached': True})

        instalacion = Instalacion.objects.get(idinstalacion=instalacion_id)
        hoy = timezone.localdate()
        inicio = hoy - timedelta(days=max(dias - 1, 0))

        consumos = (
            Consumo.objects
            .filter(instalacion=instalacion, fecha__date__gte=inicio, fecha__date__lte=hoy)
            .annotate(dia=TruncDay('fecha'))
            .values('dia', 'fuente')
            .annotate(total=Sum('energia_consumida'))
            .order_by('dia')
        )
        baterias = (
            Bateria.objects
            .filter(instalacion=instalacion, fecha_registro__date__gte=inicio, fecha_registro__date__lte=hoy)
            .annotate(dia=TruncDay('fecha_registro'))
            .values('dia')
            .annotate(bateria_avg=Avg('porcentaje_carga'))
            .order_by('dia')
        )

        mapa = {}
        for row in consumos:
            dia = row['dia'].date()
            mapa.setdefault(dia, {'solar': 0.0, 'electrica': 0.0, 'bateria_avg': None})
            mapa[dia][row['fuente']] = round(float(row['total'] or 0), 2)
        for row in baterias:
            dia = row['dia'].date()
            mapa.setdefault(dia, {'solar': 0.0, 'electrica': 0.0, 'bateria_avg': None})
            mapa[dia]['bateria_avg'] = round(float(row['bateria_avg'] or 0), 2)

        data = []
        for i in range(dias):
            fecha = inicio + timedelta(days=i)
            datos = mapa.get(fecha, {'solar': 0.0, 'electrica': 0.0, 'bateria_avg': None})
            data.append({
                'fecha': fecha.isoformat(),
                'solar': datos['solar'],
                'electrica': datos['electrica'],
                'bateria_avg': datos['bateria_avg'],
            })

        cache.set(cache_key, data, CACHE_TTL_MEDIUM)
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        logger.exception('Error en tendencia_instalacion')
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def comparativa_empresa(request):
    """
    Comparativa de consumo por instalación para los últimos 30 días.

    P2 — Reescrito para eliminar el N+1 original (4 queries por instalación).
    Ahora usa exactamente 3 queries sin importar cuántas instalaciones tenga la empresa:
      1. Instalaciones de la empresa  (1 query)
      2. Agregados de consumo  (1 query, GROUP BY instalacion_id)
      3. Conteo de alertas activas  (1 query, GROUP BY instalacion_id)
    """
    try:
        empresa_id = request.GET.get('empresa_id')
        if not empresa_id:
            return JsonResponse({'success': False, 'error': 'empresa_id es requerido'}, status=400)

        cache_key = f'comparativa_{empresa_id}'
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({'success': True, 'data': cached, 'cached': True})

        empresa = Empresa.objects.get(idempresa=empresa_id)
        desde = timezone.now() - timedelta(days=30)

        # --- Query 1: installations (already ordered) ----
        instalaciones = list(empresa.instalaciones.order_by('nombre'))
        if not instalaciones:
            cache.set(cache_key, [], CACHE_TTL_MEDIUM)
            return JsonResponse({'success': True, 'data': []})

        inst_ids = [i.idinstalacion for i in instalaciones]

        # --- Query 2: consumo aggregates (1 query, GROUP BY instalacion_id) ---
        consumo_stats = (
            Consumo.objects
            .filter(instalacion_id__in=inst_ids, fecha__gte=desde)
            .values('instalacion_id')
            .annotate(
                solar=Sum(
                    Case(
                        When(fuente='solar', then='energia_consumida'),
                        default=0,
                        output_field=FloatField(),
                    )
                ),
                total=Sum('energia_consumida'),
                costo_total=Sum('costo'),
            )
        )
        consumo_map = {r['instalacion_id']: r for r in consumo_stats}

        # --- Query 3: active alert counts (1 query, GROUP BY instalacion_id) ---
        alerta_map = {
            r['instalacion_id']: r['count']
            for r in (
                Alerta.objects
                .filter(instalacion_id__in=inst_ids, estado='activa', fecha__gte=desde)
                .values('instalacion_id')
                .annotate(count=Count('idalerta'))
            )
        }

        data = []
        for instalacion in instalaciones:
            stats = consumo_map.get(instalacion.idinstalacion, {})
            solar = float(stats.get('solar') or 0)
            total = float(stats.get('total') or 0)
            costo_total = float(stats.get('costo_total') or 0)
            alertas_activas = alerta_map.get(instalacion.idinstalacion, 0)

            data.append({
                'instalacion_id': instalacion.idinstalacion,
                'instalacion_nombre': instalacion.nombre,
                'solar_ratio': round(solar / total, 4) if total else 0,
                'costo_total': round(costo_total, 2),
                'alertas_activas': alertas_activas,
            })

        cache.set(cache_key, data, CACHE_TTL_MEDIUM)
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        logger.exception('Error en comparativa_empresa')
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
