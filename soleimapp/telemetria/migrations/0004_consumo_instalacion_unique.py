# Generated manually for Soleim B2B migration plan

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_data_migrate_domicilio_to_instalacion'),
        ('telemetria', '0003_telemetria_instalacion_fk'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='consumo',
            unique_together={('instalacion', 'fecha')},
        ),
    ]
