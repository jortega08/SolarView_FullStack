import django.urls as urls
from django.urls import path
from . import views

urlpatterns = [
    path('api/analitica/estadisticas/', views.obtener_estadisticas, name='estadisticas'),
    path('api/analitica/actividades/', views.obtener_actividades_mensuales, name='actividades'),
    path('api/analitica/tareas/', views.obtener_logros, name='tareas'),
    path('api/analitica/bateria/', views.obtener_estado_bateria, name='bateria'),
    path("api/usuarios/nivel/", views.nivel_usuario, name="nivel_usuario"),
]