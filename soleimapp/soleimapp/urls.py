from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def health(request):
    """
    P2 — Healthcheck extendido.
    Comprueba DB (Postgres), caché (Redis) y expone la longitud del buffer IoT.
    Retorna HTTP 200 cuando todo está OK, HTTP 503 si cualquier componente falla.
    Usado por Docker/k8s liveness + readiness probes y load balancers.
    """
    db_ok = True
    redis_ok = True
    iot_buffer_len = 0

    # --- Postgres ---
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = False

    # --- Redis (via django-redis) ---
    try:
        from django_redis import get_redis_connection
        r = get_redis_connection('default')
        r.ping()
        redis_ok = True
        # IoT buffer backlog (useful to detect consumer lag)
        iot_buffer_len = (
            (r.llen('iot:consumo_buffer') or 0) +
            (r.llen('iot:bateria_buffer') or 0)
        )
    except Exception:
        redis_ok = False

    all_ok = db_ok and redis_ok
    payload = {
        'status': 'ok' if all_ok else 'degraded',
        'db': 'ok' if db_ok else 'error',
        'redis': 'ok' if redis_ok else 'error',
        'iot_buffer_len': iot_buffer_len,
    }
    return JsonResponse(payload, status=200 if all_ok else 503)


urlpatterns = [
    # Healthcheck — sin autenticación para que load balancers y Docker lo usen
    path('api/health/', health, name='health'),

    # Prometheus metrics (scraped by Prometheus container; proteger con firewall en producción)
    path('', include('django_prometheus.urls')),

    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('', include('telemetria.urls')),
    path('', include('analitica.urls')),
    path('', include('alerta.urls')),
    path('', include('usuario.urls')),
    path('', include('empresa.urls')),
    path('', include('auditoria.urls')),
    # P1 — Núcleo operativo B2B
    path('', include('tecnicos.urls')),
    path('', include('mantenimiento.urls')),
    path('', include('ordenes.urls')),
    path('', include('notificaciones.urls')),

    # API Documentation (Swagger / OpenAPI)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Servir media files en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
