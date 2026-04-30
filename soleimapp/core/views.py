from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.access import (
    get_user_client_queryset,
    get_user_installation_queryset,
    user_can_access_installation,
    user_has_installation_role,
)
from core.permissions import IsActiveUser

from .models import (
    Ciudad,
    Domicilio,
    Empresa,
    Estado,
    Instalacion,
    Pais,
    PrestadorServicio,
    RolInstalacion,
    Sensor,
    Usuario,
)
from .serializers import (
    CiudadSerializer,
    DomicilioSerializer,
    EmpresaSerializer,
    EstadoSerializer,
    InstalacionSerializer,
    PaisSerializer,
    PrestadorServicioSerializer,
    SensorSerializer,
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
    queryset = Estado.objects.select_related("pais").all()
    serializer_class = EstadoSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["pais"]

    def get_queryset(self):
        qs = super().get_queryset()
        pais_id = self.request.query_params.get("pais_id")
        if pais_id:
            qs = qs.filter(pais_id=pais_id)
        return qs


class CiudadViewSet(viewsets.ModelViewSet):
    queryset = Ciudad.objects.select_related("estado").all()
    serializer_class = CiudadSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["estado"]

    def get_queryset(self):
        qs = super().get_queryset()
        estado_id = self.request.query_params.get("estado_id")
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
        if self.action == "create":
            return UsuarioCreateSerializer
        return UsuarioSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol == "admin":
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
    queryset = Domicilio.objects.select_related("usuario", "ciudad").all()
    serializer_class = DomicilioSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.rol == "admin":
            return qs
        # Cada usuario sólo ve sus propios domicilios
        return qs.filter(usuario=user)


class EmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Empresa.objects.select_related("ciudad").all()
    serializer_class = EmpresaSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ciudad"]

    def get_queryset(self):
        user = self.request.user
        if user.rol == "admin":
            return super().get_queryset()
        return get_user_client_queryset(user)


class PrestadorServicioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PrestadorServicio.objects.select_related("ciudad").all()
    serializer_class = PrestadorServicioSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ciudad", "activo"]


def _admin_empresa_ids(user):
    return list(
        RolInstalacion.objects.filter(usuario=user, rol="admin_empresa")
        .values_list("instalacion__empresa_id", flat=True)
        .distinct()
    )


def _is_provider_user(user):
    return bool(getattr(user, "prestador_id", None))


class InstalacionViewSet(viewsets.ModelViewSet):
    queryset = Instalacion.objects.select_related(
        "empresa", "cliente", "prestador", "ciudad"
    ).all()
    serializer_class = InstalacionSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "empresa",
        "cliente",
        "prestador",
        "ciudad",
        "estado",
        "tipo_sistema",
    ]

    def get_queryset(self):
        user = self.request.user
        if user.rol == "admin":
            return super().get_queryset()
        return get_user_installation_queryset(user)

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from rest_framework.permissions import BasePermission

            class _CanMutateInstalacion(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if user.rol == "admin":
                        return True
                    if _is_provider_user(user):
                        return True
                    return RolInstalacion.objects.filter(
                        usuario=user, rol="admin_empresa"
                    ).exists()

            return [IsAuthenticated(), IsActiveUser(), _CanMutateInstalacion()]
        return super().get_permissions()

    def perform_create(self, serializer):
        empresa = serializer.validated_data.get("empresa")
        cliente = serializer.validated_data.get("cliente") or empresa
        prestador = serializer.validated_data.get("prestador")
        user = self.request.user
        if user.rol == "admin":
            serializer.save(cliente=cliente)
            return

        from rest_framework.exceptions import PermissionDenied

        if user.prestador_id:
            if prestador and prestador.idprestador != user.prestador_id:
                raise PermissionDenied(
                    "No puedes crear instalaciones en otro prestador."
                )
            serializer.save(prestador_id=user.prestador_id, cliente=cliente)
            return

        if empresa.idempresa not in _admin_empresa_ids(user):
            raise PermissionDenied("No puedes crear instalaciones en esta empresa.")
        serializer.save(cliente=cliente)

    def perform_update(self, serializer):
        empresa = (
            serializer.validated_data.get("empresa") or serializer.instance.empresa
        )
        cliente = (
            serializer.validated_data.get("cliente") or serializer.instance.cliente
        )
        if cliente is None:
            cliente = empresa
        prestador = (
            serializer.validated_data.get("prestador")
            if "prestador" in serializer.validated_data
            else serializer.instance.prestador
        )
        user = self.request.user
        if user.rol == "admin":
            serializer.save(cliente=cliente)
            return

        from rest_framework.exceptions import PermissionDenied

        if user.prestador_id:
            if prestador and prestador.idprestador != user.prestador_id:
                raise PermissionDenied(
                    "No puedes editar instalaciones de otro prestador."
                )
            serializer.save(prestador_id=user.prestador_id, cliente=cliente)
            return

        if empresa.idempresa not in _admin_empresa_ids(user):
            raise PermissionDenied("No puedes editar instalaciones de esta empresa.")
        serializer.save(cliente=cliente)


class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.select_related(
        "instalacion", "instalacion__empresa"
    ).all()
    serializer_class = SensorSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["instalacion", "tipo", "estado"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.rol == "admin":
            return qs
        instalacion_ids = list(
            get_user_installation_queryset(user).values_list("idinstalacion", flat=True)
        )
        admin_empresas = _admin_empresa_ids(user)
        if admin_empresas or user.prestador_id:
            return qs.filter(
                Q(instalacion_id__in=instalacion_ids) | Q(instalacion__isnull=True)
            )
        return qs.filter(instalacion_id__in=instalacion_ids)

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from rest_framework.permissions import BasePermission

            class _CanMutateSensor(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if user.rol == "admin":
                        return True
                    if _is_provider_user(user):
                        return True
                    return RolInstalacion.objects.filter(
                        usuario=user, rol="admin_empresa"
                    ).exists()

            return [IsAuthenticated(), IsActiveUser(), _CanMutateSensor()]
        return super().get_permissions()

    def _validate_instalacion_scope(self, instalacion):
        user = self.request.user
        if not instalacion or user.rol == "admin":
            return
        if not user_can_access_installation(user, instalacion):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("No puedes asignar sensores a esta instalacion.")
        if user.prestador_id and instalacion.prestador_id == user.prestador_id:
            return
        if not user_has_installation_role(user, instalacion, "admin_empresa"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("No puedes asignar sensores a esta instalacion.")

    def perform_create(self, serializer):
        self._validate_instalacion_scope(serializer.validated_data.get("instalacion"))
        serializer.save()

    def perform_update(self, serializer):
        instalacion = serializer.validated_data.get("instalacion")
        if instalacion is None and "instalacion" not in serializer.validated_data:
            instalacion = serializer.instance.instalacion
        self._validate_instalacion_scope(instalacion)
        serializer.save()
