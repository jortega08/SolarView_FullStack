from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import (
    SAFE_METHODS,
    BasePermission,
    IsAuthenticated,
)
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
    InvitacionCliente,
    InvitacionPrestador,
    Pais,
    PrestadorServicio,
    RolInstalacion,
    Sensor,
    Tarifa,
    Usuario,
)
from .serializers import (
    CiudadSerializer,
    ClienteSerializer,
    DomicilioSerializer,
    EmpresaSerializer,
    EstadoSerializer,
    InstalacionSerializer,
    InvitacionClienteSerializer,
    InvitacionPrestadorSerializer,
    MiPrestadorSerializer,
    PaisSerializer,
    PrestadorServicioSerializer,
    SensorSerializer,
    TarifaSerializer,
    UsuarioClienteSerializer,
    UsuarioCreateSerializer,
    UsuarioEquipoPrestadorSerializer,
    UsuarioSerializer,
)

# Permisos base para todos los ViewSets
_AUTHENTICATED = [IsAuthenticated, IsActiveUser]


class _PublicReadAuthenticatedWrite(BasePermission):
    """
    Lectura pública (anónimos pueden GET) y escritura autenticada activa.

    Usado en catálogos geográficos (países/estados/ciudades) para que el
    formulario de registro pueda poblar selects sin un token.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if hasattr(user, "is_active") and not user.is_active:
            return False
        if hasattr(user, "is_locked") and user.is_locked():
            return False
        return True


class PaisViewSet(viewsets.ModelViewSet):
    """Catálogo público en lectura (lo usa el form de registro)."""

    queryset = Pais.objects.all()
    serializer_class = PaisSerializer
    permission_classes = [_PublicReadAuthenticatedWrite]
    pagination_class = None


class EstadoViewSet(viewsets.ModelViewSet):
    """Catálogo público en lectura."""

    queryset = Estado.objects.select_related("pais").all()
    serializer_class = EstadoSerializer
    permission_classes = [_PublicReadAuthenticatedWrite]
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
    """Catálogo público en lectura."""

    queryset = Ciudad.objects.select_related("estado").all()
    serializer_class = CiudadSerializer
    permission_classes = [_PublicReadAuthenticatedWrite]
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

    @action(detail=True, methods=["post"], url_path="cambiar-contrasena")
    def cambiar_contrasena(self, request, pk=None):
        instance = self.get_object()
        # Solo el propio usuario o un admin pueden cambiar la contraseña
        if request.user.rol != "admin" and instance.idusuario != request.user.idusuario:
            return Response({"error": "Sin permiso."}, status=403)

        nueva = request.data.get("nueva_contrasena", "")
        if not nueva or len(nueva) < 8:
            return Response(
                {"error": "La contraseña debe tener al menos 8 caracteres."}, status=400
            )

        import re

        if not re.search(r"[A-Z]", nueva):
            return Response(
                {"error": "Debe incluir al menos una letra mayúscula."}, status=400
            )
        if not re.search(r"\d", nueva):
            return Response({"error": "Debe incluir al menos un número."}, status=400)

        from django.contrib.auth.hashers import make_password

        instance.contrasena = make_password(nueva)
        instance.save(update_fields=["contrasena"])
        return Response(
            {"success": True, "message": "Contraseña actualizada correctamente."}
        )


class DomicilioViewSet(viewsets.ModelViewSet):
    queryset = Domicilio.objects.select_related(
        "usuario",
        "ciudad__estado__pais",
    ).all()
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


class EmpresaViewSet(viewsets.ModelViewSet):
    """
    Empresas-cliente atendidas por un prestador.

    Lectura: filtrada por el alcance del usuario (admin global ve todo).
    Escritura:
      - admin global puede crear/editar cualquier empresa.
      - Usuario con `prestador` asignado puede crear empresas-cliente
        (las verá automáticamente cuando registre instalaciones para ellas).
      - admin_empresa de una instalación puede actualizar la empresa de su scope.
    """

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

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from rest_framework.permissions import BasePermission

            class _CanMutateEmpresa(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if user.rol == "admin":
                        return True
                    if getattr(user, "prestador_id", None):
                        return True
                    # admin_empresa puede actualizar empresas dentro de su scope.
                    return RolInstalacion.objects.filter(
                        usuario=user, rol="admin_empresa"
                    ).exists()

            return [IsAuthenticated(), IsActiveUser(), _CanMutateEmpresa()]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        if user.rol == "admin":
            serializer.save()
            return
        if getattr(user, "prestador_id", None):
            serializer.save(prestador_id=user.prestador_id)
            return
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if user.rol == "admin":
            serializer.save()
            return
        if getattr(user, "prestador_id", None):
            serializer.save(prestador_id=user.prestador_id)
            return
        serializer.save()


class ClienteViewSet(viewsets.ModelViewSet):
    """
    Empresas cliente administradas por el prestador del usuario.

    El modelo real es Empresa; este ViewSet expone la superficie multi-tenant
    especifica de Fase 4C para clientes, usuarios cliente e invitaciones.
    """

    serializer_class = ClienteSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ciudad"]

    def get_queryset(self):
        user = self.request.user
        qs = get_user_client_queryset(user).annotate(
            usuarios_count=Count("usuarios_cliente", distinct=True),
            instalaciones_count=Count("instalaciones_cliente", distinct=True),
        )
        return qs.order_by("nombre", "idempresa")

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "invitaciones",
            "quitar_acceso_usuario",
        ):
            from rest_framework.permissions import BasePermission

            class _SoloAdminPrestador(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if getattr(user, "rol", None) == "admin":
                        return True
                    return bool(
                        getattr(user, "prestador_id", None)
                        and getattr(user, "es_admin_prestador", False)
                    )

            return [IsAuthenticated(), IsActiveUser(), _SoloAdminPrestador()]
        return super().get_permissions()

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied, ValidationError

        user = self.request.user
        if user.rol == "admin":
            prestador_id = self.request.data.get("prestador")
            if prestador_id:
                serializer.save(prestador_id=prestador_id)
            else:
                serializer.save()
            return
        if not getattr(user, "prestador_id", None):
            raise PermissionDenied("No tienes prestador asociado.")
        if getattr(user, "empresa_cliente_id", None):
            raise PermissionDenied("Un usuario cliente no puede crear clientes.")
        if not getattr(user, "es_admin_prestador", False):
            raise PermissionDenied("Solo el admin del prestador puede crear clientes.")
        try:
            serializer.save(prestador_id=user.prestador_id)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

    def perform_update(self, serializer):
        user = self.request.user
        if user.rol == "admin":
            serializer.save()
            return
        serializer.save(prestador_id=user.prestador_id)

    @action(detail=True, methods=["get"], url_path="usuarios")
    def usuarios(self, request, pk=None):
        cliente = self.get_object()
        user = request.user
        if user.rol != "admin" and not _empresa_belongs_to_prestador(
            cliente, getattr(user, "prestador_id", None)
        ):
            return Response(
                {"detail": "Cliente fuera de tu prestador."},
                status=status.HTTP_404_NOT_FOUND,
            )
        usuarios = Usuario.objects.filter(
            empresa_cliente=cliente,
            prestador__isnull=True,
        ).order_by("nombre", "idusuario")
        return Response(UsuarioClienteSerializer(usuarios, many=True).data)

    @action(detail=True, methods=["get", "post"], url_path="invitaciones")
    def invitaciones(self, request, pk=None):
        cliente = self.get_object()
        user = request.user
        if user.rol != "admin" and not _empresa_belongs_to_prestador(
            cliente, getattr(user, "prestador_id", None)
        ):
            return Response(
                {"detail": "Cliente fuera de tu prestador."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.method == "GET":
            invitaciones = InvitacionCliente.objects.select_related(
                "prestador", "empresa_cliente", "creada_por", "usado_por"
            ).filter(empresa_cliente=cliente)
            if user.rol != "admin":
                invitaciones = invitaciones.filter(prestador_id=user.prestador_id)
            return Response(
                InvitacionClienteSerializer(invitaciones, many=True).data
            )

        serializer = InvitacionClienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if user.rol == "admin":
            target_prestador_id = cliente.prestador_id
            if not target_prestador_id:
                return Response(
                    {"detail": "La empresa cliente no tiene prestador asignado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            target_prestador_id = user.prestador_id
            if not cliente.prestador_id:
                cliente.prestador_id = target_prestador_id
                cliente.save(update_fields=["prestador"])

        from secrets import token_urlsafe

        codigo = token_urlsafe(24)
        invitacion = serializer.save(
            codigo=codigo,
            prestador_id=target_prestador_id,
            empresa_cliente=cliente,
            creada_por=user,
        )
        return Response(
            InvitacionClienteSerializer(invitacion).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path=r"usuarios/(?P<idusuario>[^/.]+)/quitar-acceso",
    )
    def quitar_acceso_usuario(self, request, pk=None, idusuario=None):
        cliente = self.get_object()
        user = request.user
        if user.rol != "admin" and not _empresa_belongs_to_prestador(
            cliente, getattr(user, "prestador_id", None)
        ):
            return Response(
                {"detail": "Cliente fuera de tu prestador."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            usuario = Usuario.objects.get(
                idusuario=idusuario,
                empresa_cliente=cliente,
                prestador__isnull=True,
            )
        except Usuario.DoesNotExist:
            return Response(
                {"detail": "Usuario cliente no encontrado en esta empresa."},
                status=status.HTTP_404_NOT_FOUND,
            )

        usuario.empresa_cliente = None
        usuario.save(update_fields=["empresa_cliente"])
        return Response(
            {
                "success": True,
                "message": "Acceso de cliente retirado correctamente.",
                "usuario": UsuarioClienteSerializer(usuario).data,
            }
        )


class InvitacionClienteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvitacionClienteSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = InvitacionCliente.objects.select_related(
            "prestador", "empresa_cliente", "creada_por", "usado_por"
        )
        if getattr(user, "rol", None) == "admin":
            return qs
        prestador_id = getattr(user, "prestador_id", None)
        if not prestador_id:
            return qs.none()
        return qs.filter(prestador_id=prestador_id)

    @action(detail=True, methods=["post"], url_path="revocar")
    def revocar(self, request, pk=None):
        invitacion = self.get_object()
        user = request.user
        if user.rol != "admin" and not (
            getattr(user, "prestador_id", None) == invitacion.prestador_id
            and getattr(user, "es_admin_prestador", False)
        ):
            return Response(
                {"detail": "Solo el admin del prestador puede revocar invitaciones."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if invitacion.usado_por_id:
            return Response(
                {"detail": "No puedes revocar una invitacion que ya fue usada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not invitacion.revocada:
            invitacion.revocada = True
            invitacion.save(update_fields=["revocada"])
        return Response(InvitacionClienteSerializer(invitacion).data)


class PrestadorServicioViewSet(viewsets.ModelViewSet):
    """
    PrestadorServicio = la empresa prestadora del usuario operativo.

    Reglas de creación:
      - admin global puede crear/editar cualquier prestador.
      - Un usuario sin prestador asignado puede crear UNO (auto-link).
        El recurso recién creado queda vinculado a `usuario.prestador`.
      - Si el usuario ya tiene prestador, sólo puede actualizar el suyo.
    """

    queryset = PrestadorServicio.objects.select_related("ciudad").all()
    serializer_class = PrestadorServicioSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ciudad", "activo"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from rest_framework.permissions import BasePermission

            class _CanMutatePrestador(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if user.rol == "admin":
                        return True
                    # Cualquier usuario activo puede registrar SU prestador.
                    return True

                def has_object_permission(self, request, view, obj):
                    user = request.user
                    if user.rol == "admin":
                        return True
                    # Sólo el admin del prestador (quien lo creó / fue marcado)
                    # puede editarlo.
                    return getattr(
                        user, "prestador_id", None
                    ) == obj.idprestador and getattr(user, "es_admin_prestador", False)

            return [IsAuthenticated(), IsActiveUser(), _CanMutatePrestador()]
        return super().get_permissions()

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied

        user = self.request.user
        if user.rol != "admin" and getattr(user, "prestador_id", None):
            raise PermissionDenied(
                "Ya tienes un prestador asignado; no puedes crear otro."
            )
        prestador = serializer.save()
        # Auto-link: si el usuario aún no tiene prestador, queda vinculado al recién creado
        # y queda marcado como admin de ese prestador (puede invitar empleados, etc.).
        if user.rol != "admin" and not getattr(user, "prestador_id", None):
            user.prestador = prestador
            user.es_admin_prestador = True
            user.save(update_fields=["prestador", "es_admin_prestador"])


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, IsActiveUser])
def mi_prestador(request):
    """
    Consulta y edicion acotada del PrestadorServicio vinculado al usuario actual.

    GET: cualquier usuario vinculado al prestador puede leerlo.
    PATCH: solo el admin del prestador puede editar campos seguros.
    """

    user = request.user
    if not getattr(user, "prestador_id", None):
        return Response(
            {"detail": "No tienes un prestador asociado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    prestador = PrestadorServicio.objects.select_related("ciudad").get(
        idprestador=user.prestador_id
    )

    if request.method == "GET":
        return Response(MiPrestadorSerializer(prestador).data)

    if not getattr(user, "es_admin_prestador", False):
        return Response(
            {"detail": "Solo el administrador del prestador puede editar estos datos."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = MiPrestadorSerializer(prestador, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def equipo_prestador(request):
    """Lista usuarios vinculados al mismo PrestadorServicio del usuario actual."""

    user = request.user
    prestador_id = getattr(user, "prestador_id", None)
    if not prestador_id:
        return Response(
            {"detail": "No tienes un prestador asociado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    usuarios = Usuario.objects.filter(prestador_id=prestador_id).order_by(
        "-es_admin_prestador", "nombre", "idusuario"
    )
    return Response(UsuarioEquipoPrestadorSerializer(usuarios, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsActiveUser])
def quitar_acceso_prestador(request, idusuario):
    """Desvincula a un empleado del prestador sin eliminar su cuenta."""

    user = request.user
    prestador_id = getattr(user, "prestador_id", None)
    if not prestador_id:
        return Response(
            {"detail": "No tienes un prestador asociado."},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not getattr(user, "es_admin_prestador", False):
        return Response(
            {"detail": "Solo el administrador del prestador puede quitar accesos."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if int(idusuario) == user.idusuario:
        return Response(
            {"detail": "No puedes quitar tu propio acceso al prestador."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        empleado = Usuario.objects.get(idusuario=idusuario, prestador_id=prestador_id)
    except Usuario.DoesNotExist:
        return Response(
            {"detail": "Usuario no encontrado en tu prestador."},
            status=status.HTTP_404_NOT_FOUND,
        )

    empleado.prestador = None
    empleado.es_admin_prestador = False
    empleado.save(update_fields=["prestador", "es_admin_prestador"])
    return Response(
        {
            "success": True,
            "message": "Acceso al prestador retirado correctamente.",
            "usuario": UsuarioEquipoPrestadorSerializer(empleado).data,
        }
    )


def _admin_empresa_ids(user):
    return list(
        RolInstalacion.objects.filter(usuario=user, rol="admin_empresa")
        .values_list("instalacion__empresa_id", flat=True)
        .distinct()
    )


def _is_provider_user(user):
    return bool(getattr(user, "prestador_id", None))


def _is_provider_admin(user):
    return bool(
        getattr(user, "rol", None) == "admin"
        or (
            getattr(user, "prestador_id", None)
            and getattr(user, "es_admin_prestador", False)
        )
    )


def _empresa_belongs_to_prestador(empresa, prestador_id):
    if not empresa or not prestador_id:
        return False
    if getattr(empresa, "prestador_id", None) == prestador_id:
        return True
    return Instalacion.objects.filter(
        Q(cliente=empresa) | Q(empresa=empresa),
        prestador_id=prestador_id,
    ).exists()


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
                message = (
                    "Necesitas estar asociado a un prestador o tener rol "
                    "admin_empresa para crear o editar instalaciones."
                )

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


class InvitacionPrestadorViewSet(viewsets.ModelViewSet):
    """
    Códigos de invitación para que nuevos usuarios se unan al PrestadorServicio
    como empleados, sin crear otro prestador.

    - Sólo el admin del prestador (`es_admin_prestador=True`) puede emitir
      invitaciones (POST), revocarlas (DELETE) o listarlas.
    - Cada admin sólo ve las invitaciones de SU prestador.
    - El código se genera automáticamente (random hex de 24 chars).
    - El canje se hace en POST /api/auth/registrar-con-codigo/.
    """

    serializer_class = InvitacionPrestadorSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = InvitacionPrestador.objects.select_related(
            "prestador", "creado_por", "usado_por"
        )
        if getattr(user, "rol", None) == "admin":
            return qs
        prestador_id = getattr(user, "prestador_id", None)
        if not prestador_id:
            return qs.none()
        return qs.filter(prestador_id=prestador_id)

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            from rest_framework.permissions import BasePermission

            class _SoloAdminPrestador(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if getattr(user, "rol", None) == "admin":
                        return True
                    return bool(
                        getattr(user, "prestador_id", None)
                        and getattr(user, "es_admin_prestador", False)
                    )

            return [IsAuthenticated(), IsActiveUser(), _SoloAdminPrestador()]
        return super().get_permissions()

    def perform_create(self, serializer):
        from secrets import token_urlsafe

        from rest_framework.exceptions import PermissionDenied, ValidationError

        user = self.request.user
        prestador_id = getattr(user, "prestador_id", None)
        if not prestador_id and getattr(user, "rol", None) != "admin":
            raise PermissionDenied("No tienes prestador asociado.")
        # Si el body pasó un `prestador` distinto, lo ignoramos: la invitación
        # es siempre para el prestador del admin que la emite.
        if getattr(user, "rol", None) == "admin":
            target_prestador = serializer.validated_data.get("prestador")
            if target_prestador is None:
                raise ValidationError(
                    {"prestador": "Admin global debe especificar el prestador."}
                )
            target_prestador_id = target_prestador.idprestador
        else:
            target_prestador_id = prestador_id

        codigo = token_urlsafe(18)[:24]  # ~24 chars URL-safe
        invitacion = serializer.save(
            prestador_id=target_prestador_id,
            codigo=codigo,
            creado_por=user,
        )

        # Enviar email si se especificó destinatario
        email_destino = invitacion.email_destino
        if email_destino:
            try:
                from django.conf import settings as django_settings
                from django.core.mail import send_mail

                frontend_url = getattr(django_settings, "FRONTEND_URL", "http://localhost:5174")
                link = f"{frontend_url}/register?codigo={invitacion.codigo}"
                prestador_nombre = invitacion.prestador.nombre if invitacion.prestador else "SolarView"
                asunto = f"Invitación para unirte a {prestador_nombre} en SolarView"
                mensaje_texto = (
                    f"Hola,\n\n"
                    f"Has sido invitado a unirte a {prestador_nombre} en SolarView.\n\n"
                    f"Usa el siguiente enlace para registrarte:\n{link}\n\n"
                    f"O ingresa el código manualmente: {invitacion.codigo}\n\n"
                    f"Este enlace vence el {invitacion.vigente_hasta.strftime('%d/%m/%Y')}.\n\n"
                    f"— Equipo SolarView"
                )
                mensaje_html = f"""
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
                  <h2 style="color:#2563eb">Invitación a SolarView</h2>
                  <p>Hola,</p>
                  <p>Has sido invitado a unirte a <strong>{prestador_nombre}</strong> en SolarView.</p>
                  <p style="margin:24px 0">
                    <a href="{link}"
                       style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                      Aceptar invitación
                    </a>
                  </p>
                  <p style="color:#64748b;font-size:13px">
                    O copia este código en el registro: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">{invitacion.codigo}</code>
                  </p>
                  <p style="color:#64748b;font-size:12px">Vence el {invitacion.vigente_hasta.strftime('%d/%m/%Y')}.</p>
                </div>
                """
                send_mail(
                    subject=asunto,
                    message=mensaje_texto,
                    from_email=django_settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email_destino],
                    html_message=mensaje_html,
                    fail_silently=False,
                )
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("No se pudo enviar email de invitación: %s", exc)

    def destroy(self, request, *args, **kwargs):
        invitacion = self.get_object()
        if invitacion.usado_por_id:
            return Response(
                {"detail": "No puedes revocar una invitacion que ya fue usada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not invitacion.revocada:
            invitacion.revocada = True
            invitacion.save(update_fields=["revocada"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class TarifaViewSet(viewsets.ModelViewSet):
    """
    CRUD de tarifas kWh.

    Lectura: cualquier usuario autenticado puede consultar las tarifas que
    afectan a sus instalaciones/ciudades.
    Escritura: admin global y prestadores (cada prestador define las tarifas
    que aplican a sus clientes/instalaciones).
    """

    queryset = Tarifa.objects.select_related("ciudad", "instalacion").all()
    serializer_class = TarifaSerializer
    permission_classes = _AUTHENTICATED
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ciudad", "instalacion", "moneda"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from rest_framework.permissions import BasePermission

            class _CanMutateTarifa(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if user.rol == "admin":
                        return True
                    return bool(getattr(user, "prestador_id", None))

            return [IsAuthenticated(), IsActiveUser(), _CanMutateTarifa()]
        return super().get_permissions()


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
