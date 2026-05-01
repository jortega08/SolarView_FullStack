from django.utils.dateparse import parse_date
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from auditoria.utils import registrar_evento
from core.access import (
    get_user_installation_queryset,
    user_can_access_installation,
    user_has_installation_role,
)
from core.models import RolInstalacion
from core.permissions import IsActiveUser

from .models import ContratoServicio, Mantenimiento, PlanMantenimiento
from .serializers import (
    ContratoServicioSerializer,
    MantenimientoSerializer,
    PlanMantenimientoSerializer,
)


def _empresas_visibles(user, roles=("admin_empresa", "operador")):
    """IDs de empresas a las que el usuario tiene acceso vía RolInstalacion."""
    return list(
        RolInstalacion.objects.filter(usuario=user, rol__in=roles)
        .values_list("instalacion__empresa_id", flat=True)
        .distinct()
    )


def _instalaciones_visibles(user):
    return list(
        get_user_installation_queryset(user).values_list("idinstalacion", flat=True)
    )


class ContratoServicioViewSet(viewsets.ModelViewSet):
    """
    Contratos de servicio. Sólo admin global o admin_empresa pueden mutar.
    Lectura para usuarios con acceso a la instalación (operador / admin_empresa).
    """

    serializer_class = ContratoServicioSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["nivel", "activo"]

    def get_queryset(self):
        user = self.request.user
        qs = ContratoServicio.objects.select_related("instalacion__empresa")
        if user.rol == "admin":
            return qs
        return qs.filter(instalacion_id__in=_instalaciones_visibles(user))

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from rest_framework.permissions import BasePermission

            class _CanMutate(BasePermission):
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

            return [IsAuthenticated(), IsActiveUser(), _CanMutate()]
        return super().get_permissions()

    def perform_create(self, serializer):
        instalacion = serializer.validated_data.get("instalacion")
        if self.request.user.rol != "admin":
            if not user_can_access_installation(self.request.user, instalacion):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("No puedes crear contratos en esta instalacion.")
            if not (
                getattr(self.request.user, "prestador_id", None)
                and instalacion.prestador_id == self.request.user.prestador_id
            ) and not user_has_installation_role(
                self.request.user, instalacion, "admin_empresa"
            ):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("No puedes crear contratos en esta instalacion.")
        contrato = serializer.save()
        registrar_evento(
            usuario=self.request.user,
            accion="crear_contrato",
            entidad="ContratoServicio",
            entidad_id=contrato.idcontrato,
            detalle={
                "instalacion_id": contrato.instalacion_id,
                "nivel": contrato.nivel,
            },
            request=self.request,
        )


class PlanMantenimientoViewSet(viewsets.ModelViewSet):
    """
    Catálogo de planes de mantenimiento.
    Compartidos a nivel de plataforma (no son por empresa); sólo admin global muta.
    """

    queryset = PlanMantenimiento.objects.select_related("especialidad_requerida").all()
    serializer_class = PlanMantenimientoSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["tipo_sistema", "activo"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            from core.permissions import IsAdminGlobal

            return [IsAuthenticated(), IsActiveUser(), IsAdminGlobal()]
        return super().get_permissions()


class MantenimientoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Mantenimientos programados. Vista de calendario.
    No se crean manualmente desde aquí — los crea Celery Beat (`generar_mantenimientos_preventivos`).
    Sí se pueden cancelar.
    """

    serializer_class = MantenimientoSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["estado", "instalacion", "plan"]

    def get_queryset(self):
        user = self.request.user
        qs = Mantenimiento.objects.select_related(
            "instalacion", "plan", "orden_trabajo"
        )

        # Filtro por rango de fechas (calendario)
        desde = parse_date(self.request.query_params.get("desde", "") or "")
        hasta = parse_date(self.request.query_params.get("hasta", "") or "")
        if desde:
            qs = qs.filter(fecha_programada__gte=desde)
        if hasta:
            qs = qs.filter(fecha_programada__lte=hasta)

        if user.rol == "admin":
            return qs

        return qs.filter(instalacion_id__in=_instalaciones_visibles(user))

    @action(detail=True, methods=["post"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        mant = self.get_object()
        if mant.estado not in ("programado", "en_proceso"):
            return Response(
                {"error": f"No se puede cancelar un mantenimiento {mant.estado}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        motivo = request.data.get("motivo", "")
        mant.estado = "cancelado"
        mant.notas = (mant.notas + f"\nCancelado: {motivo}").strip()
        mant.save(update_fields=["estado", "notas"])

        # Si tiene OT asociada, también cancelarla
        if mant.orden_trabajo and mant.orden_trabajo.estado not in (
            "completada",
            "cerrada",
            "cancelada",
        ):
            mant.orden_trabajo.estado = "cancelada"
            mant.orden_trabajo.save(update_fields=["estado"])

        registrar_evento(
            usuario=request.user,
            accion="cancelar_mantenimiento",
            entidad="Mantenimiento",
            entidad_id=mant.idmantenimiento,
            detalle={"motivo": motivo, "instalacion_id": mant.instalacion_id},
            request=request,
        )
        return Response({"success": True})
