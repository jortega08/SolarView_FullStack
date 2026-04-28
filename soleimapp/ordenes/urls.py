from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"ordenes", views.OrdenTrabajoViewSet, basename="orden-trabajo")

urlpatterns = [
    path("api/ordenes/mis-ordenes/", views.mis_ordenes, name="mis-ordenes"),
    path("api/ordenes/", include(router.urls)),
]
