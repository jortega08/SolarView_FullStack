from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsActiveUser, IsAdminGlobal

from .models import Ciudad, Domicilio, Empresa, Estado, Instalacion, Pais, Usuario
from .serializers import (
    CiudadSerializer,
    DomicilioSerializer,
    EmpresaSerializer,
    EstadoSerializer,
    InstalacionSerializer,
    PaisSerializer,
    UsuarioCreateSerializer,
    UsuarioSerializer,
)

# Permisos base para todos los ViewSets
_AUTHENTICATED = [IsAuthenticated, IsActiveUser]


class PaisViewSet(viewsets.ModelViewSet):
    queryset = Pais.objects.all()
    serializer_class = PaisSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None


class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.select_related('pais').all()
    serializer_class = EstadoSerializer
    permission_classes = _AUTHENTICATED
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
    permission_classes = _AUTHENTICATED
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
    """
    Los administradores globales ven / gestionan todos los usuarios.
    Un usuario no-admin sólo puede ver y editar su propio perfil.
    """
    permission_classes = _AUTHENTICATED
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'admin':
            return Usuario.objects.all()
        # Un usuario sólo ve su propio registro
        return Usuario.objects.filter(idusuario=user.idusuario)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = UsuarioSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DomicilioViewSet(viewsets.ModelViewSet):
    queryset = Domicilio.objects.select_related('usuario', 'ciudad').all()
    serializer_class = DomicilioSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.rol == 'admin':
            return qs
        # Cada usuario sólo ve sus propios domicilios
        return qs.filter(usuario=user)


class EmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Empresa.objects.select_related('ciudad').all()
    serializer_class = EmpresaSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ciudad']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.rol == 'admin':
            return qs
        empresa_ids = (
            user.roles_instalacion
            .select_related('instalacion__empresa')
            .values_list('instalacion__empresa_id', flat=True)
            .distinct()
        )
        return qs.filter(idempresa__in=empresa_ids)


class InstalacionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Instalacion.objects.select_related('empresa', 'ciudad').all()
    serializer_class = InstalacionSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['empresa', 'ciudad', 'estado', 'tipo_sistema']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.rol == 'admin':
            return qs
        return qs.filter(roles__usuario=user).distinct()
