from datetime import timedelta

import pytest
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

CLIENTES_URL = "/api/core/clientes/"
REGISTER_CLIENTE_URL = "/api/auth/registrar-cliente-con-codigo/"


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
def fase4c(db, ciudad):
    from core.models import Empresa, Instalacion, PrestadorServicio

    prestador_a = PrestadorServicio.objects.create(
        nombre="Solar Norte 4C", nit="900-4C-A", ciudad=ciudad
    )
    prestador_b = PrestadorServicio.objects.create(
        nombre="Solar Sur 4C", nit="900-4C-B", ciudad=ciudad
    )
    cliente_a = Empresa.objects.create(
        nombre="Cliente Norte", nit="C-4C-A", sector="Retail", ciudad=ciudad, prestador=prestador_a
    )
    cliente_b = Empresa.objects.create(
        nombre="Cliente Sur", nit="C-4C-B", sector="Salud", ciudad=ciudad, prestador=prestador_b
    )
    inst_a = Instalacion.objects.create(
        nombre="Planta Cliente Norte",
        empresa=cliente_a,
        cliente=cliente_a,
        prestador=prestador_a,
        ciudad=ciudad,
        tipo_sistema="hibrido",
        estado="activa",
        capacidad_panel_kw=10,
        capacidad_bateria_kwh=20,
        direccion="Calle 1",
    )
    inst_b = Instalacion.objects.create(
        nombre="Planta Cliente Sur",
        empresa=cliente_b,
        cliente=cliente_b,
        prestador=prestador_b,
        ciudad=ciudad,
        tipo_sistema="hibrido",
        estado="activa",
        capacidad_panel_kw=10,
        capacidad_bateria_kwh=20,
        direccion="Calle 2",
    )
    admin = _make_user(
        "admin4c@norte.test",
        "Admin Norte",
        prestador=prestador_a,
        es_admin_prestador=True,
    )
    empleado = _make_user(
        "empleado4c@norte.test",
        "Empleado Norte",
        prestador=prestador_a,
        es_admin_prestador=False,
    )
    admin_b = _make_user(
        "admin4c@sur.test",
        "Admin Sur",
        prestador=prestador_b,
        es_admin_prestador=True,
    )
    cliente_user = _make_user(
        "cliente4c@norte.test",
        "Usuario Cliente",
        empresa_cliente=cliente_a,
    )
    return {
        "prestador_a": prestador_a,
        "prestador_b": prestador_b,
        "cliente_a": cliente_a,
        "cliente_b": cliente_b,
        "inst_a": inst_a,
        "inst_b": inst_b,
        "admin": admin,
        "empleado": empleado,
        "admin_b": admin_b,
        "cliente_user": cliente_user,
    }


@pytest.mark.django_db
def test_admin_prestador_crea_empresa_cliente(fase4c, ciudad):
    response = _client_for(fase4c["admin"]).post(
        CLIENTES_URL,
        {
            "nombre": "Nuevo Cliente",
            "nit": "C-4C-NUEVO",
            "sector": "Educacion",
            "ciudad": ciudad.idciudad,
        },
        format="json",
    )

    assert response.status_code == 201, response.content
    assert response.data["prestador"] == fase4c["prestador_a"].idprestador


@pytest.mark.django_db
def test_empleado_y_cliente_no_crean_empresa_cliente(fase4c, ciudad):
    payload = {"nombre": "Bloqueado", "nit": "C-4C-X", "ciudad": ciudad.idciudad}

    empleado = _client_for(fase4c["empleado"]).post(CLIENTES_URL, payload, format="json")
    cliente = _client_for(fase4c["cliente_user"]).post(CLIENTES_URL, payload, format="json")

    assert empleado.status_code == 403, empleado.content
    assert cliente.status_code == 403, cliente.content


@pytest.mark.django_db
def test_admin_lista_solo_clientes_de_su_prestador(fase4c):
    response = _client_for(fase4c["admin"]).get(CLIENTES_URL)

    assert response.status_code == 200, response.content
    nombres = {item["nombre"] for item in response.data}
    assert "Cliente Norte" in nombres
    assert "Cliente Sur" not in nombres


@pytest.mark.django_db
def test_usuario_cliente_no_lista_todos_los_clientes(fase4c):
    response = _client_for(fase4c["cliente_user"]).get(CLIENTES_URL)

    assert response.status_code == 200, response.content
    ids = {item["idempresa"] for item in response.data}
    assert ids == {fase4c["cliente_a"].idempresa}


@pytest.mark.django_db
def test_admin_crea_invitacion_y_cliente_se_registra_con_codigo(fase4c):
    invite = _client_for(fase4c["admin"]).post(
        f"{CLIENTES_URL}{fase4c['cliente_a'].idempresa}/invitaciones/",
        {
            "email_destinatario": "contacto@cliente.test",
            "vigente_hasta": (timezone.now() + timedelta(days=7)).isoformat(),
        },
        format="json",
    )
    assert invite.status_code == 201, invite.content

    response = APIClient().post(
        REGISTER_CLIENTE_URL,
        {
            "nombre": "Contacto Cliente",
            "email": "contacto@cliente.test",
            "contrasena": "SoleimSecure2026!",
            "codigo": invite.data["codigo"],
        },
        format="json",
    )

    assert response.status_code == 201, response.content
    from core.models import InvitacionCliente, Usuario

    usuario = Usuario.objects.get(email="contacto@cliente.test")
    assert usuario.empresa_cliente_id == fase4c["cliente_a"].idempresa
    assert usuario.prestador_id is None
    assert usuario.es_admin_prestador is False
    assert response.data["user"]["tipo_usuario"] == "cliente"

    invitacion = InvitacionCliente.objects.get(idinvitacion=invite.data["idinvitacion"])
    assert invitacion.usado_por_id == usuario.idusuario
    assert invitacion.fecha_uso is not None


@pytest.mark.django_db
def test_codigo_cliente_no_se_reutiliza_y_no_sirve_para_empleado(fase4c):
    invite = _client_for(fase4c["admin"]).post(
        f"{CLIENTES_URL}{fase4c['cliente_a'].idempresa}/invitaciones/",
        {"vigente_hasta": (timezone.now() + timedelta(days=7)).isoformat()},
        format="json",
    )
    assert invite.status_code == 201, invite.content

    first = APIClient().post(
        REGISTER_CLIENTE_URL,
        {
            "nombre": "Primero",
            "email": "primero4c@test.co",
            "contrasena": "SoleimSecure2026!",
            "codigo": invite.data["codigo"],
        },
        format="json",
    )
    reused = APIClient().post(
        REGISTER_CLIENTE_URL,
        {
            "nombre": "Segundo",
            "email": "segundo4c@test.co",
            "contrasena": "SoleimSecure2026!",
            "codigo": invite.data["codigo"],
        },
        format="json",
    )
    employee_flow = APIClient().post(
        "/api/auth/registrar-con-codigo/",
        {
            "nombre": "Empleado Incorrecto",
            "email": "empleado-incorrecto@test.co",
            "contrasena": "SoleimSecure2026!",
            "codigo": invite.data["codigo"],
        },
        format="json",
    )

    assert first.status_code == 201, first.content
    assert reused.status_code == 400, reused.content
    assert employee_flow.status_code == 400, employee_flow.content


@pytest.mark.django_db
def test_codigo_expirado_y_revocado_fallan(fase4c):
    from core.models import InvitacionCliente

    expirada = InvitacionCliente.objects.create(
        codigo="cliente-expirada",
        prestador=fase4c["prestador_a"],
        empresa_cliente=fase4c["cliente_a"],
        vigente_hasta=timezone.now() - timedelta(days=1),
        creada_por=fase4c["admin"],
    )
    revocada = InvitacionCliente.objects.create(
        codigo="cliente-revocada",
        prestador=fase4c["prestador_a"],
        empresa_cliente=fase4c["cliente_a"],
        vigente_hasta=timezone.now() + timedelta(days=1),
        creada_por=fase4c["admin"],
        revocada=True,
    )

    for invitacion in (expirada, revocada):
        response = APIClient().post(
            REGISTER_CLIENTE_URL,
            {
                "nombre": "Cliente Fallido",
                "email": f"{invitacion.codigo}@test.co",
                "contrasena": "SoleimSecure2026!",
                "codigo": invitacion.codigo,
            },
            format="json",
        )
        assert response.status_code == 400, response.content


@pytest.mark.django_db
def test_admin_no_administra_cliente_de_otro_prestador(fase4c):
    response = _client_for(fase4c["admin"]).post(
        f"{CLIENTES_URL}{fase4c['cliente_b'].idempresa}/invitaciones/",
        {"vigente_hasta": (timezone.now() + timedelta(days=7)).isoformat()},
        format="json",
    )

    assert response.status_code == 404, response.content


@pytest.mark.django_db
def test_admin_lista_y_quita_acceso_a_usuario_cliente_propio(fase4c):
    client = _client_for(fase4c["admin"])

    listado = client.get(f"{CLIENTES_URL}{fase4c['cliente_a'].idempresa}/usuarios/")
    assert listado.status_code == 200, listado.content
    emails = {item["email"] for item in listado.data}
    assert "cliente4c@norte.test" in emails
    assert "empleado4c@norte.test" not in emails

    quitar = client.post(
        f"{CLIENTES_URL}{fase4c['cliente_a'].idempresa}/usuarios/"
        f"{fase4c['cliente_user'].idusuario}/quitar-acceso/"
    )
    assert quitar.status_code == 200, quitar.content
    fase4c["cliente_user"].refresh_from_db()
    assert fase4c["cliente_user"].empresa_cliente_id is None


@pytest.mark.django_db
def test_admin_no_quita_usuario_cliente_de_otro_prestador(fase4c):
    otro_usuario = _make_user(
        "cliente4c@sur.test",
        "Cliente Sur",
        empresa_cliente=fase4c["cliente_b"],
    )

    response = _client_for(fase4c["admin"]).post(
        f"{CLIENTES_URL}{fase4c['cliente_b'].idempresa}/usuarios/"
        f"{otro_usuario.idusuario}/quitar-acceso/"
    )

    assert response.status_code == 404, response.content
    otro_usuario.refresh_from_db()
    assert otro_usuario.empresa_cliente_id == fase4c["cliente_b"].idempresa


@pytest.mark.django_db
def test_cliente_solo_ve_instalaciones_de_su_empresa(fase4c):
    response = _client_for(fase4c["cliente_user"]).get("/api/core/instalaciones/")

    assert response.status_code == 200, response.content
    nombres = {item["nombre"] for item in response.data}
    assert nombres == {"Planta Cliente Norte"}
