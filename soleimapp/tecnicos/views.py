from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.access import get_user_installation_queryset
from core.models import Ciudad, RolInstalacion
from core.permissions import IsActiveUser

from .models import Especialidad, PerfilTecnico
from .serializers import (
    EspecialidadSerializer,
    PerfilTecnicoLigeroSerializer,
    PerfilTecnicoSerializer,
)


class EspecialidadViewSet(viewsets.ModelViewSet):
    """
    Catálogo de especialidades.
    Lectura para todos los autenticados; mutaciones sólo admin global.
    """

    queryset = Especialidad.objects.all()
    serializer_class = EspecialidadSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    pagination_class = None

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from core.permissions import IsAdminGlobal

            return [IsAuthenticated(), IsActiveUser(), IsAdminGlobal()]
        return super().get_permissions()


class PerfilTecnicoViewSet(viewsets.ModelViewSet):
    """
    Gestión de perfiles de técnico.

    Reglas:
    - admin global ve y gestiona todos los perfiles.
    - admin_empresa de una instalación ve los técnicos de su empresa
      (= empresas donde tiene rol 'admin_empresa').
    - el resto sólo ve su propio perfil (si es técnico).
    Las mutaciones (create/update/destroy) están reservadas a admin global y admin_empresa.
    """

    serializer_class = PerfilTecnicoSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["empresa", "disponible"]

    def get_queryset(self):
        user = self.request.user
        qs = PerfilTecnico.objects.select_related(
            "usuario", "empresa"
        ).prefetch_related("especialidades", "zonas")
        if user.rol == "admin":
            return qs

        if user.prestador_id:
            return qs.filter(prestador_id=user.prestador_id)

        # Empresas donde el usuario tiene rol 'admin_empresa'
        empresas_admin = (
            RolInstalacion.objects.filter(usuario=user, rol="admin_empresa")
            .values_list("instalacion__empresa_id", flat=True)
            .distinct()
        )
        if empresas_admin:
            return qs.filter(empresa_id__in=list(empresas_admin))

        # Si el propio usuario es técnico, ve su perfil
        return qs.filter(usuario=user)

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            # Sólo admin global o admin_empresa pueden mutar
            from rest_framework.permissions import BasePermission

            class IsAdminGlobalOrEmpresa(BasePermission):
                def has_permission(self, request, view):
                    user = request.user
                    if not (user and user.is_authenticated):
                        return False
                    if user.rol == "admin":
                        return True
                    if getattr(user, "prestador_id", None):
                        return True
                    return RolInstalacion.objects.filter(
                        usuario=user, rol="admin_empresa"
                    ).exists()

            return [IsAuthenticated(), IsActiveUser(), IsAdminGlobalOrEmpresa()]
        return super().get_permissions()

    def _validate_scope(self, perfil_data):
        user = self.request.user
        if user.rol == "admin":
            return perfil_data
        prestador = perfil_data.get("prestador")
        if user.prestador_id:
            if prestador and prestador.idprestador != user.prestador_id:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    "No puedes gestionar tecnicos de otro prestador."
                )
            perfil_data["prestador_id"] = user.prestador_id
            return perfil_data

        empresa = perfil_data.get("empresa")
        empresas_admin = list(
            RolInstalacion.objects.filter(usuario=user, rol="admin_empresa")
            .values_list("instalacion__empresa_id", flat=True)
            .distinct()
        )
        if empresa and empresa.idempresa not in empresas_admin:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("No puedes gestionar tecnicos de esta empresa.")
        return perfil_data

    def perform_create(self, serializer):
        kwargs = self._validate_scope(dict(serializer.validated_data))
        serializer.save(**{k: v for k, v in kwargs.items() if k.endswith("_id")})

    def perform_update(self, serializer):
        kwargs = self._validate_scope(dict(serializer.validated_data))
        serializer.save(**{k: v for k, v in kwargs.items() if k.endswith("_id")})

    @action(detail=False, methods=["get"], url_path="disponibles")
    def disponibles(self, request):
        """
        Lista técnicos disponibles ordenados por carga.
        Query params: ?ciudad=<idciudad>&especialidad=<idespecialidad>&empresa=<idempresa>
        """
        ciudad_id = request.query_params.get("ciudad")
        especialidad_id = request.query_params.get("especialidad")
        empresa_id = request.query_params.get("empresa")
        prestador_id = request.query_params.get("prestador")

        if not ciudad_id:
            return Response(
                {"error": "Parámetro `ciudad` (id) es requerido."},
                status=400,
            )
        try:
            ciudad = Ciudad.objects.get(idciudad=ciudad_id)
        except Ciudad.DoesNotExist:
            return Response({"error": "Ciudad no encontrada."}, status=404)

        especialidad = None
        if especialidad_id:
            especialidad = Especialidad.objects.filter(
                idespecialidad=especialidad_id
            ).first()

        empresa = None
        if empresa_id:
            from core.models import Empresa

            empresa = Empresa.objects.filter(idempresa=empresa_id).first()
        prestador = None
        if prestador_id:
            from core.models import PrestadorServicio

            prestador = PrestadorServicio.objects.filter(
                idprestador=prestador_id
            ).first()

        # Restringir el alcance al tenant del usuario, igual que en get_queryset
        qs = PerfilTecnico.objects.disponibles_en_zona(
            ciudad,
            especialidad=especialidad,
            empresa=empresa,
            prestador=prestador,
        )
        if request.user.rol != "admin":
            if request.user.prestador_id:
                qs = qs.filter(prestador_id=request.user.prestador_id)
            else:
                empresas_visibles = list(
                    get_user_installation_queryset(request.user).values_list(
                        "empresa_id", flat=True
                    )
                )
                qs = qs.filter(empresa_id__in=empresas_visibles)

        data = PerfilTecnicoLigeroSerializer(qs, many=True).data
        return Response({"count": len(data), "results": data})

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        perfil = (
            PerfilTecnico.objects.select_related("usuario", "empresa")
            .prefetch_related("especialidades", "zonas")
            .filter(usuario=request.user)
            .first()
        )
        if not perfil:
            return Response(
                {"error": "El usuario no tiene perfil tecnico."}, status=404
            )

        if request.method.lower() == "patch":
            serializer = self.get_serializer(perfil, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        return Response(self.get_serializer(perfil).data)
