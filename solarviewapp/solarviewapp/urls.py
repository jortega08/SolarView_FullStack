from django.contrib import admin
from django.urls import path
from django.urls import include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('', include('telemetria.urls')),
    path('', include('analitica.urls')),
    path('', include('alerta.urls')),
]
