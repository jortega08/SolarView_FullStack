from django.contrib import admin

from .models import EventoAuditoria


@admin.register(EventoAuditoria)
class EventoAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'accion', 'entidad', 'entidad_id', 'usuario', 'timestamp')
    list_filter = ('accion', 'entidad', 'timestamp')
    search_fields = ('accion', 'entidad', 'detalle')
