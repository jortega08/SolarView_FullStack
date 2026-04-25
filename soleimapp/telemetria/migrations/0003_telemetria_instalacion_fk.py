# Generated manually for Soleim B2B migration plan

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_empresa_instalacion_rolinstalacion'),
        ('telemetria', '0002_alter_consumo_costo_bateria_idx_bateria_dom_fecha_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='consumo',
            name='instalacion',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='consumos', to='core.instalacion'),
        ),
        migrations.AddField(
            model_name='bateria',
            name='instalacion',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='baterias', to='core.instalacion'),
        ),
    ]
