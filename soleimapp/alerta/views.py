from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from auditoria.utils import registrar_evento
from usuario.utils import decode_jwt_user

from .models import Alerta, TipoAlerta
from .serializers import AlertaSerializer, TipoAlertaSerializer


class AlertaViewSet(viewsets.ModelViewSet):
    queryset = Alerta.objects.select_related(
        'tipoalerta',
        'domicilio__ciudad__estado__pais',
        'domicilio__usuario',
        'instalacion',
        'resuelta_por',
    ).all()
    serializer_class = AlertaSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'domicilio', 'tipoalerta', 'instalacion', 'severidad']

    @action(detail=True, methods=['post'], url_path='resolver')
    def resolver(self, request, pk=None):
        alerta = self.get_object()
        if alerta.estado != 'activa':
            return Response({'error': 'Solo alertas activas'}, status=status.HTTP_400_BAD_REQUEST)

        usuario = decode_jwt_user(request)
        alerta.estado = 'resuelta'
        alerta.resuelta_por = usuario
        alerta.save(update_fields=['estado', 'resuelta_por'])

        registrar_evento(
            usuario=usuario,
            accion='resolver_alerta',
            entidad='Alerta',
            entidad_id=alerta.idalerta,
            detalle={'instalacion_id': alerta.instalacion_id},
            request=request,
        )
        return Response({'success': True})


class TipoAlertaViewSet(viewsets.ModelViewSet):
    queryset = TipoAlerta.objects.all()
    serializer_class = TipoAlertaSerializer
    permission_classes = [AllowAny]
    pagination_class = None


@require_GET
def ultimas_alertas(request):
    domicilio_id = request.GET.get('domicilio_id')
    instalacion_id = request.GET.get('instalacion_id')
    queryset = (
        Alerta.objects
        .select_related('domicilio__ciudad__estado__pais', 'domicilio__usuario', 'tipoalerta', 'instalacion', 'resuelta_por')
    )
    if domicilio_id:
        queryset = queryset.filter(domicilio__iddomicilio=domicilio_id)
    if instalacion_id:
        queryset = queryset.filter(instalacion__idinstalacion=instalacion_id)
    alertas = queryset.order_by('-fecha')[:10]

    data = [
        {
            'id': alerta.idalerta,
            'estado': alerta.estado,
            'mensaje': alerta.mensaje,
            'fecha': alerta.fecha.strftime('%Y-%m-%d %H:%M'),
            'domicilio': str(alerta.domicilio),
            'usuario': alerta.domicilio.usuario.nombre,
            'ciudad': alerta.domicilio.ciudad.nombre,
            'tipo': alerta.tipoalerta.nombre if alerta.tipoalerta else 'Sin tipo',
            'tipo_desc': alerta.tipoalerta.descripcion if alerta.tipoalerta else '',
            'instalacion': alerta.instalacion.nombre if alerta.instalacion else '',
            'severidad': alerta.severidad,
            'causa_probable': alerta.causa_probable,
            'accion_sugerida': alerta.accion_sugerida,
            'resuelta_por': alerta.resuelta_por.nombre if alerta.resuelta_por else '',
        }
        for alerta in alertas
    ]
    return JsonResponse(data, safe=False)
