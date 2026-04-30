from django.db.models import Q

from core.models import Empresa, Instalacion, PrestadorServicio, RolInstalacion

ROLE_ORDER = {"viewer": 0, "operador": 1, "admin_empresa": 2}


def _authenticated(user):
    return bool(user and getattr(user, "is_authenticated", False))


def get_user_installation_queryset(user):
    """
    Installations visible to a user across the new provider/client model and
    the legacy RolInstalacion mechanism.
    """
    qs = Instalacion.objects.select_related("empresa", "cliente", "prestador")
    if not _authenticated(user):
        return qs.none()
    if getattr(user, "rol", None) == "admin":
        return qs.all()

    scope = Q(roles__usuario=user)

    prestador_id = getattr(user, "prestador_id", None)
    if prestador_id:
        scope |= Q(prestador_id=prestador_id)

    empresa_cliente_id = getattr(user, "empresa_cliente_id", None)
    if empresa_cliente_id:
        scope |= Q(cliente_id=empresa_cliente_id) | Q(empresa_id=empresa_cliente_id)

    return qs.filter(scope).distinct()


def get_user_client_queryset(user):
    qs = Empresa.objects.select_related("ciudad")
    if not _authenticated(user):
        return qs.none()
    if getattr(user, "rol", None) == "admin":
        return qs.all()

    visible = get_user_installation_queryset(user)
    cliente_ids = visible.filter(cliente_id__isnull=False).values_list(
        "cliente_id", flat=True
    )
    legacy_ids = visible.filter(cliente_id__isnull=True).values_list(
        "empresa_id", flat=True
    )
    scope = Q(idempresa__in=cliente_ids) | Q(idempresa__in=legacy_ids)

    empresa_cliente_id = getattr(user, "empresa_cliente_id", None)
    if empresa_cliente_id:
        scope |= Q(idempresa=empresa_cliente_id)

    return qs.filter(scope).distinct()


def get_user_provider_queryset(user):
    qs = PrestadorServicio.objects.select_related("ciudad")
    if not _authenticated(user):
        return qs.none()
    if getattr(user, "rol", None) == "admin":
        return qs.all()

    scope = None
    prestador_id = getattr(user, "prestador_id", None)
    if prestador_id:
        scope = Q(idprestador=prestador_id)

    visible_provider_ids = (
        get_user_installation_queryset(user)
        .filter(prestador_id__isnull=False)
        .values_list("prestador_id", flat=True)
    )
    provider_scope = Q(idprestador__in=visible_provider_ids)
    scope = provider_scope if scope is None else scope | provider_scope
    return qs.filter(scope).distinct() if scope is not None else qs.none()


def user_can_access_installation(user, installation_or_id):
    if not _authenticated(user):
        return False
    if getattr(user, "rol", None) == "admin":
        return True
    installation_id = getattr(installation_or_id, "idinstalacion", installation_or_id)
    return (
        get_user_installation_queryset(user)
        .filter(idinstalacion=installation_id)
        .exists()
    )


def user_can_access_client(user, empresa_or_id):
    if not _authenticated(user):
        return False
    if getattr(user, "rol", None) == "admin":
        return True
    empresa_id = getattr(empresa_or_id, "idempresa", empresa_or_id)
    return get_user_client_queryset(user).filter(idempresa=empresa_id).exists()


def user_can_access_provider(user, prestador_or_id):
    if not _authenticated(user):
        return False
    if getattr(user, "rol", None) == "admin":
        return True
    prestador_id = getattr(prestador_or_id, "idprestador", prestador_or_id)
    return get_user_provider_queryset(user).filter(idprestador=prestador_id).exists()


def user_has_installation_role(user, installation_or_id, min_rol="viewer"):
    if not _authenticated(user):
        return False
    if getattr(user, "rol", None) == "admin":
        return True

    installation_id = getattr(installation_or_id, "idinstalacion", installation_or_id)
    min_index = ROLE_ORDER.get(min_rol, 0)
    allowed_roles = [role for role, index in ROLE_ORDER.items() if index >= min_index]
    return RolInstalacion.objects.filter(
        usuario=user,
        instalacion_id=installation_id,
        rol__in=allowed_roles,
    ).exists()
