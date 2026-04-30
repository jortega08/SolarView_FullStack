from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from auditoria.utils import registrar_evento
from core.access import get_user_installation_queryset, user_can_access_installation
from core.permissions import IsActiveUser

from .models import Alerta, TipoAlerta
from .serializers import AlertaSerializer, TipoAlertaSerializer


def _instalacion_ids_for_user(user):
    """Devuelve los IDs de instalaciones a las que tiene acceso el usuario."""
    if user.rol == "admin":
        return None  # None indica "sin restricción"
    return list(
        get_user_installation_queryset(user).values_list("idinstalacion", flat=True)
    )


class AlertaViewSet(viewsets.ModelViewSet):
    serializer_class = AlertaSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["estado", "domicilio", "tipoalerta", "instalacion", "severidad"]

    def get_queryset(self):
        user = self.request.user
        qs = Alerta.objects.select_related(
            "tipoalerta",
            "domicilio__ciudad__estado__pais",
            "domicilio__usuario",
            "instalacion",
            "resuelta_por",
        )

        if user.rol == "admin":
            return qs.all()

        # Cada usuario sólo ve las alertas de sus instalaciones o sus domicilios
        ids = _instalacion_ids_for_user(user)
        return qs.filter(Q(instalacion_id__in=ids) | Q(domicilio__usuario=user))

    def perform_create(self, serializer):
        instalacion = serializer.validated_data.get("instalacion")
        if instalacion and not user_can_access_installation(
            self.request.user, instalacion
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("No puedes crear alertas en esta instalacion.")
        serializer.save()

    def perform_update(self, serializer):
        instalacion = serializer.validated_data.get("instalacion")
        if instalacion and not user_can_access_installation(
            self.request.user, instalacion
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("No puedes mover alertas a esta instalacion.")
        serializer.save()

    @action(detail=True, methods=["post"], url_path="resolver")
    def resolver(self, request, pk=None):
        alerta = self.get_object()
        if alerta.estado != "activa":
            return Response(
                {"error": "Solo alertas activas"}, status=status.HTTP_400_BAD_REQUEST
            )

        usuario = request.user
        alerta.estado = "resuelta"
        alerta.resuelta_por = usuario
        alerta.save(update_fields=["estado", "resuelta_por"])

        registrar_evento(
            usuario=usuario,
            accion="resolver_alerta",
            entidad="Alerta",
            entidad_id=alerta.idalerta,
            detalle={"instalacion_id": alerta.instalacion_id},
            request=request,
        )
        return Response({"success": True})


class TipoAlertaViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo de tipos de alerta: sólo lectura para usuarios autenticados."""

    queryset = TipoAlerta.objects.all()
    serializer_class = TipoAlertaSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    pagination_class = None


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def ultimas_alertas(request):
    """Devuelve las últimas 10 alertas del contexto del usuario."""
    user = request.user
    domicilio_id = request.GET.get("domicilio_id")
    instalacion_id = request.GET.get("instalacion_id")

    qs = Alerta.objects.select_related(
        "domicilio__ciudad__estado__pais",
        "domicilio__usuario",
        "tipoalerta",
        "instalacion",
        "resuelta_por",
    )

    # Aplicar filtro de tenant
    if user.rol != "admin":
        ids = _instalacion_ids_for_user(user)
        qs = qs.filter(Q(instalacion_id__in=ids) | Q(domicilio__usuario=user))

    if domicilio_id:
        qs = qs.filter(domicilio__iddomicilio=domicilio_id)
    if instalacion_id:
        qs = qs.filter(instalacion__idinstalacion=instalacion_id)

    alertas = qs.order_by("-fecha")[:10]

    data = []
    for alerta in alertas:
        domicilio_nombre = str(alerta.domicilio) if alerta.domicilio else ""
        usuario_nombre = alerta.domicilio.usuario.nombre if alerta.domicilio else ""
        ciudad_nombre = alerta.domicilio.ciudad.nombre if alerta.domicilio else ""
        data.append(
            {
                "id": alerta.idalerta,
                "estado": alerta.estado,
                "mensaje": alerta.mensaje,
                "fecha": alerta.fecha.strftime("%Y-%m-%d %H:%M"),
                "domicilio": domicilio_nombre,
                "usuario": usuario_nombre,
                "ciudad": ciudad_nombre,
                "tipo": alerta.tipoalerta.nombre if alerta.tipoalerta else "Sin tipo",
                "tipo_desc": alerta.tipoalerta.descripcion if alerta.tipoalerta else "",
                "instalacion": alerta.instalacion.nombre if alerta.instalacion else "",
                "severidad": alerta.severidad,
                "causa_probable": alerta.causa_probable,
                "accion_sugerida": alerta.accion_sugerida,
                "resuelta_por": (
                    alerta.resuelta_por.nombre if alerta.resuelta_por else ""
                ),
            }
        )

    from django.http import JsonResponse

    return JsonResponse(data, safe=False)
