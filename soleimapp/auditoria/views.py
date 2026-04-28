from django.core.paginator import Paginator
from django.http import JsonResponse
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsActiveUser

from .models import EventoAuditoria


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def listar_eventos_auditoria(request):
    """
    Lista los eventos de auditoría con paginación y filtros opcionales.

    Reglas de visibilidad:
    - admin global → ve todos los eventos.
    - otros roles → sólo ven sus propios eventos.
      (En P1 se ampliará para que admin_empresa vea todos los eventos de su tenant.)
    """
    user = request.user
    queryset = EventoAuditoria.objects.select_related('usuario').all()

    # Filtrado por tenant
    if user.rol != 'admin':
        queryset = queryset.filter(usuario=user)

    # Filtros opcionales de la query string
    entidad = request.GET.get('entidad')
    accion = request.GET.get('accion')
    desde = request.GET.get('desde')
    hasta = request.GET.get('hasta')
    page = max(1, int(request.GET.get('page', 1)))

    if entidad:
        queryset = queryset.filter(entidad=entidad)
    if accion:
        queryset = queryset.filter(accion=accion)

    if desde:
        fecha_desde = parse_datetime(desde) or parse_date(desde)
        if fecha_desde:
            if hasattr(fecha_desde, 'hour'):
                queryset = queryset.filter(timestamp__gte=fecha_desde)
            else:
                queryset = queryset.filter(timestamp__date__gte=fecha_desde)

    if hasta:
        fecha_hasta = parse_datetime(hasta) or parse_date(hasta)
        if fecha_hasta:
            if hasattr(fecha_hasta, 'hour'):
                queryset = queryset.filter(timestamp__lte=fecha_hasta)
            else:
                queryset = queryset.filter(timestamp__date__lte=fecha_hasta)

    paginator = Paginator(queryset, 50)
    page_obj = paginator.get_page(page)

    return JsonResponse({
        'success': True,
        'count': paginator.count,
        'page': page_obj.number,
        'pages': paginator.num_pages,
        'results': [
            {
                'id': evento.id,
                'usuario_id': evento.usuario_id,
                'usuario_nombre': evento.usuario.nombre if evento.usuario else None,
                'accion': evento.accion,
                'entidad': evento.entidad,
                'entidad_id': evento.entidad_id,
                'detalle': evento.detalle,
                'timestamp': evento.timestamp.isoformat(),
                'ip_address': evento.ip_address,
            }
            for evento in page_obj.object_list
        ],
    })
