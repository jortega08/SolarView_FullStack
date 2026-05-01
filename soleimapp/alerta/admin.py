from django.contrib import admin

from .models import Alerta, TipoAlerta

admin.site.register(TipoAlerta)
admin.site.register(Alerta)
