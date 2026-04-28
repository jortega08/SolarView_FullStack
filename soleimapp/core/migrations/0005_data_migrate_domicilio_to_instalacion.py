# Generated manually for Soleim B2B migration plan

from django.db import migrations


def forwards(apps, schema_editor):
    Domicilio = apps.get_model("core", "Domicilio")
    Empresa = apps.get_model("core", "Empresa")
    Instalacion = apps.get_model("core", "Instalacion")
    RolInstalacion = apps.get_model("core", "RolInstalacion")
    ConfiguracionUser = apps.get_model("core", "ConfiguracionUser")
    Consumo = apps.get_model("telemetria", "Consumo")
    Bateria = apps.get_model("telemetria", "Bateria")
    Alerta = apps.get_model("alerta", "Alerta")

    for dom in Domicilio.objects.select_related("usuario", "ciudad").all():
        empresa, _ = Empresa.objects.get_or_create(
            nit=f"MIGRADO-{dom.iddomicilio}",
            defaults={
                "nombre": f"Empresa {dom.usuario.nombre}",
                "ciudad_id": dom.ciudad_id,
            },
        )
        inst, _ = Instalacion.objects.get_or_create(
            empresa_id=empresa.idempresa,
            nombre=f"Sede {dom.iddomicilio}",
            defaults={"ciudad_id": dom.ciudad_id},
        )
        RolInstalacion.objects.get_or_create(
            usuario_id=dom.usuario_id,
            instalacion_id=inst.idinstalacion,
            defaults={"rol": "admin_empresa"},
        )
        Consumo.objects.filter(domicilio_id=dom.iddomicilio).update(
            instalacion_id=inst.idinstalacion
        )
        Bateria.objects.filter(domicilio_id=dom.iddomicilio).update(
            instalacion_id=inst.idinstalacion
        )
        Alerta.objects.filter(domicilio_id=dom.iddomicilio).update(
            instalacion_id=inst.idinstalacion
        )
        ConfiguracionUser.objects.filter(domicilio_id=dom.iddomicilio).update(
            instalacion_id=inst.idinstalacion
        )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_configuracionuser_instalacion"),
        ("alerta", "0003_alerta_b2b_fields"),
        ("telemetria", "0003_telemetria_instalacion_fk"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
