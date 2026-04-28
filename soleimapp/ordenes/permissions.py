"""Permission classes específicas del flujo de órdenes de trabajo."""

from rest_framework.permissions import BasePermission

from core.models import RolInstalacion


class CanAssignOrden(BasePermission):
    """
    Sólo admin global o un usuario con rol 'admin_empresa' en la instalación
    de la orden puede asignarla / cerrarla.
    """

    message = "Sólo el administrador de empresa puede asignar o cerrar la orden."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.rol == "admin":
            return True
        return RolInstalacion.objects.filter(
            usuario=user,
            instalacion=obj.instalacion,
            rol="admin_empresa",
        ).exists()


class IsAssignedTechnicianOrAdmin(BasePermission):
    """
    Solo el técnico asignado (o un admin global) puede iniciar / completar la orden.
    """

    message = "Sólo el técnico asignado puede modificar el estado operativo."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.rol == "admin":
            return True
        return obj.asignado_a_id == user.idusuario


class CanCancelOrden(BasePermission):
    """
    Cancelan: el creador, admin global, o admin_empresa de la instalación.
    """

    message = "No tienes permiso para cancelar esta orden."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.rol == "admin":
            return True
        if obj.creado_por_id == user.idusuario:
            return True
        return RolInstalacion.objects.filter(
            usuario=user,
            instalacion=obj.instalacion,
            rol="admin_empresa",
        ).exists()
