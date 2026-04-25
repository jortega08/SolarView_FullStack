from django.urls import path

from . import views

urlpatterns = [
    path('api/empresa/panel/', views.panel_empresa, name='panel_empresa'),
    path('api/empresa/instalaciones/', views.listar_instalaciones, name='listar_instalaciones'),
    path('api/empresa/instalacion/<int:pk>/', views.detalle_instalacion, name='detalle_instalacion'),
    path('api/empresa/reporte/consumo/', views.reporte_consumo_csv, name='reporte_consumo_csv'),
    path('api/empresa/reporte/alertas/', views.reporte_alertas_csv, name='reporte_alertas_csv'),
]
