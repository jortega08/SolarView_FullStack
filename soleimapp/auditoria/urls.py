from django.urls import path

from . import views

urlpatterns = [
    path(
        "api/auditoria/",
        views.listar_eventos_auditoria,
        name="listar_eventos_auditoria",
    ),
]
