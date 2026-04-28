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
# Core model factories (inline — no factory-boy dep needed for basic tests)
# -------------------------------------------------------------------------

@pytest.fixture
def ciudad(db):
    from core.models import Ciudad
    return Ciudad.objects.create(nombre='Bogotá', departamento='Cundinamarca', pais='Colombia')


@pytest.fixture
def empresa(db, ciudad):
    from core.models import Empresa
    return Empresa.objects.create(
        nombre='SolarTest S.A.S.',
        nit='900111222-3',
        ciudad=ciudad,
        direccion='Calle 1 # 2-3',
        telefono='6011234567',
        email='contacto@solartest.co',
    )


@pytest.fixture
def instalacion(db, empresa, ciudad):
    from core.models import Instalacion
    return Instalacion.objects.create(
        nombre='Planta Norte',
        empresa=empresa,
        ciudad=ciudad,
        tipo_sistema='hibrido',
        estado='activa',
        capacidad_instalada=10.0,
        direccion='Carrera 5 # 10-20',
    )


@pytest.fixture
def usuario(db):
    from core.models import Usuario
    return Usuario.objects.create(
        nombre='Test User',
        email='test@solartest.co',
        contrasena=make_password('Password1!'),
        rol='user',
        is_active=True,
    )


@pytest.fixture
def admin_usuario(db):
    from core.models import Usuario
    return Usuario.objects.create(
        nombre='Admin User',
        email='admin@solartest.co',
        contrasena=make_password('Password1!'),
        rol='admin',
        is_active=True,
    )


def _make_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
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
        rol='viewer',
    )
