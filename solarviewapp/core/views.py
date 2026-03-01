from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Pais, Estado, Ciudad, Usuario, Domicilio
from .serializers import (
    PaisSerializer,
    EstadoSerializer,
    CiudadSerializer,
    UsuarioSerializer,
    UsuarioCreateSerializer,
    DomicilioSerializer,
)


class PaisViewSet(viewsets.ModelViewSet):
    queryset = Pais.objects.all()
    serializer_class = PaisSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.select_related('pais').all()
    serializer_class = EstadoSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['pais']

    def get_queryset(self):
        qs = super().get_queryset()
        pais_id = self.request.query_params.get('pais_id')
        if pais_id:
            qs = qs.filter(pais_id=pais_id)
        return qs


class CiudadViewSet(viewsets.ModelViewSet):
    queryset = Ciudad.objects.select_related('estado').all()
    serializer_class = CiudadSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado']

    def get_queryset(self):
        qs = super().get_queryset()
        estado_id = self.request.query_params.get('estado_id')
        if estado_id:
            qs = qs.filter(estado_id=estado_id)
        return qs


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    permission_classes = [AllowAny]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = UsuarioSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DomicilioViewSet(viewsets.ModelViewSet):
    queryset = Domicilio.objects.select_related('usuario', 'ciudad').all()
    serializer_class = DomicilioSerializer
    permission_classes = [AllowAny]
    pagination_class = None
