import logging

from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from auditoria.utils import registrar_evento
from core.access import (
    get_user_installation_queryset,
    user_can_access_installation,
    user_has_installation_role,
)
from core.models import Usuario
from core.permissions import IsActiveUser, IsOperadorOrAdmin

from .models import ComentarioOrden, EvidenciaOrden, OrdenTrabajo
from .permissions import (
    CanAssignOrden,
    CanCancelOrden,
    IsAssignedTechnicianOrAdmin,
)
from .serializers import (
    ComentarioOrdenSerializer,
    EvidenciaOrdenSerializer,
    OrdenTrabajoLigeroSerializer,
    OrdenTrabajoSerializer,
)

logger = logging.getLogger("soleim")


def _instalaciones_visibles(user):
    """IDs de instalaciones visibles para el usuario."""
    return list(
        get_user_installation_queryset(user).values_list("idinstalacion", flat=True)
    )


class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    """
    ViewSet principal de órdenes de trabajo.

    Acciones extra:
      POST /api/ordenes/ordenes/<pk>/asignar/      → admin / admin_empresa
      POST /api/ordenes/ordenes/<pk>/iniciar/      → técnico asignado
      POST /api/ordenes/ordenes/<pk>/completar/    → técnico asignado
      POST /api/ordenes/ordenes/<pk>/cerrar/       → admin_empresa / admin
      POST /api/ordenes/ordenes/<pk>/cancelar/     → creador / admin_empresa / admin

    Sub-recursos:
      GET/POST /api/ordenes/ordenes/<pk>/comentarios/
      GET/POST /api/ordenes/ordenes/<pk>/evidencias/
    """

    serializer_class = OrdenTrabajoSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["estado", "prioridad", "tipo", "asignado_a", "instalacion"]

    def get_queryset(self):
        user = self.request.user
        qs = OrdenTrabajo.objects.select_related(
            "instalacion__empresa",
            "instalacion__prestador",
            "asignado_a",
            "creado_por",
            "alerta",
            "mantenimiento",
        )
        if user.rol == "admin":
            return qs

        # Técnico puro → sólo sus órdenes asignadas
        # Operador / admin_empresa → órdenes de sus instalaciones
        instalaciones = _instalaciones_visibles(user)
        return qs.filter(
            Q(asignado_a=user) | Q(instalacion_id__in=instalaciones)
        ).distinct()

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsActiveUser(), IsOperadorOrAdmin()]
        if self.action in ("asignar", "cerrar"):
            return [IsAuthenticated(), IsActiveUser(), CanAssignOrden()]
        if self.action in ("iniciar", "completar"):
            return [IsAuthenticated(), IsActiveUser(), IsAssignedTechnicianOrAdmin()]
        if self.action == "cancelar":
            return [IsAuthenticated(), IsActiveUser(), CanCancelOrden()]
        return super().get_permissions()

    def perform_create(self, serializer):
        instalacion = serializer.validated_data.get("instalacion")
        user = self.request.user
        if user.rol != "admin":
            if not user_can_access_installation(user, instalacion):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("No puedes crear ordenes en esta instalacion.")
            provider_match = (
                getattr(user, "prestador_id", None)
                and instalacion.prestador_id == user.prestador_id
            )
            if not provider_match and not user_has_installation_role(
                user, instalacion, "operador"
            ):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("No puedes crear ordenes en esta instalacion.")
        orden = serializer.save(creado_por=self.request.user)
        logger.info("Orden creada: %s por %s", orden.codigo, self.request.user.email)
        registrar_evento(
            usuario=self.request.user,
            accion="crear_orden",
            entidad="OrdenTrabajo",
            entidad_id=orden.idorden,
            detalle={"codigo": orden.codigo, "instalacion_id": orden.instalacion_id},
            request=self.request,
        )

    # ---------------------------------------------------------------------
    # Acciones de transición de estado
    # ---------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="asignar")
    def asignar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado not in ("abierta", "asignada"):
            return Response(
                {"error": f"No se puede asignar una orden {orden.estado}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tecnico_id = request.data.get("tecnico_id")
        if not tecnico_id:
            return Response({"error": "tecnico_id es requerido."}, status=400)
        try:
            tecnico = Usuario.objects.select_related("perfil_tecnico").get(
                idusuario=tecnico_id
            )
        except Usuario.DoesNotExist:
            return Response({"error": "Técnico no encontrado."}, status=404)

        perfil = getattr(tecnico, "perfil_tecnico", None)
        if (
            orden.instalacion.prestador_id
            and perfil
            and perfil.prestador_id
            and perfil.prestador_id != orden.instalacion.prestador_id
        ):
            return Response(
                {"error": "El tecnico no pertenece al prestador de la instalacion."},
                status=403,
            )

        sla = request.data.get("sla_objetivo_horas")
        if sla:
            try:
                orden.sla_objetivo_horas = int(sla)
            except (TypeError, ValueError):
                return Response(
                    {"error": "sla_objetivo_horas debe ser entero."}, status=400
                )

        orden.asignado_a = tecnico
        orden.estado = "asignada"
        orden.asignada_at = timezone.now()
        orden.save()  # save completo dispara signal de cambio_estado

        registrar_evento(
            usuario=request.user,
            accion="asignar_orden",
            entidad="OrdenTrabajo",
            entidad_id=orden.idorden,
            detalle={"tecnico_id": tecnico.idusuario, "codigo": orden.codigo},
            request=request,
        )

        # Notificar al técnico (Lote 5 — la API notificar() existe)
        try:
            from notificaciones.api import notificar

            notificar(
                usuario_id=tecnico.idusuario,
                canal="in_app",
                plantilla="orden_asignada",
                context={
                    "codigo": orden.codigo,
                    "titulo": orden.titulo,
                    "orden_id": orden.idorden,
                },
            )
        except Exception:
            logger.exception("No se pudo crear notificación de asignación")

        return Response(self.get_serializer(orden).data)

    @action(detail=True, methods=["post"], url_path="iniciar")
    def iniciar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado != "asignada":
            return Response(
                {"error": "Sólo órdenes asignadas pueden iniciarse."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        orden.estado = "en_progreso"
        orden.iniciada_at = timezone.now()
        orden.save()

        registrar_evento(
            usuario=request.user,
            accion="iniciar_orden",
            entidad="OrdenTrabajo",
            entidad_id=orden.idorden,
            detalle={"codigo": orden.codigo},
            request=request,
        )
        return Response(self.get_serializer(orden).data)

    @action(detail=True, methods=["post"], url_path="completar")
    def completar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado not in ("en_progreso", "asignada"):
            return Response(
                {"error": "Sólo órdenes en_progreso o asignadas pueden completarse."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notas = request.data.get("notas_resolucion", "")
        orden.notas_resolucion = (
            (orden.notas_resolucion + "\n" + notas).strip()
            if notas
            else orden.notas_resolucion
        )
        orden.estado = "completada"
        orden.completada_at = timezone.now()
        orden.save()

        # Si la orden viene de una alerta → resolver la alerta
        if orden.alerta_id and orden.alerta and orden.alerta.estado == "activa":
            orden.alerta.estado = "resuelta"
            orden.alerta.resuelta_por = request.user
            orden.alerta.save(update_fields=["estado", "resuelta_por"])

        # Si viene de un mantenimiento → marcar completado y actualizar instalación
        if orden.mantenimiento_id:
            mant = orden.mantenimiento
            mant.estado = "completado"
            mant.save(update_fields=["estado"])
            inst = orden.instalacion
            inst.ultimo_mantenimiento = timezone.localdate()
            inst.save(update_fields=["ultimo_mantenimiento"])

        registrar_evento(
            usuario=request.user,
            accion="completar_orden",
            entidad="OrdenTrabajo",
            entidad_id=orden.idorden,
            detalle={
                "codigo": orden.codigo,
                "tiempo_horas": orden.tiempo_resolucion_horas(),
            },
            request=request,
        )
        return Response(self.get_serializer(orden).data)

    @action(detail=True, methods=["post"], url_path="cerrar")
    def cerrar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado != "completada":
            return Response(
                {"error": "Sólo órdenes completadas pueden cerrarse."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        orden.estado = "cerrada"
        orden.cerrada_at = timezone.now()
        orden.save()

        registrar_evento(
            usuario=request.user,
            accion="cerrar_orden",
            entidad="OrdenTrabajo",
            entidad_id=orden.idorden,
            detalle={"codigo": orden.codigo},
            request=request,
        )
        return Response(self.get_serializer(orden).data)

    @action(detail=True, methods=["post"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado in ("completada", "cerrada", "cancelada"):
            return Response(
                {"error": f"No se puede cancelar una orden {orden.estado}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        motivo = request.data.get("motivo", "")
        orden.estado = "cancelada"
        orden.notas_resolucion = (
            orden.notas_resolucion + f"\nCancelada: {motivo}"
        ).strip()
        orden.save()

        registrar_evento(
            usuario=request.user,
            accion="cancelar_orden",
            entidad="OrdenTrabajo",
            entidad_id=orden.idorden,
            detalle={"codigo": orden.codigo, "motivo": motivo},
            request=request,
        )
        return Response({"success": True})

    # ---------------------------------------------------------------------
    # Sub-recursos: comentarios y evidencias
    # ---------------------------------------------------------------------

    @action(detail=True, methods=["get", "post"], url_path="comentarios")
    def comentarios(self, request, pk=None):
        orden = self.get_object()
        if request.method == "GET":
            qs = orden.comentarios.select_related("usuario").all()
            return Response(ComentarioOrdenSerializer(qs, many=True).data)

        texto = request.data.get("texto", "").strip()
        if not texto:
            return Response({"error": "texto es requerido."}, status=400)
        com = ComentarioOrden.objects.create(
            orden=orden,
            usuario=request.user,
            tipo="comentario",
            texto=texto,
        )
        return Response(ComentarioOrdenSerializer(com).data, status=201)

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="evidencias",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def evidencias(self, request, pk=None):
        orden = self.get_object()
        if request.method == "GET":
            qs = orden.evidencias.select_related("subido_por").all()
            return Response(
                EvidenciaOrdenSerializer(
                    qs, many=True, context={"request": request}
                ).data
            )

        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response({"error": "archivo es requerido (multipart)."}, status=400)
        tipo = request.data.get("tipo", "foto")
        if tipo not in ("foto", "firma", "documento"):
            return Response({"error": "tipo inválido."}, status=400)
        descripcion = request.data.get("descripcion", "")

        ev = EvidenciaOrden.objects.create(
            orden=orden,
            tipo=tipo,
            archivo=archivo,
            descripcion=descripcion,
            subido_por=request.user,
        )
        return Response(
            EvidenciaOrdenSerializer(ev, context={"request": request}).data,
            status=201,
        )


# ---------------------------------------------------------------------
# Endpoint específico para técnicos en campo (móvil)
# ---------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def mis_ordenes(request):
    """
    Devuelve las órdenes asignadas al usuario autenticado (técnico).
    Filtros opcionales: ?estado=...&prioridad=...
    """
    qs = OrdenTrabajo.objects.select_related("instalacion").filter(
        asignado_a=request.user
    )
    estado = request.GET.get("estado")
    prioridad = request.GET.get("prioridad")
    if estado:
        qs = qs.filter(estado=estado)
    if prioridad:
        qs = qs.filter(prioridad=prioridad)

    qs = qs.order_by("-prioridad", "creada_at")
    data = OrdenTrabajoLigeroSerializer(qs, many=True).data
    return Response({"count": len(data), "results": data})
