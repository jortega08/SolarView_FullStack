import csv
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Count, OuterRef, Q, Subquery, Sum
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from alerta.models import Alerta
from core.models import Instalacion
from telemetria.models import Bateria, Consumo

from .permissions import check_instalacion_access, get_instalaciones_for_user, get_user_from_request


def _calcular_riesgo(alertas_criticas, alertas_medias, bateria_pct):
    if (alertas_criticas or 0) > 0:
        return 'alto'
    if (alertas_medias or 0) > 0 or (bateria_pct is not None and bateria_pct < 20):
        return 'medio'
    return 'bajo'


def _autonomia_horas(instalacion):
    bateria = Bateria.objects.filter(instalacion=instalacion).order_by('-fecha_registro').first()
    if not bateria:
        return None

    desde = timezone.now() - timedelta(hours=24)
    total_24h = (
        Consumo.objects
        .filter(instalacion=instalacion, fecha__gte=desde)
        .aggregate(total=Sum('energia_consumida'))
        .get('total') or 0
    )
    promedio_hora = total_24h / 24 if total_24h else 0
    if promedio_hora <= 0:
        return None

    energia_disponible = bateria.capacidad_bateria * (bateria.porcentaje_carga / 100)
    return round(float(energia_disponible / promedio_hora), 2)


@api_view(['GET'])
@permission_classes([AllowAny])
def panel_empresa(request):
    usuario = get_user_from_request(request)
    cache_key = f'panel_{usuario.idusuario}'
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)

    roles = get_instalaciones_for_user(usuario)
    instalaciones_ids = list(roles.values_list('instalacion_id', flat=True).distinct())

    if not instalaciones_ids:
        data = {'empresa': None, 'instalaciones': [], 'resumen': {'total': 0, 'con_alerta_critica': 0, 'en_mantenimiento': 0}}
        cache.set(cache_key, data, 30)
        return JsonResponse(data)

    empresa_id = request.GET.get('empresa_id')
    base_qs = Instalacion.objects.filter(idinstalacion__in=instalaciones_ids)
    if empresa_id:
        base_qs = base_qs.filter(empresa_id=empresa_id)

    referencia = base_qs.select_related('empresa').first()
    if not referencia:
        return JsonResponse({'empresa': None, 'instalaciones': [], 'resumen': {'total': 0, 'con_alerta_critica': 0, 'en_mantenimiento': 0}})

    latest_battery = Bateria.objects.filter(instalacion_id=OuterRef('pk')).order_by('-fecha_registro')
    instalaciones = (
        base_qs.filter(empresa=referencia.empresa)
        .select_related('empresa')
        .annotate(
            bateria_pct=Subquery(latest_battery.values('porcentaje_carga')[:1]),
            ultimo_registro=Subquery(latest_battery.values('fecha_registro')[:1]),
            alertas_criticas=Count(
                'alertas',
                filter=Q(alertas__estado='activa', alertas__severidad__in=['critica', 'alta']),
                distinct=True,
            ),
            alertas_medias=Count(
                'alertas',
                filter=Q(alertas__estado='activa', alertas__severidad='media'),
                distinct=True,
            ),
        )
        .order_by('nombre')
    )

    instalaciones_data = []
    con_alerta_critica = 0
    en_mantenimiento = 0

    for instalacion in instalaciones:
        riesgo = _calcular_riesgo(instalacion.alertas_criticas, instalacion.alertas_medias, instalacion.bateria_pct)
        if instalacion.alertas_criticas:
            con_alerta_critica += 1
        if instalacion.estado == 'mantenimiento':
            en_mantenimiento += 1

        instalaciones_data.append({
            'id': instalacion.idinstalacion,
            'nombre': instalacion.nombre,
            'estado': instalacion.estado,
            'bateria_pct': round(float(instalacion.bateria_pct), 2) if instalacion.bateria_pct is not None else None,
            'alertas_criticas': instalacion.alertas_criticas,
            'riesgo': riesgo,
            'ultimo_registro': instalacion.ultimo_registro.isoformat() if instalacion.ultimo_registro else None,
        })

    data = {
        'empresa': {
            'id': referencia.empresa.idempresa,
            'nombre': referencia.empresa.nombre,
        },
        'instalaciones': instalaciones_data,
        'resumen': {
            'total': len(instalaciones_data),
            'con_alerta_critica': con_alerta_critica,
            'en_mantenimiento': en_mantenimiento,
        },
    }
    cache.set(cache_key, data, 30)
    return JsonResponse(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_instalaciones(request):
    usuario = get_user_from_request(request)
    roles = get_instalaciones_for_user(usuario)
    instalaciones_ids = list(roles.values_list('instalacion_id', flat=True).distinct())

    instalaciones = (
        Instalacion.objects
        .filter(idinstalacion__in=instalaciones_ids)
        .select_related('empresa', 'ciudad')
        .order_by('empresa__nombre', 'nombre')
    )

    return JsonResponse({
        'success': True,
        'results': [
            {
                'id': instalacion.idinstalacion,
                'nombre': instalacion.nombre,
                'empresa': instalacion.empresa.nombre,
                'ciudad': instalacion.ciudad.nombre if instalacion.ciudad else None,
                'estado': instalacion.estado,
                'tipo_sistema': instalacion.tipo_sistema,
            }
            for instalacion in instalaciones
        ],
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def detalle_instalacion(request, pk):
    usuario = get_user_from_request(request)
    if not check_instalacion_access(usuario, pk):
        return JsonResponse({'success': False, 'error': 'Sin acceso a la instalacion'}, status=403)

    cache_key = f'instalacion_detail_{pk}'
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)

    instalacion = Instalacion.objects.select_related('empresa', 'ciudad').get(idinstalacion=pk)
    bateria = Bateria.objects.filter(instalacion=instalacion).order_by('-fecha_registro').first()
    hoy = timezone.localdate()

    consumo_hoy = Consumo.objects.filter(instalacion=instalacion, fecha__date=hoy)
    consumo_solar = consumo_hoy.filter(fuente='solar').aggregate(total=Sum('energia_consumida')).get('total') or 0
    consumo_electrica = consumo_hoy.filter(fuente='electrica').aggregate(total=Sum('energia_consumida')).get('total') or 0
    costo_total = consumo_hoy.aggregate(total=Sum('costo')).get('total') or 0
    alertas = (
        Alerta.objects
        .filter(instalacion=instalacion, estado='activa')
        .select_related('tipoalerta', 'resuelta_por')
        .order_by('-fecha')[:20]
    )

    data = {
        'instalacion': {
            'id': instalacion.idinstalacion,
            'empresa': instalacion.empresa.nombre,
            'nombre': instalacion.nombre,
            'direccion': instalacion.direccion,
            'ciudad': instalacion.ciudad.nombre if instalacion.ciudad else None,
            'tipo_sistema': instalacion.tipo_sistema,
            'capacidad_panel_kw': instalacion.capacidad_panel_kw,
            'capacidad_bateria_kwh': instalacion.capacidad_bateria_kwh,
            'estado': instalacion.estado,
            'fecha_instalacion': instalacion.fecha_instalacion.isoformat() if instalacion.fecha_instalacion else None,
        },
        'bateria': (
            {
                'voltaje': bateria.voltaje,
                'corriente': bateria.corriente,
                'temperatura': bateria.temperatura,
                'capacidad_bateria': bateria.capacidad_bateria,
                'porcentaje_carga': bateria.porcentaje_carga,
                'tiempo_restante': bateria.tiempo_restante,
                'fecha_registro': bateria.fecha_registro.isoformat(),
            }
            if bateria else None
        ),
        'consumo_hoy': {
            'solar': round(float(consumo_solar), 2),
            'electrica': round(float(consumo_electrica), 2),
            'costo': round(float(costo_total), 2),
        },
        'alertas_activas': [
            {
                'id': alerta.idalerta,
                'mensaje': alerta.mensaje,
                'severidad': alerta.severidad,
                'causa_probable': alerta.causa_probable,
                'accion_sugerida': alerta.accion_sugerida,
                'fecha': alerta.fecha.isoformat(),
                'tipo': alerta.tipoalerta.nombre if alerta.tipoalerta else None,
            }
            for alerta in alertas
        ],
        'autonomia_estimada_horas': _autonomia_horas(instalacion),
    }

    cache.set(cache_key, data, 30)
    return JsonResponse(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def reporte_consumo_csv(request):
    usuario = get_user_from_request(request)
    instalacion_id = request.GET.get('instalacion_id')
    dias = int(request.GET.get('dias', 30))

    if not instalacion_id:
        return JsonResponse({'success': False, 'error': 'instalacion_id es requerido'}, status=400)
    if not check_instalacion_access(usuario, int(instalacion_id)):
        return JsonResponse({'success': False, 'error': 'Sin acceso'}, status=403)

    instalacion = Instalacion.objects.select_related('empresa').get(idinstalacion=instalacion_id)
    desde = timezone.now() - timedelta(days=dias)
    consumos = (
        Consumo.objects
        .filter(instalacion=instalacion, fecha__gte=desde)
        .order_by('-fecha')
        .values('fecha', 'fuente', 'energia_consumida', 'potencia', 'costo')
    )

    nombre_archivo = f"consumo_{instalacion.nombre.replace(' ', '_')}_{dias}d.csv"
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
    response.write('\ufeff')  # BOM para Excel

    writer = csv.writer(response)
    writer.writerow(['Fecha', 'Fuente', 'Energia_kWh', 'Potencia_kW', 'Costo_COP'])
    for c in consumos:
        writer.writerow([
            c['fecha'].strftime('%Y-%m-%d %H:%M'),
            c['fuente'],
            c['energia_consumida'],
            c['potencia'],
            c['costo'],
        ])
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def reporte_alertas_csv(request):
    usuario = get_user_from_request(request)
    instalacion_id = request.GET.get('instalacion_id')
    dias = int(request.GET.get('dias', 30))

    if not instalacion_id:
        return JsonResponse({'success': False, 'error': 'instalacion_id es requerido'}, status=400)
    if not check_instalacion_access(usuario, int(instalacion_id)):
        return JsonResponse({'success': False, 'error': 'Sin acceso'}, status=403)

    instalacion = Instalacion.objects.select_related('empresa').get(idinstalacion=instalacion_id)
    desde = timezone.now() - timedelta(days=dias)
    alertas = (
        Alerta.objects
        .filter(instalacion=instalacion, fecha__gte=desde)
        .select_related('tipoalerta', 'resuelta_por')
        .order_by('-fecha')
        .values('fecha', 'severidad', 'estado', 'mensaje', 'causa_probable', 'accion_sugerida', 'resuelta_por__nombre')
    )

    nombre_archivo = f"alertas_{instalacion.nombre.replace(' ', '_')}_{dias}d.csv"
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
    response.write('\ufeff')

    writer = csv.writer(response)
    writer.writerow(['Fecha', 'Severidad', 'Estado', 'Mensaje', 'Causa_probable', 'Accion_sugerida', 'Resuelta_por'])
    for a in alertas:
        writer.writerow([
            a['fecha'].strftime('%Y-%m-%d %H:%M'),
            a['severidad'],
            a['estado'],
            a['mensaje'],
            a['causa_probable'] or '',
            a['accion_sugerida'] or '',
            a['resuelta_por__nombre'] or '',
        ])
    return response
