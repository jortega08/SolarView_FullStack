from django.contrib import admin

from .models import Ciudad, ConfiguracionUser, Domicilio, Estado, Pais, Usuario

admin.site.register(Pais)
admin.site.register(Estado)
admin.site.register(Ciudad)
admin.site.register(Usuario)
admin.site.register(Domicilio)
admin.site.register(ConfiguracionUser)
