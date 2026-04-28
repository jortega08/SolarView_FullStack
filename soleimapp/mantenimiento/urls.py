from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(
    r"contratos", views.ContratoServicioViewSet, basename="contrato-servicio"
)
router.register(
    r"planes", views.PlanMantenimientoViewSet, basename="plan-mantenimiento"
)
router.register(r"programados", views.MantenimientoViewSet, basename="mantenimiento")

urlpatterns = [
    path("api/mantenimiento/", include(router.urls)),
]
