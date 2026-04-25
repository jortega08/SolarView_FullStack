# Generated manually for Soleim B2B migration plan

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_empresa_instalacion_rolinstalacion'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracionuser',
            name='instalacion',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='configuraciones', to='core.instalacion'),
        ),
    ]
