"""
Pytest fixtures shared across the test suite.

Convention:
  - `db_empresa`:     a minimal Empresa + Ciudad + Instalacion hierarchy
  - `api_client`:     an authenticated DRF APIClient for a regular user
  - `admin_client`:   an authenticated DRF APIClient for an admin user
"""

import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

# -------------------------------------------------------------------------
# Core model factories (inline - no factory-boy dep needed for basic tests)
# -------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def test_cache(settings):
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "soleim-tests",
        }
    }


@pytest.fixture(autouse=True)
def test_async_tasks(settings, monkeypatch):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
    settings.CELERY_BROKER_URL = "memory://"
    settings.CELERY_RESULT_BACKEND = "cache+memory://"

    from notificaciones.tasks import enviar_notificacion
    from ordenes.tasks import crear_orden_para_alerta

    monkeypatch.setattr(enviar_notificacion, "delay", lambda *args, **kwargs: None)
    monkeypatch.setattr(crear_orden_para_alerta, "delay", lambda *args, **kwargs: None)


@pytest.fixture
def pais(db):
    from core.models import Pais

    return Pais.objects.create(nombre="Colombia")


@pytest.fixture
def estado(db, pais):
    from core.models import Estado

    return Estado.objects.create(nombre="Cundinamarca", pais=pais)


@pytest.fixture
def ciudad(db, estado):
    from core.models import Ciudad

    return Ciudad.objects.create(nombre="Bogota", estado=estado)


@pytest.fixture
def empresa(db, ciudad):
    from core.models import Empresa

    return Empresa.objects.create(
        nombre="SolarTest S.A.S.",
        nit="900111222-3",
        ciudad=ciudad,
        sector="Energia",
    )


@pytest.fixture
def instalacion(db, empresa, ciudad):
    from core.models import Instalacion

    return Instalacion.objects.create(
        nombre="Planta Norte",
        empresa=empresa,
        ciudad=ciudad,
        tipo_sistema="hibrido",
        estado="activa",
        capacidad_panel_kw=10.0,
        capacidad_bateria_kwh=20.0,
        direccion="Carrera 5 # 10-20",
    )


@pytest.fixture
def usuario(db):
    from core.models import Usuario

    return Usuario.objects.create(
        nombre="Test User",
        email="test@solartest.co",
        contrasena=make_password("Password1!"),
        rol="user",
        is_active=True,
    )


@pytest.fixture
def admin_usuario(db):
    from core.models import Usuario

    return Usuario.objects.create(
        nombre="Admin User",
        email="admin@solartest.co",
        contrasena=make_password("Password1!"),
        rol="admin",
        is_active=True,
    )


def _make_client(user):
    client = APIClient()
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.fixture
def api_client(usuario):
    return _make_client(usuario)


@pytest.fixture
def admin_client(admin_usuario):
    return _make_client(admin_usuario)


@pytest.fixture
def rol_instalacion(db, usuario, instalacion):
    """Give the test user viewer access to the test installation."""
    from core.models import RolInstalacion

    return RolInstalacion.objects.create(
        usuario=usuario,
        instalacion=instalacion,
        rol="viewer",
    )
