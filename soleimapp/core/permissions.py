"""
Permission classes reutilizables para la plataforma Soleim.

Jerarquía de roles por instalación (de menor a mayor):
  viewer < operador < admin_empresa

Uso típico en un ViewSet:
    permission_classes = [IsAuthenticated, IsActiveUser]

Para proteger una acción por rol mínimo en la instalación:
    permission_classes = [IsAuthenticated, IsActiveUser, InstalacionRolePermission]
    required_rol = 'operador'   # atributo de clase en la View
"""
from rest_framework.permissions import BasePermission

from core.models import RolInstalacion

# Orden de roles (mayor índice = mayor privilegio)
ROLE_ORDER = {'viewer': 0, 'operador': 1, 'admin_empresa': 2}


class IsActiveUser(BasePermission):
    """
    Permite el acceso sólo si el usuario tiene is_active=True y no está bloqueado
    (locked_until en el futuro).
    """
    message = 'Cuenta inactiva o temporalmente bloqueada.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if hasattr(user, 'is_active') and not user.is_active:
            return False
        if hasattr(user, 'is_locked') and user.is_locked():
            return False
        return True


class IsAdminGlobal(BasePermission):
    """
    Permite el acceso sólo a usuarios con rol='admin' (superusuarios de la plataforma).
    Combinar con IsAuthenticated e IsActiveUser.
    """
    message = 'Se requiere rol de administrador global.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'rol', None) == 'admin'
        )


class IsOperadorOrAdmin(BasePermission):
    """
    Permite el acceso a administradores globales o a usuarios con rol
    'operador' / 'admin_empresa' en al menos una instalación.
    """
    message = 'Se requiere rol de operador o superior.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.rol == 'admin':
            return True
        return RolInstalacion.objects.filter(
            usuario=user,
            rol__in=['operador', 'admin_empresa'],
        ).exists()


class InstalacionRolePermission(BasePermission):
    """
    A nivel de objeto: comprueba que request.user tiene al menos `required_rol`
    en la instalación asociada al objeto.

    La vista debe definir el atributo de clase:
        required_rol = 'operador'   # default: 'viewer'

    El objeto debe exponer uno de:
        obj.idinstalacion   (si el objeto IS la instalación)
        obj.instalacion_id  (FK estándar de Django)
        obj.instalacion.idinstalacion
    """
    message = 'No tienes el rol suficiente en esta instalación.'

    def _get_instalacion_id(self, obj):
        if hasattr(obj, 'idinstalacion'):
            return obj.idinstalacion
        if hasattr(obj, 'instalacion_id') and obj.instalacion_id:
            return obj.instalacion_id
        instalacion = getattr(obj, 'instalacion', None)
        if instalacion:
            return getattr(instalacion, 'idinstalacion', None)
        return None

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.rol == 'admin':
            return True

        instalacion_id = self._get_instalacion_id(obj)
        if not instalacion_id:
            return False

        required_rol = getattr(view, 'required_rol', 'viewer')
        min_index = ROLE_ORDER.get(required_rol, 0)
        allowed_roles = [r for r, idx in ROLE_ORDER.items() if idx >= min_index]

        return RolInstalacion.objects.filter(
            usuario=user,
            instalacion_id=instalacion_id,
            rol__in=allowed_roles,
        ).exists()
