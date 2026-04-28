from django.contrib import admin

from .models import Notificacion, PlantillaNotificacion


@admin.register(PlantillaNotificacion)
class PlantillaNotificacionAdmin(admin.ModelAdmin):
    list_display = ('idplantilla', 'clave', 'asunto', 'activo', 'actualizado_at')
    list_filter = ('activo',)
    search_fields = ('clave', 'asunto')


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('idnotificacion', 'usuario', 'canal', 'asunto',
                    'estado', 'intentos', 'creada_at', 'enviada_at')
    list_filter = ('canal', 'estado')
    search_fields = ('asunto', 'usuario__email', 'usuario__nombre')
    date_hierarchy = 'creada_at'
    readonly_fields = ('creada_at', 'enviada_at', 'leida_at', 'intentos')
