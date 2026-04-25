import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('telemetria', '0004_consumo_instalacion_unique'),
    ]

    operations = [
        migrations.AlterField(
            model_name='consumo',
            name='domicilio',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='consumos',
                to='core.domicilio',
            ),
        ),
        migrations.AlterField(
            model_name='bateria',
            name='domicilio',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='baterias',
                to='core.domicilio',
            ),
        ),
    ]
