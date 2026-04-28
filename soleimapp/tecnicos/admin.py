from django.contrib import admin

from .models import Especialidad, PerfilTecnico


@admin.register(Especialidad)
class EspecialidadAdmin(admin.ModelAdmin):
    list_display = ('idespecialidad', 'nombre', 'descripcion')
    search_fields = ('nombre',)


@admin.register(PerfilTecnico)
class PerfilTecnicoAdmin(admin.ModelAdmin):
    list_display = ('idperfil', 'usuario', 'empresa', 'cedula', 'disponible', 'creado_at')
    list_filter = ('disponible', 'empresa', 'especialidades')
    search_fields = ('usuario__nombre', 'usuario__email', 'cedula', 'telefono')
    filter_horizontal = ('especialidades', 'zonas')
    readonly_fields = ('creado_at', 'actualizado_at')
