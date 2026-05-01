from django.urls import path

from . import views

urlpatterns = [
    path(
        "api/analitica/actividades/",
        views.obtener_actividades_mensuales,
        name="actividades",
    ),
    path("api/analitica/bateria/", views.obtener_estado_bateria, name="bateria"),
    path(
        "api/analitica/autonomia/",
        views.autonomia_instalacion,
        name="autonomia_instalacion",
    ),
    path(
        "api/analitica/tendencia/",
        views.tendencia_instalacion,
        name="tendencia_instalacion",
    ),
    path(
        "api/analitica/comparativa/",
        views.comparativa_empresa,
        name="comparativa_empresa",
    ),
]
