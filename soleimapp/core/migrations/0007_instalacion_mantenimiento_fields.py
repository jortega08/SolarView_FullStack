"""Añade campos operativos de mantenimiento a `Instalacion`."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_usuario_security_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='instalacion',
            name='ultimo_mantenimiento',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='instalacion',
            name='proximo_mantenimiento',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='instalacion',
            name='garantia_hasta',
            field=models.DateField(blank=True, null=True),
        ),
    ]
