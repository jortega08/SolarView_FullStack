"""Data migration: crea las plantillas iniciales del sistema."""
from django.db import migrations


PLANTILLAS = [
    {
        'clave': 'orden_asignada',
        'asunto': 'Nueva orden de trabajo asignada: {codigo}',
        'cuerpo_txt': (
            'Hola,\n\n'
            'Se te ha asignado la orden {codigo}: {titulo}.\n'
            'Ingresa al sistema para ver el detalle y comenzar la ejecución.\n'
        ),
        'canales_default': ['in_app', 'email'],
    },
    {
        'clave': 'orden_completada',
        'asunto': 'Orden {codigo} completada',
        'cuerpo_txt': (
            'La orden {codigo} ha sido marcada como completada por el técnico.\n'
            'Revisa la evidencia y procede al cierre.\n'
        ),
        'canales_default': ['in_app', 'email'],
    },
    {
        'clave': 'sla_vencido',
        'asunto': 'SLA vencido en orden {codigo}',
        'cuerpo_txt': (
            'La orden {codigo} ({titulo}) ha superado su SLA objetivo.\n'
            'Su prioridad ha sido elevada a urgente. Por favor toma acción.\n'
        ),
        'canales_default': ['email', 'in_app'],
    },
    {
        'clave': 'mantenimiento_proximo',
        'asunto': 'Mantenimiento programado para hoy: {codigo}',
        'cuerpo_txt': (
            'Recordatorio: hoy tienes programado el mantenimiento {codigo} en {instalacion}.\n'
            'Detalle: {titulo}.\n'
        ),
        'canales_default': ['in_app'],
    },
    {
        'clave': 'orden_sin_tecnico',
        'asunto': 'Orden {codigo} sin técnico disponible',
        'cuerpo_txt': (
            'No hay técnicos disponibles en la zona para la orden {codigo}: {titulo}.\n'
            'Asígnala manualmente desde el panel.\n'
        ),
        'canales_default': ['email'],
    },
]


def crear_plantillas(apps, schema_editor):
    Plantilla = apps.get_model('notificaciones', 'PlantillaNotificacion')
    for p in PLANTILLAS:
        Plantilla.objects.update_or_create(
            clave=p['clave'],
            defaults={
                'asunto': p['asunto'],
                'cuerpo_txt': p['cuerpo_txt'],
                'canales_default': p['canales_default'],
                'activo': True,
            },
        )


def borrar_plantillas(apps, schema_editor):
    Plantilla = apps.get_model('notificaciones', 'PlantillaNotificacion')
    Plantilla.objects.filter(clave__in=[p['clave'] for p in PLANTILLAS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('notificaciones', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(crear_plantillas, borrar_plantillas),
    ]
