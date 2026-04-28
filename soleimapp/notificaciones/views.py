from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsActiveUser

from .models import Notificacion
from .serializers import NotificacionSerializer


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Bandeja de notificaciones del usuario autenticado.
    Sólo se devuelven las del propio usuario (excepto admin global).
    """

    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["estado", "canal"]

    def get_queryset(self):
        user = self.request.user
        qs = Notificacion.objects.select_related("plantilla").all()
        if user.rol == "admin":
            return qs
        return qs.filter(usuario=user)

    @action(detail=True, methods=["post"], url_path="marcar-leida")
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()
        if notif.usuario_id != request.user.idusuario and request.user.rol != "admin":
            return Response({"error": "No autorizado."}, status=403)
        if notif.estado != "leida":
            notif.estado = "leida"
            notif.leida_at = timezone.now()
            notif.save(update_fields=["estado", "leida_at"])
        return Response({"success": True, "leida_at": notif.leida_at})

    @action(detail=False, methods=["post"], url_path="marcar-todas-leidas")
    def marcar_todas_leidas(self, request):
        ahora = timezone.now()
        Notificacion.objects.filter(
            usuario=request.user,
            estado__in=["pendiente", "enviada", "fallida"],
        ).update(estado="leida", leida_at=ahora)
        return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def no_leidas_count(request):
    """Devuelve el número de notificaciones no leídas del usuario (badge)."""
    count = (
        Notificacion.objects.filter(
            usuario=request.user,
        )
        .exclude(estado="leida")
        .count()
    )
    return Response({"count": count})
