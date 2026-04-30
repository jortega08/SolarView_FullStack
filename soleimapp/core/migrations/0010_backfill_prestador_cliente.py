from django.db import migrations

DEFAULT_PRESTADOR_NOMBRE = "Prestador por defecto"


def forwards(apps, schema_editor):
    PrestadorServicio = apps.get_model("core", "PrestadorServicio")
    Instalacion = apps.get_model("core", "Instalacion")

    prestador, _ = PrestadorServicio.objects.get_or_create(
        nombre=DEFAULT_PRESTADOR_NOMBRE,
        defaults={"activo": True},
    )

    for instalacion in Instalacion.objects.all().iterator():
        update_fields = []
        if not instalacion.cliente_id and instalacion.empresa_id:
            instalacion.cliente_id = instalacion.empresa_id
            update_fields.append("cliente")
        if not instalacion.prestador_id:
            instalacion.prestador_id = prestador.idprestador
            update_fields.append("prestador")
        if update_fields:
            instalacion.save(update_fields=update_fields)


def backwards(apps, schema_editor):
    # No-op by design: keep backfilled data if the migration is rolled back.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_instalacion_cliente_usuario_empresa_cliente_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
