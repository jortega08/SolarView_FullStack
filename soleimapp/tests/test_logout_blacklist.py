"""
Tests para POST /api/auth/logout/ con SimpleJWT token blacklist.

Regresión: la FK token_blacklist_outstandingtoken.user_id apunta a auth_user
(porque AUTH_USER_MODEL no se declara y el proyecto opera con core.Usuario).
El claim "user_id" del JWT contiene core.Usuario.idusuario, que no existe en
auth_user. usuario.utils.CoreRefreshToken sobrescribe blacklist() para no
poblar user_id en OutstandingToken, evitando el IntegrityError.
"""

import pytest
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken

LOGOUT_URL = "/api/auth/logout/"


def _refresh_for(user):
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    return refresh


@pytest.mark.django_db
def test_logout_blacklistea_refresh_sin_violar_fk_a_auth_user(usuario, api_client):
    refresh = _refresh_for(usuario)

    response = api_client.post(LOGOUT_URL, {"refresh": str(refresh)}, format="json")

    assert response.status_code == 200, response.content
    assert response.data["success"] is True

    jti = refresh["jti"]
    outstanding = OutstandingToken.objects.get(jti=jti)
    # Clave: NO se persiste user_id (la FK apunta a auth_user, donde el
    # idusuario de core.Usuario no existe). Dejarlo NULL es legal y seguro.
    assert outstanding.user_id is None
    assert BlacklistedToken.objects.filter(token=outstanding).exists()


@pytest.mark.django_db
def test_logout_token_invalido_devuelve_400(api_client):
    response = api_client.post(LOGOUT_URL, {"refresh": "no-es-un-token"}, format="json")
    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_logout_sin_refresh_devuelve_400(api_client):
    response = api_client.post(LOGOUT_URL, {}, format="json")
    assert response.status_code == 400
    assert response.data["success"] is False


@pytest.mark.django_db
def test_logout_doble_es_idempotente(usuario, api_client):
    """blacklist() usa get_or_create → segunda llamada con el mismo token
    debe seguir respondiendo 400 (token ya inválido) sin romper la DB."""
    refresh = _refresh_for(usuario)
    first = api_client.post(LOGOUT_URL, {"refresh": str(refresh)}, format="json")
    assert first.status_code == 200

    second = api_client.post(LOGOUT_URL, {"refresh": str(refresh)}, format="json")
    assert second.status_code == 400
    assert OutstandingToken.objects.filter(jti=refresh["jti"]).count() == 1
