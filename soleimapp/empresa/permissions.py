from core.models import RolInstalacion
from usuario.utils import decode_jwt_user

ROLES_ORDENADOS = ["viewer", "operador", "admin_empresa"]


def get_user_from_request(request):
    return decode_jwt_user(request)


def get_instalaciones_for_user(usuario):
    qs = RolInstalacion.objects.select_related("instalacion__empresa")
    if usuario.rol == "admin":
        return qs.all()
    return qs.filter(usuario=usuario)


def check_instalacion_access(usuario, instalacion_id, min_rol=None):
    if usuario.rol == "admin":
        return True

    qs = RolInstalacion.objects.filter(usuario=usuario, instalacion_id=instalacion_id)
    if min_rol:
        min_index = ROLES_ORDENADOS.index(min_rol)
        qs = qs.filter(rol__in=ROLES_ORDENADOS[min_index:])
    return qs.exists()
