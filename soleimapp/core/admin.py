from django.contrib import admin

from .models import (
    Ciudad,
    ConfiguracionUser,
    Domicilio,
    Empresa,
    Estado,
    Instalacion,
    Pais,
    PrestadorServicio,
    RolInstalacion,
    Sensor,
    Usuario,
)

admin.site.register(Pais)
admin.site.register(Estado)
admin.site.register(Ciudad)
admin.site.register(Usuario)
admin.site.register(Domicilio)
admin.site.register(ConfiguracionUser)
admin.site.register(Empresa)
admin.site.register(PrestadorServicio)
admin.site.register(Instalacion)
admin.site.register(RolInstalacion)
admin.site.register(Sensor)
