from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"alertas", views.AlertaViewSet, basename="alerta")
router.register(r"tipos-alerta", views.TipoAlertaViewSet, basename="tipo-alerta")

urlpatterns = [
    path("api/alertas/ultimas/", views.ultimas_alertas, name="ultimas_alertas"),
    path("api/alertas/", include(router.urls)),
]
