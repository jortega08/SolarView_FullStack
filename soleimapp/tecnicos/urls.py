from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"especialidades", views.EspecialidadViewSet, basename="especialidad")
router.register(r"perfiles", views.PerfilTecnicoViewSet, basename="perfil-tecnico")

urlpatterns = [
    path("api/tecnicos/", include(router.urls)),
]
