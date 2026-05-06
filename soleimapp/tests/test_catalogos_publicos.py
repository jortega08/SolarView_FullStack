"""
Tests para verificar que los catálogos geográficos son legibles sin token
(form de Register llena selects de Pais/Estado/Ciudad sin autenticar) y que
las mutaciones siguen requiriendo usuario autenticado activo.
"""

import pytest
from rest_framework.test import APIClient

PAISES_URL = "/api/core/paises/"
ESTADOS_URL = "/api/core/estados/"
CIUDADES_URL = "/api/core/ciudades/"


@pytest.mark.django_db
def test_anonimo_puede_listar_paises(pais):
    response = APIClient().get(PAISES_URL)
    assert response.status_code == 200, response.content
    nombres = [p["nombre"] for p in response.data]
    assert pais.nombre in nombres


@pytest.mark.django_db
def test_anonimo_puede_listar_estados(estado):
    response = APIClient().get(ESTADOS_URL)
    assert response.status_code == 200, response.content


@pytest.mark.django_db
def test_anonimo_puede_listar_ciudades(ciudad):
    response = APIClient().get(CIUDADES_URL)
    assert response.status_code == 200, response.content
    nombres = [c["nombre"] for c in response.data]
    assert ciudad.nombre in nombres


@pytest.mark.django_db
def test_anonimo_no_puede_crear_ciudad(estado):
    response = APIClient().post(
        CIUDADES_URL,
        {"nombre": "Hacker City", "estado": estado.idestado},
        format="json",
    )
    assert response.status_code in (401, 403), response.content


@pytest.mark.django_db
def test_admin_puede_crear_ciudad(admin_client, estado):
    response = admin_client.post(
        CIUDADES_URL,
        {"nombre": "Nueva Ciudad", "estado": estado.idestado},
        format="json",
    )
    assert response.status_code == 201, response.content
