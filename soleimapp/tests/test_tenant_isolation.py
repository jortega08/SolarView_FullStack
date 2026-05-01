"""
Tests for multi-tenant isolation — a user must not see another company's data.
"""

import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


def _client_for(user):
    c = APIClient()
    refresh = RefreshToken()
    refresh["user_id"] = user.idusuario
    refresh["email"] = user.email
    refresh["rol"] = user.rol
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return c


@pytest.mark.django_db
class TestAlertaTenantIsolation:
    """Users should only see alerts from their own installations."""

    def test_user_sees_own_alerts(
        self, api_client, instalacion, usuario, rol_instalacion
    ):
        from alerta.models import Alerta, TipoAlerta

        tipo, _ = TipoAlerta.objects.get_or_create(nombre="Test", descripcion="Test")
        Alerta.objects.create(
            tipoalerta=tipo,
            instalacion=instalacion,
            mensaje="Test alert",
            severidad="media",
        )
        resp = api_client.get("/api/alertas/alertas/")
        assert resp.status_code == 200
        data = resp.json()
        results = data if isinstance(data, list) else data.get("results", data)
        assert len(results) >= 1

    def test_user_cannot_see_other_company_alerts(self, api_client, ciudad):
        """A user with no role on an installation must not see its alerts."""
        from alerta.models import Alerta, TipoAlerta
        from core.models import Empresa, Instalacion

        # Create a second company + installation the test user has NO role in
        other_empresa = Empresa.objects.create(
            nombre="Other Corp",
            nit="111-2",
            ciudad=ciudad,
            sector="Energia",
        )
        other_inst = Instalacion.objects.create(
            nombre="Other Plant",
            empresa=other_empresa,
            ciudad=ciudad,
            tipo_sistema="hibrido",
            estado="activa",
            capacidad_panel_kw=5.0,
            capacidad_bateria_kwh=10.0,
            direccion="X",
        )
        tipo, _ = TipoAlerta.objects.get_or_create(nombre="Test", descripcion="Test")
        Alerta.objects.create(
            tipoalerta=tipo,
            instalacion=other_inst,
            mensaje="Confidential alert",
            severidad="critica",
        )

        resp = api_client.get("/api/alertas/alertas/")
        assert resp.status_code == 200
        data = resp.json()
        # AlertaViewSet sets pagination_class=None, so result is a plain list
        results = data if isinstance(data, list) else data.get("results", data)
        messages = [r.get("mensaje", "") for r in results]
        assert "Confidential alert" not in messages


@pytest.mark.django_db
class TestOrdenTenantIsolation:
    """A technician may only see their own assigned orders."""

    def test_mis_ordenes_returns_only_own(self, instalacion, admin_usuario):
        """mis-ordenes endpoint returns only orders assigned to the caller."""
        from core.models import Usuario

        tecnico = Usuario.objects.create(
            nombre="Pedro",
            email="pedro@t.co",
            contrasena=make_password("Password1!"),
            rol="user",
            is_active=True,
        )
        from ordenes.models import OrdenTrabajo

        own_order = OrdenTrabajo.objects.create(
            instalacion=instalacion,
            tipo="correctivo",
            prioridad="media",
            estado="asignada",
            titulo="Mi orden",
            asignado_a=tecnico,
            creado_por=admin_usuario,
            sla_objetivo_horas=24,
        )
        other_order = OrdenTrabajo.objects.create(
            instalacion=instalacion,
            tipo="correctivo",
            prioridad="media",
            estado="asignada",
            titulo="Orden de otro",
            asignado_a=admin_usuario,
            creado_por=admin_usuario,
            sla_objetivo_horas=24,
        )
        tecnico_client = _client_for(tecnico)
        resp = tecnico_client.get("/api/ordenes/mis-ordenes/")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        ids = [r["idorden"] for r in results]
        assert own_order.idorden in ids
        assert other_order.idorden not in ids
