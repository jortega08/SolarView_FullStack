from datetime import timedelta

import pytest
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

MI_PRESTADOR_URL = "/api/core/mi-prestador/"
EQUIPO_URL = "/api/core/equipo-prestador/"
INVITACIONES_URL = "/api/core/invitaciones/"


def _client_for(user):
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _make_user(email, nombre, **kwargs):
    from core.models import Usuario

    return Usuario.objects.create(
        nombre=nombre,
        email=email,
        contrasena=make_password("SoleimSecure2026!"),
        rol=kwargs.pop("rol", "user"),
        is_active=True,
        **kwargs,
    )


@pytest.fixture
def prestador_4b(db, ciudad):
    from core.models import PrestadorServicio

    prestador_a = PrestadorServicio.objects.create(
        nombre="Solar Norte SAS", nit="900-4B-A", ciudad=ciudad
    )
    prestador_b = PrestadorServicio.objects.create(
        nombre="Solar Sur SAS", nit="900-4B-B", ciudad=ciudad
    )
    admin = _make_user(
        "admin4b@solar.test",
        "Admin Prestador",
        prestador=prestador_a,
        es_admin_prestador=True,
    )
    empleado = _make_user(
        "empleado4b@solar.test",
        "Empleado Prestador",
        prestador=prestador_a,
        es_admin_prestador=False,
    )
    otro = _make_user(
        "otro4b@solar.test",
        "Otro Prestador",
        prestador=prestador_b,
        es_admin_prestador=False,
    )
    sin_prestador = _make_user("sinprestador4b@solar.test", "Sin Prestador")
    return {
        "prestador_a": prestador_a,
        "prestador_b": prestador_b,
        "admin": admin,
        "empleado": empleado,
        "otro": otro,
        "sin_prestador": sin_prestador,
    }


@pytest.mark.django_db
def test_admin_puede_ver_su_prestador(prestador_4b):
    response = _client_for(prestador_4b["admin"]).get(MI_PRESTADOR_URL)

    assert response.status_code == 200, response.content
    assert response.data["idprestador"] == prestador_4b["prestador_a"].idprestador
    assert response.data["nombre"] == "Solar Norte SAS"


@pytest.mark.django_db
def test_empleado_puede_ver_su_prestador(prestador_4b):
    response = _client_for(prestador_4b["empleado"]).get(MI_PRESTADOR_URL)

    assert response.status_code == 200, response.content
    assert response.data["idprestador"] == prestador_4b["prestador_a"].idprestador


@pytest.mark.django_db
def test_admin_puede_editar_su_prestador(prestador_4b, ciudad):
    response = _client_for(prestador_4b["admin"]).patch(
        MI_PRESTADOR_URL,
        {
            "nombre": "Solar Norte Renovado",
            "nit": "900-4B-A2",
            "ciudad": ciudad.idciudad,
        },
        format="json",
    )

    assert response.status_code == 200, response.content
    prestador_4b["prestador_a"].refresh_from_db()
    assert prestador_4b["prestador_a"].nombre == "Solar Norte Renovado"
    assert prestador_4b["prestador_a"].nit == "900-4B-A2"


@pytest.mark.django_db
def test_empleado_no_admin_no_puede_editar_su_prestador(prestador_4b):
    response = _client_for(prestador_4b["empleado"]).patch(
        MI_PRESTADOR_URL,
        {"nombre": "Cambio no permitido"},
        format="json",
    )

    assert response.status_code == 403, response.content


@pytest.mark.django_db
def test_usuario_sin_prestador_recibe_error_controlado(prestador_4b):
    response = _client_for(prestador_4b["sin_prestador"]).get(MI_PRESTADOR_URL)

    assert response.status_code == 404, response.content
    assert "prestador" in response.data["detail"].lower()


@pytest.mark.django_db
def test_admin_lista_solo_usuarios_de_su_prestador(prestador_4b):
    response = _client_for(prestador_4b["admin"]).get(EQUIPO_URL)

    assert response.status_code == 200, response.content
    emails = {usuario["email"] for usuario in response.data}
    assert {"admin4b@solar.test", "empleado4b@solar.test"} <= emails
    assert "otro4b@solar.test" not in emails


@pytest.mark.django_db
def test_admin_puede_quitar_acceso_a_empleado_de_su_prestador(prestador_4b):
    empleado = prestador_4b["empleado"]
    response = _client_for(prestador_4b["admin"]).post(
        f"{EQUIPO_URL}{empleado.idusuario}/quitar-acceso/"
    )

    assert response.status_code == 200, response.content
    empleado.refresh_from_db()
    assert empleado.prestador_id is None
    assert empleado.es_admin_prestador is False


@pytest.mark.django_db
def test_admin_no_puede_quitarse_acceso_a_si_mismo(prestador_4b):
    admin = prestador_4b["admin"]
    response = _client_for(admin).post(f"{EQUIPO_URL}{admin.idusuario}/quitar-acceso/")

    assert response.status_code == 400, response.content
    admin.refresh_from_db()
    assert admin.prestador_id == prestador_4b["prestador_a"].idprestador


@pytest.mark.django_db
def test_admin_no_puede_quitar_acceso_a_usuario_de_otro_prestador(prestador_4b):
    otro = prestador_4b["otro"]
    response = _client_for(prestador_4b["admin"]).post(
        f"{EQUIPO_URL}{otro.idusuario}/quitar-acceso/"
    )

    assert response.status_code == 404, response.content
    otro.refresh_from_db()
    assert otro.prestador_id == prestador_4b["prestador_b"].idprestador


@pytest.mark.django_db
def test_empleado_no_admin_no_puede_quitar_accesos(prestador_4b):
    response = _client_for(prestador_4b["empleado"]).post(
        f"{EQUIPO_URL}{prestador_4b['admin'].idusuario}/quitar-acceso/"
    )

    assert response.status_code == 403, response.content


@pytest.mark.django_db
def test_admin_puede_listar_generar_y_revocar_invitaciones(prestador_4b):
    admin = prestador_4b["admin"]
    client = _client_for(admin)

    create = client.post(
        INVITACIONES_URL,
        {
            "rol": "operador",
            "email_destino": "nuevo4b@solar.test",
            "vigente_hasta": (timezone.now() + timedelta(days=5)).isoformat(),
        },
        format="json",
    )
    assert create.status_code == 201, create.content
    assert create.data["prestador"] == prestador_4b["prestador_a"].idprestador

    listado = client.get(INVITACIONES_URL)
    assert listado.status_code == 200, listado.content
    ids = {item["idinvitacion"] for item in listado.data}
    assert create.data["idinvitacion"] in ids

    revoke = client.delete(f"{INVITACIONES_URL}{create.data['idinvitacion']}/")
    assert revoke.status_code == 204, revoke.content

    from core.models import InvitacionPrestador

    invitacion = InvitacionPrestador.objects.get(
        idinvitacion=create.data["idinvitacion"]
    )
    assert invitacion.revocada is True
