import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


def client_for(user):
    client = APIClient()
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def make_user(email, nombre, **kwargs):
    from core.models import Usuario

    return Usuario.objects.create(
        nombre=nombre,
        email=email,
        contrasena=make_password("Password1!"),
        rol=kwargs.pop("rol", "user"),
        is_active=True,
        **kwargs,
    )


def make_empresa(nombre, nit, ciudad):
    from core.models import Empresa

    return Empresa.objects.create(
        nombre=nombre,
        nit=nit,
        ciudad=ciudad,
        sector="Servicios",
    )


def make_instalacion(nombre, cliente, prestador, ciudad):
    from core.models import Instalacion

    return Instalacion.objects.create(
        nombre=nombre,
        empresa=cliente,
        cliente=cliente,
        prestador=prestador,
        ciudad=ciudad,
        tipo_sistema="hibrido",
        estado="activa",
        capacidad_panel_kw=10.0,
        capacidad_bateria_kwh=20.0,
        direccion="Calle 1",
    )


@pytest.fixture
def prestador_scope(db, ciudad):
    from core.models import PrestadorServicio

    prestador_a = PrestadorServicio.objects.create(
        nombre="Soluciones Solares SAS", nit="P-A", ciudad=ciudad
    )
    prestador_b = PrestadorServicio.objects.create(
        nombre="Energia Andina SAS", nit="P-B", ciudad=ciudad
    )
    cliente_1 = make_empresa("Alcaldia de Villavicencio", "C-1", ciudad)
    cliente_2 = make_empresa("Hospital Regional", "C-2", ciudad)
    cliente_3 = make_empresa("Colegio San Jose", "C-3", ciudad)
    inst_1 = make_instalacion("Torre Ingenieria", cliente_1, prestador_a, ciudad)
    inst_2 = make_instalacion("Cubierta Hospital", cliente_2, prestador_a, ciudad)
    inst_3 = make_instalacion("Colegio Principal", cliente_3, prestador_b, ciudad)
    return {
        "prestador_a": prestador_a,
        "prestador_b": prestador_b,
        "cliente_1": cliente_1,
        "cliente_2": cliente_2,
        "cliente_3": cliente_3,
        "inst_1": inst_1,
        "inst_2": inst_2,
        "inst_3": inst_3,
    }


@pytest.mark.django_db
def test_provider_panel_spans_its_clients_only(prestador_scope):
    user = make_user(
        "ops@soluciones.test",
        "Operador Soluciones",
        prestador=prestador_scope["prestador_a"],
    )

    resp = client_for(user).get("/api/empresa/panel/")

    assert resp.status_code == 200
    names = {item["nombre"] for item in resp.json()["instalaciones"]}
    assert {"Torre Ingenieria", "Cubierta Hospital"} <= names
    assert "Colegio Principal" not in names


@pytest.mark.django_db
def test_client_user_sees_only_its_alerts(prestador_scope):
    from alerta.models import Alerta, TipoAlerta

    tipo = TipoAlerta.objects.create(nombre="Test", descripcion="Test")
    Alerta.objects.create(
        tipoalerta=tipo,
        instalacion=prestador_scope["inst_1"],
        mensaje="Alerta alcaldia",
    )
    Alerta.objects.create(
        tipoalerta=tipo,
        instalacion=prestador_scope["inst_2"],
        mensaje="Alerta hospital",
    )
    user = make_user(
        "cliente@alcaldia.test",
        "Cliente Alcaldia",
        empresa_cliente=prestador_scope["cliente_1"],
    )

    resp = client_for(user).get("/api/alertas/alertas/")

    assert resp.status_code == 200
    messages = {item["mensaje"] for item in resp.json()}
    assert messages == {"Alerta alcaldia"}


@pytest.mark.django_db
def test_comparativa_empresa_rejects_out_of_scope_client(prestador_scope):
    user = make_user(
        "ops@soluciones.test",
        "Operador Soluciones",
        prestador=prestador_scope["prestador_a"],
    )

    resp = client_for(user).get(
        "/api/analitica/comparativa/",
        {"empresa_id": prestador_scope["cliente_3"].idempresa},
    )

    assert resp.status_code == 403


@pytest.mark.django_db
def test_comparativa_cache_is_user_scoped(prestador_scope):
    from core.models import RolInstalacion
    from telemetria.models import Consumo

    allowed = make_user("viewer1@test.co", "Viewer Uno")
    blocked = make_user("viewer2@test.co", "Viewer Dos")
    RolInstalacion.objects.create(
        usuario=allowed,
        instalacion=prestador_scope["inst_1"],
        rol="viewer",
    )
    Consumo.objects.create(
        instalacion=prestador_scope["inst_1"],
        energia_consumida=10,
        potencia=1,
        fuente="solar",
        costo=100,
    )

    first = client_for(allowed).get(
        "/api/analitica/comparativa/",
        {"empresa_id": prestador_scope["cliente_1"].idempresa},
    )
    second = client_for(blocked).get(
        "/api/analitica/comparativa/",
        {"empresa_id": prestador_scope["cliente_1"].idempresa},
    )

    assert first.status_code == 200
    assert second.status_code == 403


@pytest.mark.django_db
def test_technicians_are_scoped_by_provider(prestador_scope):
    from tecnicos.models import PerfilTecnico

    tech_a = make_user("tech-a@test.co", "Tecnico A")
    tech_b = make_user("tech-b@test.co", "Tecnico B")
    PerfilTecnico.objects.create(
        usuario=tech_a,
        empresa=prestador_scope["cliente_1"],
        prestador=prestador_scope["prestador_a"],
        cedula="TA",
    )
    PerfilTecnico.objects.create(
        usuario=tech_b,
        empresa=prestador_scope["cliente_3"],
        prestador=prestador_scope["prestador_b"],
        cedula="TB",
    )
    user = make_user(
        "admin-a@test.co",
        "Admin Prestador A",
        prestador=prestador_scope["prestador_a"],
    )

    resp = client_for(user).get("/api/tecnicos/perfiles/")

    assert resp.status_code == 200
    names = {item["usuario_nombre"] for item in resp.json()["results"]}
    assert "Tecnico A" in names
    assert "Tecnico B" not in names


@pytest.mark.django_db
def test_access_helpers_cover_provider_client_role_and_admin(prestador_scope):
    from core.access import (
        get_user_client_queryset,
        get_user_installation_queryset,
        get_user_provider_queryset,
        user_can_access_client,
        user_can_access_installation,
        user_can_access_provider,
        user_has_installation_role,
    )
    from core.models import RolInstalacion

    provider_user = make_user(
        "provider@test.co",
        "Provider",
        prestador=prestador_scope["prestador_a"],
    )
    client_user = make_user(
        "client@test.co",
        "Client",
        empresa_cliente=prestador_scope["cliente_1"],
    )
    role_user = make_user("role@test.co", "Role User")
    admin = make_user("admin@test.co", "Admin", rol="admin")
    RolInstalacion.objects.create(
        usuario=role_user,
        instalacion=prestador_scope["inst_2"],
        rol="operador",
    )

    assert set(
        get_user_installation_queryset(provider_user).values_list("nombre", flat=True)
    ) == {"Torre Ingenieria", "Cubierta Hospital"}
    assert list(
        get_user_installation_queryset(client_user).values_list("nombre", flat=True)
    ) == ["Torre Ingenieria"]
    assert list(
        get_user_installation_queryset(role_user).values_list("nombre", flat=True)
    ) == ["Cubierta Hospital"]
    assert get_user_installation_queryset(admin).count() == 3
    assert get_user_installation_queryset(None).count() == 0

    assert user_can_access_installation(provider_user, prestador_scope["inst_1"])
    assert not user_can_access_installation(provider_user, prestador_scope["inst_3"])
    assert user_can_access_client(client_user, prestador_scope["cliente_1"])
    assert not user_can_access_client(client_user, prestador_scope["cliente_2"])
    assert user_can_access_provider(provider_user, prestador_scope["prestador_a"])
    assert not user_can_access_provider(provider_user, prestador_scope["prestador_b"])
    assert user_has_installation_role(role_user, prestador_scope["inst_2"], "viewer")
    assert user_has_installation_role(role_user, prestador_scope["inst_2"], "operador")
    assert not user_has_installation_role(
        role_user, prestador_scope["inst_2"], "admin_empresa"
    )

    assert {c.nombre for c in get_user_client_queryset(provider_user)} == {
        "Alcaldia de Villavicencio",
        "Hospital Regional",
    }
    assert {p.nombre for p in get_user_provider_queryset(provider_user)} == {
        "Soluciones Solares SAS"
    }


@pytest.mark.django_db
def test_provider_create_installation_sets_provider_and_client(prestador_scope, ciudad):
    user = make_user(
        "creator@soluciones.test",
        "Creator",
        prestador=prestador_scope["prestador_a"],
    )
    payload = {
        "empresa": prestador_scope["cliente_2"].idempresa,
        "nombre": "Nueva Sede Hospital",
        "direccion": "Calle 99",
        "ciudad": ciudad.idciudad,
        "tipo_sistema": "hibrido",
        "capacidad_panel_kw": 12,
        "capacidad_bateria_kwh": 24,
        "estado": "activa",
    }

    resp = client_for(user).post("/api/core/instalaciones/", payload, format="json")

    assert resp.status_code == 201
    data = resp.json()
    assert data["prestador"] == prestador_scope["prestador_a"].idprestador
    assert data["cliente"] == prestador_scope["cliente_2"].idempresa


@pytest.mark.django_db
def test_provider_create_order_is_restricted_to_own_installations(prestador_scope):
    user = make_user(
        "orders@soluciones.test",
        "Orders",
        prestador=prestador_scope["prestador_a"],
    )
    client = client_for(user)

    allowed = client.post(
        "/api/ordenes/ordenes/",
        {
            "instalacion": prestador_scope["inst_1"].idinstalacion,
            "tipo": "correctivo",
            "prioridad": "media",
            "estado": "abierta",
            "titulo": "Revision",
            "descripcion": "Revision tecnica",
        },
        format="json",
    )
    blocked = client.post(
        "/api/ordenes/ordenes/",
        {
            "instalacion": prestador_scope["inst_3"].idinstalacion,
            "tipo": "correctivo",
            "prioridad": "media",
            "estado": "abierta",
            "titulo": "Revision externa",
            "descripcion": "No debe crear",
        },
        format="json",
    )

    assert allowed.status_code == 201
    assert blocked.status_code == 403
