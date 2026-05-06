from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
# basename obligatorio cuando el ViewSet no define queryset a nivel de clase
router.register(r"usuarios", views.UsuarioViewSet, basename="usuario")
router.register(r"domicilios", views.DomicilioViewSet, basename="domicilio")
router.register(r"paises", views.PaisViewSet, basename="pais")
router.register(r"estados", views.EstadoViewSet, basename="estado")
router.register(r"ciudades", views.CiudadViewSet, basename="ciudad")
router.register(r"empresas", views.EmpresaViewSet, basename="empresa")
router.register(r"clientes", views.ClienteViewSet, basename="cliente")
router.register(r"prestadores", views.PrestadorServicioViewSet, basename="prestador")
router.register(r"instalaciones", views.InstalacionViewSet, basename="instalacion")
router.register(r"tarifas", views.TarifaViewSet, basename="tarifa")
router.register(
    r"invitaciones", views.InvitacionPrestadorViewSet, basename="invitacion-prestador"
)
router.register(
    r"invitaciones-cliente",
    views.InvitacionClienteViewSet,
    basename="invitacion-cliente",
)
router.register(r"sensores", views.SensorViewSet, basename="sensor")

urlpatterns = [
    path("api/core/mi-prestador/", views.mi_prestador, name="mi-prestador"),
    path("api/core/equipo-prestador/", views.equipo_prestador, name="equipo-prestador"),
    path(
        "api/core/equipo-prestador/<int:idusuario>/quitar-acceso/",
        views.quitar_acceso_prestador,
        name="equipo-prestador-quitar-acceso",
    ),
    path("api/core/", include(router.urls)),
]
