"""Añade el FK `Mantenimiento.orden_trabajo → ordenes.OrdenTrabajo` (ciclo resuelto)."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mantenimiento', '0001_initial'),
        ('ordenes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='mantenimiento',
            name='orden_trabajo',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='_mantenimiento_origen',
                to='ordenes.ordentrabajo',
            ),
        ),
    ]
