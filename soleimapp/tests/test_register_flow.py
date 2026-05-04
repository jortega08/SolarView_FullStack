"""
Tests del flujo de registro: usuario -> prestador -> empresa cliente -> instalacion.

Escenarios:
- registro de usuario con prestador embebido
- registro de prestador desde un usuario sin prestador (auto-link)
- creacion de Empresa desde un prestador
- creacion de Instalacion por un usuario prestador (sin enviar prestador en payload)
- usuario sin rol no puede crear instalacion (403 esperado)
"""

import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


REGISTER_URL = "/api/auth/register/"
EMPRESAS_URL = "/api/core/empresas/"
PRESTADORES_URL = "/api/core/prestadores/"
INSTALACIONES_URL = "/api/core/instalaciones/"


def _client_for(user):
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
def test_register_con_prestador_vincula_usuario(ciudad):
    response = APIClient().post(
        REGISTER_URL,
        {
            "nombre": "Founder Solar",
            "email": "founder@solar.test",
            "contrasena": "SoleimSecure2026!",
            "prestador_nombre": "Solar Andes SAS",
            "prestador_nit": "900-555-1",
            "prestador_ciudad": ciudad.idciudad,
        },
        format="json",
    )
    assert response.status_code == 201, response.content
    assert response.data["success"] is True

    from core.models import PrestadorServicio, Usuario

    usuario = Usuario.objects.get(email="founder@solar.test")
    assert usuario.prestador_id is not None
    prestador = PrestadorServicio.objects.get(idprestador=usuario.prestador_id)
    assert prestador.nombre == "Solar Andes SAS"
    assert prestador.nit == "900-555-1"
    assert prestador.ciudad_id == ciudad.idciudad


@pytest.mark.django_db
def test_register_sin_prestador_sigue_funcionando():
    response = APIClient().post(
        REGISTER_URL,
        {
            "nombre": "Solo User",
            "email": "solo@user.test",
            "contrasena": "SoleimSecure2026!",
        },
        format="json",
    )
    assert response.status_code == 201, response.content

    from core.models import Usuario

    usuario = Usuario.objects.get(email="solo@user.test")
    assert usuario.prestador_id is None


@pytest.mark.django_db
def test_register_prestador_nit_duplicado_devuelve_400(ciudad):
    from core.models import PrestadorServicio

    PrestadorServicio.objects.create(nombre="Existing", nit="900-DUP-9")

    response = APIClient().post(
        REGISTER_URL,
        {
            "nombre": "Other",
            "email": "other@solar.test",
            "contrasena": "SoleimSecure2026!",
            "prestador_nombre": "Otra SAS",
            "prestador_nit": "900-DUP-9",
        },
        format="json",
    )
    assert response.status_code == 400, response.content
    from core.models import Usuario

    assert not Usuario.objects.filter(email="other@solar.test").exists()


@pytest.mark.django_db
def test_usuario_sin_prestador_puede_crear_y_se_autolinkea(usuario, ciudad):
    client = _client_for(usuario)
    response = client.post(
        PRESTADORES_URL,
        {
            "nombre": "Self Service Solar",
            "nit": "900-SELF-1",
            "ciudad": ciudad.idciudad,
            "activo": True,
        },
        format="json",
    )
    assert response.status_code == 201, response.content

    from core.models import Usuario

    usuario.refresh_from_db()
    assert usuario.prestador_id == response.data["idprestador"]


@pytest.mark.django_db
def test_usuario_con_prestador_no_puede_crear_otro(usuario, ciudad):
    from core.models import PrestadorServicio

    existing = PrestadorServicio.objects.create(nombre="Existing", nit="900-EX-1")
    usuario.prestador = existing
    usuario.save(update_fields=["prestador"])

    client = _client_for(usuario)
    response = client.post(
        PRESTADORES_URL,
        {"nombre": "Otro", "nit": "900-EX-2", "ciudad": ciudad.idciudad},
        format="json",
    )
    assert response.status_code == 403, response.content


@pytest.mark.django_db
def test_prestador_puede_crear_empresa_cliente(usuario, ciudad):
    from core.models import PrestadorServicio

    usuario.prestador = PrestadorServicio.objects.create(
        nombre="Provider", nit="900-PRV-1"
    )
    usuario.save(update_fields=["prestador"])

    client = _client_for(usuario)
    response = client.post(
        EMPRESAS_URL,
        {
            "nombre": "Cliente Industrial SA",
            "nit": "800-555-2",
            "sector": "Industria",
            "ciudad": ciudad.idciudad,
        },
        format="json",
    )
    assert response.status_code == 201, response.content
    assert response.data["nombre"] == "Cliente Industrial SA"


@pytest.mark.django_db
def test_usuario_basico_no_puede_crear_empresa(api_client):
    """Sin prestador y sin admin_empresa role -> 403 al crear empresa."""
    response = api_client.post(
        EMPRESAS_URL,
        {"nombre": "X", "nit": "800-X-1", "sector": "Otros"},
        format="json",
    )
    assert response.status_code == 403, response.content


@pytest.mark.django_db
def test_prestador_crea_instalacion_para_su_cliente(usuario, ciudad, empresa):
    from core.models import PrestadorServicio

    usuario.prestador = PrestadorServicio.objects.create(
        nombre="Provider Inst", nit="900-INST-1"
    )
    usuario.save(update_fields=["prestador"])

    client = _client_for(usuario)
    response = client.post(
        INSTALACIONES_URL,
        {
            "empresa": empresa.idempresa,
            "nombre": "Planta Test",
            "ciudad": ciudad.idciudad,
            "tipo_sistema": "hibrido",
            "capacidad_panel_kw": 12.5,
            "capacidad_bateria_kwh": 24.0,
            "estado": "activa",
        },
        format="json",
    )
    assert response.status_code == 201, response.content
    assert response.data["prestador"] == usuario.prestador_id
    assert response.data["empresa"] == empresa.idempresa


@pytest.mark.django_db
def test_usuario_sin_prestador_ni_admin_no_puede_crear_instalacion(api_client, empresa):
    response = api_client.post(
        INSTALACIONES_URL,
        {
            "empresa": empresa.idempresa,
            "nombre": "X",
            "tipo_sistema": "hibrido",
            "estado": "activa",
        },
        format="json",
    )
    assert response.status_code == 403, response.content
