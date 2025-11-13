from django.urls import path, include
from alerta import views as alerta_views

urlpatterns = [
    path("api/alertas/ultimas/", alerta_views.ultimas_alertas, name="ultimas_alertas"),
]
