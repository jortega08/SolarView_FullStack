"""
Tests para el flujo JWT custom basado en core.Usuario:
- login devuelve access/refresh
- refresh con token valido devuelve nuevo access (sin tocar auth.User)
- refresh con usuario inexistente devuelve 400 controlado
- refresh con usuario inactivo devuelve 400 controlado
- /api/tecnicos/perfiles/ responde 200 a usuario con rol permitido y 403 al que no
"""

import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

REFRESH_URL = "/api/auth/refresh/"
LOGIN_URL = "/api/auth/login/"
PERFILES_URL = "/api/tecnicos/perfiles/"


def _refresh_for(user):
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    return refresh


@pytest.mark.django_db
def test_login_devuelve_tokens(usuario):
    client = APIClient()
    response = client.post(
        LOGIN_URL,
        {"email": usuario.email, "contrasena": "Password1!"},
        format="json",
    )
    assert response.status_code == 200, response.content
    assert response.data["success"] is True
    assert "access" in response.data["tokens"]
    assert "refresh" in response.data["tokens"]


@pytest.mark.django_db
def test_refresh_token_valido_devuelve_nuevo_access(usuario):
    refresh = _refresh_for(usuario)
    client = APIClient()

    response = client.post(REFRESH_URL, {"refresh": str(refresh)}, format="json")

    assert response.status_code == 200, response.content
    assert "access" in response.data
    # El nuevo access lleva los claims del usuario operativo (core.Usuario).
    new_access = AccessToken(response.data["access"])
    assert new_access["user_id"] == usuario.idusuario
    assert new_access["email"] == usuario.email
    assert new_access["rol"] == usuario.rol


@pytest.mark.django_db
def test_refresh_token_invalido_devuelve_400(db):
    client = APIClient()
    response = client.post(REFRESH_URL, {"refresh": "no-es-un-token"}, format="json")
    assert response.status_code == 400
    assert "refresh" in response.data


@pytest.mark.django_db
def test_refresh_con_usuario_inexistente_devuelve_400_controlado(db):
    """El refresh contiene un user_id que no existe — no debe lanzar 500."""
    refresh = RefreshToken()
    refresh["user_id"] = 999_999  # id que no existe en core.Usuario
    refresh["email"] = "ghost@example.com"
    refresh["rol"] = "user"

    client = APIClient()
    response = client.post(REFRESH_URL, {"refresh": str(refresh)}, format="json")

    assert response.status_code == 400, response.content
    assert "refresh" in response.data


@pytest.mark.django_db
def test_refresh_con_usuario_inactivo_devuelve_400_controlado(db):
    from core.models import Usuario

    inactivo = Usuario.objects.create(
        nombre="Inactivo Test",
        email="inactivo@solartest.co",
        contrasena=make_password("Password1!"),
        rol="user",
        is_active=False,
    )
    refresh = _refresh_for(inactivo)

    client = APIClient()
    response = client.post(REFRESH_URL, {"refresh": str(refresh)}, format="json")

    assert response.status_code == 400, response.content
    assert "refresh" in response.data


@pytest.mark.django_db
def test_perfiles_tecnicos_admin_global_devuelve_200(admin_client):
    response = admin_client.get(PERFILES_URL)
    assert response.status_code == 200, response.content


@pytest.mark.django_db
def test_perfiles_tecnicos_usuario_basico_devuelve_200_con_filtro(api_client):
    """
    Un usuario con rol='user' (sin RolInstalacion admin_empresa, sin prestador)
    pasa IsAuthenticated + IsActiveUser. El queryset se filtra a
    `usuario=request.user`, devolviendo lista vacia (200), no 403.
    """
    response = api_client.get(PERFILES_URL)
    assert response.status_code == 200, response.content


@pytest.mark.django_db
def test_perfiles_tecnicos_sin_token_devuelve_401(db):
    response = APIClient().get(PERFILES_URL)
    assert response.status_code == 401, response.content


@pytest.mark.django_db
def test_perfiles_tecnicos_usuario_inactivo_devuelve_403(db):
    """
    Usuario autenticado pero inactivo: IsAuthenticated pasa (Usuario.is_authenticated=True)
    pero IsActiveUser deniega -> 403 PermissionDenied.
    """
    from core.models import Usuario

    inactivo = Usuario.objects.create(
        nombre="Inactivo Tec",
        email="inactivo.tec@solartest.co",
        contrasena=make_password("Password1!"),
        rol="user",
        is_active=False,
    )
    refresh = _refresh_for(inactivo)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    response = client.get(PERFILES_URL)
    assert response.status_code == 403, response.content
