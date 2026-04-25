from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'alertas', views.AlertaViewSet)
router.register(r'tipos-alerta', views.TipoAlertaViewSet)

urlpatterns = [
    path("api/alertas/ultimas/", views.ultimas_alertas, name="ultimas_alertas"),
    path("api/alertas/", include(router.urls)),
]