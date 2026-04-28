from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

# P2 — cursor-paginated time-series endpoints
router = DefaultRouter()
router.register(r'telemetria/consumos', views.ConsumoViewSet, basename='consumo')
router.register(r'telemetria/baterias', views.BateriaViewSet, basename='bateria')

urlpatterns = [
    # IoT ingestion (M2M, X-IoT-Key auth)
    path('api/telemetria/registrar_datos/', views.registrar_datos, name='registrar_datos'),
    # Legacy function views (kept for backwards compatibility)
    path('api/telemetria/ver_datos/', views.ver_datos, name='ver_datos'),
    path('api/factura/mensual/', views.factura_mensual, name='factura_mensual'),
    # P2 — cursor-paginated ViewSet endpoints
    path('api/', include(router.urls)),
]
