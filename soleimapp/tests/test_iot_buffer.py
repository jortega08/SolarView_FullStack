"""
Tests for the IoT write-ahead buffer (P2).
"""

import json
from unittest.mock import MagicMock, patch

import pytest


@pytest.mark.django_db
class TestRegistrarDatosBuffered:
    IOT_KEY = "secret-test-key"
    URL = "/api/telemetria/registrar_datos/"

    def _payload(self, instalacion_id):
        return {
            "instalacion_id": instalacion_id,
            "energia_consumida": 5.5,
            "potencia": 2.3,
            "fuente": "solar",
            "costo": 0.9,
            "voltaje": 12.1,
            "corriente": 3.2,
            "temperatura": 28.0,
            "capacidad_bateria": 10.0,
            "porcentaje_carga": 85.0,
            "tiempo_restante": 6.0,
        }

    def test_sync_mode_returns_200(self, client, instalacion, settings):
        settings.IOT_BUFFER_ENABLED = False
        settings.IOT_SHARED_SECRET = self.IOT_KEY

        with patch("telemetria.tasks.process_battery_alerts") as mock_alerts, patch(
            "telemetria.tasks.notify_realtime_update"
        ) as mock_notify:
            mock_alerts.delay = MagicMock()
            mock_notify.delay = MagicMock()

            resp = client.post(
                self.URL,
                data=json.dumps(self._payload(instalacion.idinstalacion)),
                content_type="application/json",
                HTTP_X_IOT_KEY=self.IOT_KEY,
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "consumo_id" in data

    def test_buffer_mode_returns_202(self, client, instalacion, settings):
        settings.IOT_BUFFER_ENABLED = True
        settings.IOT_SHARED_SECRET = self.IOT_KEY

        mock_redis = MagicMock()
        mock_pipeline = MagicMock()
        mock_redis.pipeline.return_value = mock_pipeline

        with patch("django_redis.get_redis_connection", return_value=mock_redis), patch(
            "telemetria.tasks.notify_realtime_update"
        ) as mock_notify:
            mock_notify.delay = MagicMock()

            resp = client.post(
                self.URL,
                data=json.dumps(self._payload(instalacion.idinstalacion)),
                content_type="application/json",
                HTTP_X_IOT_KEY=self.IOT_KEY,
            )

        assert resp.status_code == 202
        data = resp.json()
        assert data["success"] is True
        assert data.get("buffered") is True

    def test_invalid_iot_key_rejected(self, client, instalacion, settings):
        settings.IOT_SHARED_SECRET = self.IOT_KEY
        resp = client.post(
            self.URL,
            data=json.dumps(self._payload(instalacion.idinstalacion)),
            content_type="application/json",
            HTTP_X_IOT_KEY="wrong-key",
        )
        assert resp.status_code == 401

    def test_invalid_fuente_rejected(self, client, instalacion, settings):
        settings.IOT_BUFFER_ENABLED = False
        settings.IOT_SHARED_SECRET = self.IOT_KEY
        payload = self._payload(instalacion.idinstalacion)
        payload["fuente"] = "viento"
        resp = client.post(
            self.URL,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_IOT_KEY=self.IOT_KEY,
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestFlushIotBuffer:
    """Unit tests for the flush_iot_buffer Celery task."""

    def test_flush_creates_records(self, instalacion):
        from telemetria.models import Bateria, Consumo
        from telemetria.task import flush_iot_buffer

        consumo_row = json.dumps(
            {
                "instalacion_id": instalacion.idinstalacion,
                "domicilio_id": None,
                "energia_consumida": 3.0,
                "potencia": 1.5,
                "fuente": "solar",
                "costo": 0.5,
            }
        )
        bateria_row = json.dumps(
            {
                "instalacion_id": instalacion.idinstalacion,
                "domicilio_id": None,
                "voltaje": 12.0,
                "corriente": 2.5,
                "temperatura": 30.0,
                "capacidad_bateria": 10.0,
                "porcentaje_carga": 70.0,
                "tiempo_restante": 5.0,
            }
        )

        mock_redis = MagicMock()
        # Simulate two pipelines: one for consumo, one for bateria
        pipe1, pipe2 = MagicMock(), MagicMock()
        pipe1.execute.return_value = [[consumo_row], None]
        pipe2.execute.return_value = [[bateria_row], None]
        mock_redis.pipeline.side_effect = [pipe1, pipe2]

        before_consumo = Consumo.objects.count()
        before_bateria = Bateria.objects.count()

        with patch("django_redis.get_redis_connection", return_value=mock_redis), patch(
            "telemetria.task.process_battery_alerts"
        ) as mock_alerts:
            mock_alerts.delay = MagicMock()
            flush_iot_buffer()

        assert Consumo.objects.count() == before_consumo + 1
        assert Bateria.objects.count() == before_bateria + 1
