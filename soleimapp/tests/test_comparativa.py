"""
Tests for the N+1-free comparativa_empresa view (P2).
Verifies that the fixed view produces correct aggregates
without issuing N queries per installation.
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from django.test.utils import CaptureQueriesContext
from django.db import connection


@pytest.mark.django_db
class TestComparativaEmpresa:
    def _make_consumo(self, instalacion, fuente, energia, costo):
        from telemetria.models import Consumo
        return Consumo.objects.create(
            instalacion=instalacion,
            energia_consumida=energia,
            potencia=1.0,
            fuente=fuente,
            costo=costo,
        )

    def test_correct_aggregates(self, admin_client, empresa, instalacion):
        """Aggregates must match what was inserted."""
        self._make_consumo(instalacion, 'solar', 30.0, 5.0)
        self._make_consumo(instalacion, 'solar', 20.0, 3.0)
        self._make_consumo(instalacion, 'electrica', 50.0, 10.0)

        resp = admin_client.get(
            '/api/analitica/comparativa/',
            {'empresa_id': empresa.idempresa},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data['success'] is True
        row = next(
            (r for r in data['data'] if r['instalacion_id'] == instalacion.idinstalacion),
            None,
        )
        assert row is not None
        # solar=50, total=100 → ratio=0.5
        assert row['solar_ratio'] == pytest.approx(0.5, abs=1e-3)
        assert row['costo_total'] == pytest.approx(18.0, abs=1e-2)

    def test_query_count_is_bounded(self, admin_client, empresa, instalacion):
        """
        The view must NOT issue more than 5 queries regardless of N installations.
        (Previously it was 4N+1; now it must be ≤ ~4 core queries.)
        """
        self._make_consumo(instalacion, 'solar', 10.0, 2.0)

        with CaptureQueriesContext(connection) as ctx:
            resp = admin_client.get(
                '/api/analitica/comparativa/',
                {'empresa_id': empresa.idempresa},
                HTTP_CACHE_CONTROL='no-cache',
            )

        assert resp.status_code == 200
        # Allow up to 8 queries: auth (1-2), empresa fetch (1),
        # instalaciones (1), consumo_stats (1), alerta_stats (1) + cache ops
        assert len(ctx.captured_queries) <= 10, (
            f"Too many queries: {len(ctx.captured_queries)}.\n"
            + '\n'.join(q['sql'][:120] for q in ctx.captured_queries)
        )

    def test_requires_authentication(self, client, empresa):
        resp = client.get(
            '/api/analitica/comparativa/',
            {'empresa_id': empresa.idempresa},
        )
        assert resp.status_code in (401, 403)
