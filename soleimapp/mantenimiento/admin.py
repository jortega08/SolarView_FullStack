from django.contrib import admin

from .models import ContratoServicio, Mantenimiento, PlanMantenimiento


@admin.register(ContratoServicio)
class ContratoServicioAdmin(admin.ModelAdmin):
    list_display = (
        "idcontrato",
        "instalacion",
        "nivel",
        "horas_respuesta",
        "activo",
        "fecha_inicio",
        "fecha_fin",
    )
    list_filter = ("nivel", "activo")
    search_fields = ("instalacion__nombre", "instalacion__empresa__nombre")


@admin.register(PlanMantenimiento)
class PlanMantenimientoAdmin(admin.ModelAdmin):
    list_display = (
        "idplan",
        "nombre",
        "tipo_sistema",
        "frecuencia_dias",
        "duracion_estimada_horas",
        "activo",
    )
    list_filter = ("tipo_sistema", "activo")
    search_fields = ("nombre",)


@admin.register(Mantenimiento)
class MantenimientoAdmin(admin.ModelAdmin):
    list_display = (
        "idmantenimiento",
        "instalacion",
        "plan",
        "fecha_programada",
        "estado",
    )
    list_filter = ("estado", "plan")
    search_fields = ("instalacion__nombre",)
    date_hierarchy = "fecha_programada"
