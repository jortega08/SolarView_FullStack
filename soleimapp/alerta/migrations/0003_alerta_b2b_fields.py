# Generated manually for Soleim B2B migration plan

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("alerta", "0002_initial"),
        ("core", "0003_empresa_instalacion_rolinstalacion"),
    ]

    operations = [
        migrations.AddField(
            model_name="alerta",
            name="instalacion",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="alertas",
                to="core.instalacion",
            ),
        ),
        migrations.AddField(
            model_name="alerta",
            name="severidad",
            field=models.CharField(
                choices=[
                    ("critica", "Crítica"),
                    ("alta", "Alta"),
                    ("media", "Media"),
                    ("baja", "Baja"),
                ],
                default="media",
                max_length=8,
            ),
        ),
        migrations.AddField(
            model_name="alerta",
            name="causa_probable",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="alerta",
            name="accion_sugerida",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="alerta",
            name="resuelta_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="alertas_resueltas",
                to="core.usuario",
            ),
        ),
    ]
