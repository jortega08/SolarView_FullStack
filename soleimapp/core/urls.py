from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'domicilios', views.DomicilioViewSet)
router.register(r'paises', views.PaisViewSet)
router.register(r'estados', views.EstadoViewSet)
router.register(r'ciudades', views.CiudadViewSet)
router.register(r'empresas', views.EmpresaViewSet)
router.register(r'instalaciones', views.InstalacionViewSet)

urlpatterns = [
    path('api/core/', include(router.urls)),
]
