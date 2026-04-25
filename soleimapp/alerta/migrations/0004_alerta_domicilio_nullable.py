import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alerta', '0003_alerta_b2b_fields'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='alerta',
            name='domicilio',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='alertas',
                to='core.domicilio',
            ),
        ),
    ]
