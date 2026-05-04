"""
Tests del módulo de tarifa kWh:
- resolver_tarifa cascada (instalación -> ciudad -> default)
- calcular_valores_energia (consumo, ahorro, total)
- panel_empresa expone facturacion_hoy con la tarifa aplicada
- CRUD Tarifa: admin/prestador puede mutar; usuario básico no.
"""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


TARIFAS_URL = "/api/core/tarifas/"
PANEL_URL = "/api/empresa/panel/"


def _client_for(user):
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


# ---------------------------------------------------------------------------
# resolver_tarifa
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_resolver_tarifa_devuelve_default_cuando_no_hay_configurada(instalacion):
    from core.tarifas import DEFAULT_TARIFA_KWH, resolver_tarifa

    tarifa = resolver_tarifa(instalacion)
    assert tarifa.fuente == "default"
    assert tarifa.valor_kwh == DEFAULT_TARIFA_KWH
    assert tarifa.tarifa_id is None


@pytest.mark.django_db
def test_resolver_tarifa_prefiere_ciudad_sobre_default(instalacion, ciudad):
    from core.models import Tarifa
    from core.tarifas import resolver_tarifa

    Tarifa.objects.create(
        nombre="Bogotá Q1 2026",
        ciudad=ciudad,
        valor_kwh=Decimal("950.50"),
        vigente_desde=timezone.now() - timedelta(days=1),
    )

    tarifa = resolver_tarifa(instalacion)
    assert tarifa.fuente == "ciudad"
    assert tarifa.valor_kwh == Decimal("950.50")


@pytest.mark.django_db
def test_resolver_tarifa_prefiere_instalacion_sobre_ciudad(instalacion, ciudad):
    from core.models import Tarifa
    from core.tarifas import resolver_tarifa

    Tarifa.objects.create(
        nombre="Ciudad",
        ciudad=ciudad,
        valor_kwh=Decimal("900.00"),
        vigente_desde=timezone.now() - timedelta(days=2),
    )
    Tarifa.objects.create(
        nombre="Override Planta Norte",
        instalacion=instalacion,
        valor_kwh=Decimal("1100.00"),
        vigente_desde=timezone.now() - timedelta(hours=1),
    )

    tarifa = resolver_tarifa(instalacion)
    assert tarifa.fuente == "instalacion"
    assert tarifa.valor_kwh == Decimal("1100.00")


@pytest.mark.django_db
def test_resolver_tarifa_ignora_tarifas_expiradas(instalacion, ciudad):
    from core.models import Tarifa
    from core.tarifas import DEFAULT_TARIFA_KWH, resolver_tarifa

    ahora = timezone.now()
    Tarifa.objects.create(
        nombre="Vieja",
        ciudad=ciudad,
        valor_kwh=Decimal("700.00"),
        vigente_desde=ahora - timedelta(days=30),
        vigente_hasta=ahora - timedelta(days=1),
    )
    tarifa = resolver_tarifa(instalacion)
    assert tarifa.fuente == "default"
    assert tarifa.valor_kwh == DEFAULT_TARIFA_KWH


# ---------------------------------------------------------------------------
# calcular_valores_energia
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_calcular_valores_energia_aplica_formula(instalacion, ciudad):
    from core.models import Tarifa
    from core.tarifas import calcular_valores_energia, resolver_tarifa

    Tarifa.objects.create(
        nombre="Test",
        ciudad=ciudad,
        valor_kwh=Decimal("1000.00"),
        vigente_desde=timezone.now() - timedelta(hours=1),
    )
    tarifa = resolver_tarifa(instalacion)

    valores = calcular_valores_energia(
        generacion_solar_kwh=12.5,  # ahorro = 12.5 * 1000 = 12500
        consumo_red_kwh=8.0,        # consumo = 8 * 1000 = 8000
        tarifa=tarifa,
    )

    assert valores["valor_consumo"] == 8000.00
    assert valores["valor_ahorro"] == 12500.00
    assert valores["valor_total"] == 20500.00
    assert valores["tarifa_kwh"] == 1000.00
    assert valores["moneda"] == "COP"


@pytest.mark.django_db
def test_calcular_valores_energia_acepta_ceros():
    from core.tarifas import TarifaResuelta, calcular_valores_energia

    tarifa = TarifaResuelta(
        valor_kwh=Decimal("800.00"), moneda="COP", fuente="default", tarifa_id=None
    )
    valores = calcular_valores_energia(0, 0, tarifa)
    assert valores["valor_consumo"] == 0.0
    assert valores["valor_ahorro"] == 0.0
    assert valores["valor_total"] == 0.0


# ---------------------------------------------------------------------------
# CRUD Tarifa
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_admin_puede_crear_tarifa(admin_client, ciudad):
    response = admin_client.post(
        TARIFAS_URL,
        {
            "nombre": "Bogotá residencial",
            "ciudad": ciudad.idciudad,
            "valor_kwh": "920.00",
            "moneda": "COP",
            "vigente_desde": timezone.now().isoformat(),
        },
        format="json",
    )
    assert response.status_code == 201, response.content


@pytest.mark.django_db
def test_prestador_puede_crear_tarifa(usuario, ciudad):
    from core.models import PrestadorServicio

    usuario.prestador = PrestadorServicio.objects.create(
        nombre="Solar Andes", nit="900-T-1"
    )
    usuario.save(update_fields=["prestador"])
    client = _client_for(usuario)

    response = client.post(
        TARIFAS_URL,
        {
            "nombre": "Cliente A - Q1",
            "ciudad": ciudad.idciudad,
            "valor_kwh": "850.00",
            "vigente_desde": timezone.now().isoformat(),
        },
        format="json",
    )
    assert response.status_code == 201, response.content


@pytest.mark.django_db
def test_usuario_basico_no_puede_crear_tarifa(api_client, ciudad):
    response = api_client.post(
        TARIFAS_URL,
        {
            "nombre": "X",
            "ciudad": ciudad.idciudad,
            "valor_kwh": "800.00",
            "vigente_desde": timezone.now().isoformat(),
        },
        format="json",
    )
    assert response.status_code == 403, response.content


@pytest.mark.django_db
def test_tarifa_no_puede_aplicar_a_ciudad_e_instalacion_simultaneamente(
    admin_client, ciudad, instalacion
):
    response = admin_client.post(
        TARIFAS_URL,
        {
            "nombre": "Bad",
            "ciudad": ciudad.idciudad,
            "instalacion": instalacion.idinstalacion,
            "valor_kwh": "800.00",
            "vigente_desde": timezone.now().isoformat(),
        },
        format="json",
    )
    assert response.status_code == 400, response.content


# ---------------------------------------------------------------------------
# panel_empresa: expone facturacion_hoy
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_panel_empresa_expone_facturacion_hoy(admin_client, instalacion, ciudad):
    from core.models import Tarifa
    from telemetria.models import Consumo

    Tarifa.objects.create(
        nombre="Test",
        ciudad=ciudad,
        valor_kwh=Decimal("1000.00"),
        vigente_desde=timezone.now() - timedelta(hours=1),
    )
    Consumo.objects.create(
        instalacion=instalacion,
        energia_consumida=10.0,
        potencia=2.0,
        fuente="solar",
        costo=0.0,
    )
    Consumo.objects.create(
        instalacion=instalacion,
        energia_consumida=4.0,
        potencia=1.0,
        fuente="electrica",
        costo=0.0,
    )

    response = admin_client.get(PANEL_URL)
    assert response.status_code == 200, response.content

    payload = response.json()
    facturacion = payload["facturacion_hoy"]
    # 4 kWh red * 1000 = 4000; 10 kWh solar * 1000 = 10000; total = 14000
    assert facturacion["valor_consumo"] == 4000.0
    assert facturacion["valor_ahorro"] == 10000.0
    assert facturacion["valor_total"] == 14000.0
    assert facturacion["moneda"] == "COP"
    # Back-compat: ahorro_estimado coincide con valor_ahorro.
    assert payload["ahorro_estimado"] == 10000.0
