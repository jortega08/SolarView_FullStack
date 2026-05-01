"""
Tests for the /api/health/ endpoint (P2 extended health check).
"""

from unittest.mock import patch

import pytest


@pytest.mark.django_db
class TestHealthEndpoint:
    def test_health_ok(self, client):
        """Should return 200 when DB and Redis are reachable."""
        with patch("django_redis.get_redis_connection") as mock_redis:
            mock_r = mock_redis.return_value
            mock_r.ping.return_value = True
            mock_r.llen.return_value = 0

            resp = client.get("/api/health/")

        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["db"] == "ok"
        assert data["redis"] == "ok"
        assert "iot_buffer_len" in data

    def test_health_db_fail(self, client):
        """Should return 503 when DB is unreachable."""
        from django.db import connection as conn

        with patch.object(conn, "ensure_connection", side_effect=Exception("DB down")):
            with patch("django_redis.get_redis_connection") as mock_redis:
                mock_r = mock_redis.return_value
                mock_r.ping.return_value = True
                mock_r.llen.return_value = 0

                resp = client.get("/api/health/")

        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "degraded"
        assert data["db"] == "error"

    def test_health_redis_fail(self, client):
        """Should return 503 when Redis is unreachable."""
        with patch(
            "django_redis.get_redis_connection", side_effect=Exception("Redis down")
        ):
            resp = client.get("/api/health/")

        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "degraded"
        assert data["redis"] == "error"
