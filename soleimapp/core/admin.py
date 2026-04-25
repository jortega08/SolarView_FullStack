from django.contrib import admin
from .models import Pais, Estado, Ciudad, Usuario, Domicilio, ConfiguracionUser

admin.site.register(Pais)
admin.site.register(Estado)
admin.site.register(Ciudad)
admin.site.register(Usuario)
admin.site.register(Domicilio)
admin.site.register(ConfiguracionUser)

