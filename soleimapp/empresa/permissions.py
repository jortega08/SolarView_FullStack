from core.access import get_user_installation_queryset, user_can_access_installation
from core.models import RolInstalacion
from usuario.utils import decode_jwt_user

ROLES_ORDENADOS = ["viewer", "operador", "admin_empresa"]


def get_user_from_request(request):
    return decode_jwt_user(request)


def get_instalaciones_for_user(usuario):
    return get_user_installation_queryset(usuario)


def check_instalacion_access(usuario, instalacion_id, min_rol=None):
    if usuario.rol == "admin":
        return True

    if min_rol is None:
        return user_can_access_installation(usuario, instalacion_id)

    qs = RolInstalacion.objects.filter(usuario=usuario, instalacion_id=instalacion_id)
    min_index = ROLES_ORDENADOS.index(min_rol)
    qs = qs.filter(rol__in=ROLES_ORDENADOS[min_index:])
    return qs.exists()
