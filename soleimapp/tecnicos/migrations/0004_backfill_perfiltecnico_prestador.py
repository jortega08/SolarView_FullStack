from django.db import migrations

DEFAULT_PRESTADOR_NOMBRE = "Prestador por defecto"


def forwards(apps, schema_editor):
    PrestadorServicio = apps.get_model("core", "PrestadorServicio")
    PerfilTecnico = apps.get_model("tecnicos", "PerfilTecnico")
    Usuario = apps.get_model("core", "Usuario")

    prestador, _ = PrestadorServicio.objects.get_or_create(
        nombre=DEFAULT_PRESTADOR_NOMBRE,
        defaults={"activo": True},
    )

    for perfil in PerfilTecnico.objects.select_related("usuario").all().iterator():
        if not perfil.prestador_id:
            perfil.prestador_id = prestador.idprestador
            perfil.save(update_fields=["prestador"])
        if perfil.usuario_id:
            Usuario.objects.filter(
                idusuario=perfil.usuario_id,
                prestador__isnull=True,
            ).update(prestador_id=perfil.prestador_id)


def backwards(apps, schema_editor):
    # No-op by design: keep backfilled data if the migration is rolled back.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0010_backfill_prestador_cliente"),
        ("tecnicos", "0003_perfiltecnico_prestador"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
