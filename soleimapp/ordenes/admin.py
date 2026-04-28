from django.contrib import admin

from .models import ComentarioOrden, EvidenciaOrden, OrdenTrabajo


class ComentarioOrdenInline(admin.TabularInline):
    model = ComentarioOrden
    extra = 0
    readonly_fields = ('tipo', 'usuario', 'texto', 'creado_at')
    can_delete = False


class EvidenciaOrdenInline(admin.TabularInline):
    model = EvidenciaOrden
    extra = 0
    readonly_fields = ('tipo', 'archivo', 'subido_por', 'creado_at')
    can_delete = False


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = (
        'idorden', 'codigo', 'titulo', 'instalacion',
        'tipo', 'prioridad', 'estado', 'asignado_a', 'creada_at',
    )
    list_filter = ('estado', 'prioridad', 'tipo')
    search_fields = ('codigo', 'titulo', 'instalacion__nombre', 'asignado_a__nombre')
    date_hierarchy = 'creada_at'
    readonly_fields = (
        'codigo', 'creada_at', 'asignada_at', 'iniciada_at',
        'completada_at', 'cerrada_at',
    )
    inlines = [ComentarioOrdenInline, EvidenciaOrdenInline]


@admin.register(ComentarioOrden)
class ComentarioOrdenAdmin(admin.ModelAdmin):
    list_display = ('idcomentario', 'orden', 'tipo', 'usuario', 'creado_at')
    list_filter = ('tipo',)
    search_fields = ('orden__codigo', 'texto')


@admin.register(EvidenciaOrden)
class EvidenciaOrdenAdmin(admin.ModelAdmin):
    list_display = ('idevidencia', 'orden', 'tipo', 'subido_por', 'creado_at')
    list_filter = ('tipo',)
    search_fields = ('orden__codigo', 'descripcion')
