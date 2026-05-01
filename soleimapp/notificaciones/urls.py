from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"notificaciones", views.NotificacionViewSet, basename="notificacion")

urlpatterns = [
    path(
        "api/notificaciones/no-leidas-count/",
        views.no_leidas_count,
        name="no-leidas-count",
    ),
    path("api/", include(router.urls)),
]
