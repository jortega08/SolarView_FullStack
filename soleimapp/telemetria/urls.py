import django.urls as urls
from django.urls import path, include
from . import views

urlpatterns = [
    path('api/telemetria/registrar_datos/', views.registrar_datos, name='registrar_datos'),
    path('api/telemetria/ver_datos/', views.ver_datos, name='ver_datos'),
    path("api/factura/mensual/", views.factura_mensual, name="factura_mensual"),
]
