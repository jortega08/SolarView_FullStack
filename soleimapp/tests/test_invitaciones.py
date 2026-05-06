"""
Tests Fase 4A: invitaciones de prestador y registro con código.

Cubre:
- Crear invitación: sólo admin del prestador (es_admin_prestador=True).
- Empleado regular del prestador NO puede crear invitaciones.
- Listado: cada admin sólo ve las suyas (aislamiento por prestador).
- Registro con código: crea Usuario en el MISMO prestador, marca invitación.
- Códigos inválidos / expirados / usados / revocados → 400 controlado.
- Quien crea un PrestadorServicio queda con es_admin_prestador=True.
"""

from datetime import timedelta

import pytest
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

REGISTER_URL = "/api/auth/register/"
REGISTER_CODIGO_URL = "/api/auth/registrar-con-codigo/"
PRESTADORES_URL = "/api/core/prestadores/"
INVITACIONES_URL = "/api/core/invitaciones/"


def _client_for(user):
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _crear_admin_prestador(ciudad=None, email="boss@solar.test", nit="900-FN-1"):
    from core.models import PrestadorServicio, Usuario

    prestador = PrestadorServicio.objects.create(
        nombre=f"Solar Andes {nit}", nit=nit, ciudad=ciudad
    )
    user = Usuario.objects.create(
        nombre="Boss",
        email=email,
        contrasena=make_password("SoleimSecure2026!"),
        rol="user",
        prestador=prestador,
        es_admin_prestador=True,
        is_active=True,
    )
    return user, prestador


# ---------------------------------------------------------------------------
# Marcado de admin al crear prestador
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_register_con_prestador_marca_es_admin_prestador(ciudad):
    response = APIClient().post(
        REGISTER_URL,
        {
            "nombre": "Founder",
            "email": "founder@solar.test",
            "contrasena": "SoleimSecure2026!",
            "prestador_nombre": "Founders SAS",
            "prestador_nit": "900-F-1",
            "prestador_ciudad": ciudad.idciudad,
        },
        format="json",
    )
    assert response.status_code == 201, response.content
    from core.models import Usuario

    usuario = Usuario.objects.get(email="founder@solar.test")
    assert usuario.es_admin_prestador is True


@pytest.mark.django_db
def test_self_service_post_prestador_marca_admin(usuario, ciudad):
    client = _client_for(usuario)
    response = client.post(
        PRESTADORES_URL,
        {"nombre": "Self Service", "nit": "900-S-1", "ciudad": ciudad.idciudad},
        format="json",
    )
    assert response.status_code == 201, response.content
    usuario.refresh_from_db()
    assert usuario.es_admin_prestador is True


# ---------------------------------------------------------------------------
# Crear invitaciones
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_admin_prestador_puede_crear_invitacion(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    client = _client_for(admin)

    response = client.post(
        INVITACIONES_URL,
        {
            "rol": "operador",
            "vigente_hasta": (timezone.now() + timedelta(days=7)).isoformat(),
            "email_destino": "newhire@solar.test",
        },
        format="json",
    )
    assert response.status_code == 201, response.content
    assert len(response.data["codigo"]) > 10
    assert response.data["prestador"] == prestador.idprestador
    assert response.data["vigente"] is True


@pytest.mark.django_db
def test_empleado_no_admin_no_puede_crear_invitacion(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    from core.models import Usuario

    empleado = Usuario.objects.create(
        nombre="Empleado",
        email="emp@solar.test",
        contrasena=make_password("SoleimSecure2026!"),
        rol="user",
        prestador=prestador,
        es_admin_prestador=False,
    )

    client = _client_for(empleado)
    response = client.post(
        INVITACIONES_URL,
        {
            "rol": "viewer",
            "vigente_hasta": (timezone.now() + timedelta(days=1)).isoformat(),
        },
        format="json",
    )
    assert response.status_code == 403, response.content


@pytest.mark.django_db
def test_usuario_sin_prestador_no_puede_crear_invitacion(api_client):
    response = api_client.post(
        INVITACIONES_URL,
        {
            "rol": "viewer",
            "vigente_hasta": (timezone.now() + timedelta(days=1)).isoformat(),
        },
        format="json",
    )
    assert response.status_code == 403, response.content


# ---------------------------------------------------------------------------
# Aislamiento del listado
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_listado_invitaciones_aislado_por_prestador(ciudad):
    admin1, prestador1 = _crear_admin_prestador(ciudad, email="boss1@solar.test", nit="900-FN-A")
    admin2, prestador2 = _crear_admin_prestador(ciudad, email="boss2@solar.test", nit="900-FN-B")

    from core.models import InvitacionPrestador

    InvitacionPrestador.objects.create(
        prestador=prestador1,
        codigo="codigo-de-boss1",
        rol="operador",
        vigente_hasta=timezone.now() + timedelta(days=7),
        creado_por=admin1,
    )
    InvitacionPrestador.objects.create(
        prestador=prestador2,
        codigo="codigo-de-boss2",
        rol="viewer",
        vigente_hasta=timezone.now() + timedelta(days=7),
        creado_por=admin2,
    )

    response = _client_for(admin1).get(INVITACIONES_URL)
    assert response.status_code == 200, response.content
    codigos = [inv["codigo"] for inv in response.data]
    assert "codigo-de-boss1" in codigos
    assert "codigo-de-boss2" not in codigos


# ---------------------------------------------------------------------------
# Canje del código
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_registrar_con_codigo_vincula_a_prestador_existente(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    from core.models import InvitacionPrestador

    invitacion = InvitacionPrestador.objects.create(
        prestador=prestador,
        codigo="join-me-please",
        rol="operador",
        vigente_hasta=timezone.now() + timedelta(days=3),
        creado_por=admin,
    )

    response = APIClient().post(
        REGISTER_CODIGO_URL,
        {
            "nombre": "New Hire",
            "email": "newhire@solar.test",
            "contrasena": "SoleimSecure2026!",
            "codigo": "join-me-please",
        },
        format="json",
    )
    assert response.status_code == 201, response.content
    from core.models import Usuario

    nuevo = Usuario.objects.get(email="newhire@solar.test")
    # Mismo prestador, NO admin del prestador
    assert nuevo.prestador_id == prestador.idprestador
    assert nuevo.es_admin_prestador is False

    invitacion.refresh_from_db()
    assert invitacion.usado_por_id == nuevo.idusuario
    assert invitacion.usado_at is not None


@pytest.mark.django_db
def test_codigo_inexistente_devuelve_400(db):
    response = APIClient().post(
        REGISTER_CODIGO_URL,
        {
            "nombre": "Hacker",
            "email": "hacker@solar.test",
            "contrasena": "SoleimSecure2026!",
            "codigo": "no-existe",
        },
        format="json",
    )
    assert response.status_code == 400, response.content
    from core.models import Usuario

    assert not Usuario.objects.filter(email="hacker@solar.test").exists()


@pytest.mark.django_db
def test_codigo_expirado_devuelve_400(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    from core.models import InvitacionPrestador

    InvitacionPrestador.objects.create(
        prestador=prestador,
        codigo="expirado",
        rol="viewer",
        vigente_hasta=timezone.now() - timedelta(days=1),
        creado_por=admin,
    )
    response = APIClient().post(
        REGISTER_CODIGO_URL,
        {
            "nombre": "Tarde",
            "email": "tarde@solar.test",
            "contrasena": "SoleimSecure2026!",
            "codigo": "expirado",
        },
        format="json",
    )
    assert response.status_code == 400, response.content


@pytest.mark.django_db
def test_codigo_ya_usado_devuelve_400(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    from core.models import InvitacionPrestador, Usuario

    primer_uso = Usuario.objects.create(
        nombre="Primero",
        email="primero@solar.test",
        contrasena=make_password("SoleimSecure2026!"),
        prestador=prestador,
    )
    InvitacionPrestador.objects.create(
        prestador=prestador,
        codigo="usado-ya",
        rol="viewer",
        vigente_hasta=timezone.now() + timedelta(days=7),
        creado_por=admin,
        usado_por=primer_uso,
        usado_at=timezone.now(),
    )
    response = APIClient().post(
        REGISTER_CODIGO_URL,
        {
            "nombre": "Segundo",
            "email": "segundo@solar.test",
            "contrasena": "SoleimSecure2026!",
            "codigo": "usado-ya",
        },
        format="json",
    )
    assert response.status_code == 400, response.content


@pytest.mark.django_db
def test_codigo_revocado_devuelve_400(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    from core.models import InvitacionPrestador

    InvitacionPrestador.objects.create(
        prestador=prestador,
        codigo="revocado",
        rol="viewer",
        vigente_hasta=timezone.now() + timedelta(days=7),
        creado_por=admin,
        revocada=True,
    )
    response = APIClient().post(
        REGISTER_CODIGO_URL,
        {
            "nombre": "X",
            "email": "x@solar.test",
            "contrasena": "SoleimSecure2026!",
            "codigo": "revocado",
        },
        format="json",
    )
    assert response.status_code == 400, response.content


# ---------------------------------------------------------------------------
# Permisos sobre PrestadorServicio (sólo admin del prestador puede editar)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_empleado_no_admin_no_puede_editar_prestador(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    from core.models import Usuario

    empleado = Usuario.objects.create(
        nombre="Emp",
        email="emp@solar.test",
        contrasena=make_password("SoleimSecure2026!"),
        prestador=prestador,
        es_admin_prestador=False,
    )

    client = _client_for(empleado)
    response = client.patch(
        f"{PRESTADORES_URL}{prestador.idprestador}/",
        {"nombre": "Cambiado por empleado"},
        format="json",
    )
    assert response.status_code == 403, response.content


@pytest.mark.django_db
def test_admin_prestador_puede_editar_su_prestador(ciudad):
    admin, prestador = _crear_admin_prestador(ciudad)
    client = _client_for(admin)
    response = client.patch(
        f"{PRESTADORES_URL}{prestador.idprestador}/",
        {"nombre": "Solar Andes Renombrado"},
        format="json",
    )
    assert response.status_code == 200, response.content
    prestador.refresh_from_db()
    assert prestador.nombre == "Solar Andes Renombrado"
