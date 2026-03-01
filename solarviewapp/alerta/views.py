from django.http import JsonResponse
from django.views.decorators.http import require_GET
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from .models import Alerta, TipoAlerta
from .serializers import AlertaSerializer, TipoAlertaSerializer


class AlertaViewSet(viewsets.ModelViewSet):
    queryset = Alerta.objects.select_related('tipoalerta', 'domicilio').all()
    serializer_class = AlertaSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'domicilio', 'tipoalerta']


class TipoAlertaViewSet(viewsets.ModelViewSet):
    queryset = TipoAlerta.objects.all()
    serializer_class = TipoAlertaSerializer
    permission_classes = [AllowAny]
    pagination_class = None


@require_GET
def ultimas_alertas(request):
    domicilio_id = request.GET.get("domicilio_id")
    queryset = (
        Alerta.objects
        .select_related('domicilio__ciudad__estado__pais', 'domicilio__usuario', 'tipoalerta')
    )
    if domicilio_id:
        queryset = queryset.filter(domicilio__iddomicilio=domicilio_id)
    alertas = queryset.order_by('-fecha')[:10]

    data = [
        {
            "id": alerta.idalerta,
            "estado": alerta.estado,
            "mensaje": alerta.mensaje,
            "fecha": alerta.fecha.strftime("%Y-%m-%d %H:%M"),
            "domicilio": str(alerta.domicilio),
            "usuario": alerta.domicilio.usuario.nombre,
            "ciudad": alerta.domicilio.ciudad.nombre,
            "tipo": (alerta.tipoalerta.nombre if alerta.tipoalerta else "Sin tipo"),
            "tipo_desc": (alerta.tipoalerta.descripcion if alerta.tipoalerta else ""),
        }
        for alerta in alertas
    ]
    return JsonResponse(data, safe=False)