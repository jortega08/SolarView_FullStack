"""
P2 — Add composite indexes on (instalacion_id, fecha) for Consumo and Bateria.

These are the columns used by all analytical queries and IoT ingestion paths.
The previous migrations only indexed (domicilio, fecha) which helps legacy
paths but not the post-P0 instalacion-based queries.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('telemetria', '0005_make_domicilio_nullable'),
    ]

    operations = [
        # Consumo — most-used analytical pattern: WHERE instalacion_id=X ORDER BY fecha DESC
        migrations.AddIndex(
            model_name='consumo',
            index=models.Index(
                fields=['instalacion', 'fecha'],
                name='idx_consumo_inst_fecha',
            ),
        ),
        # Consumo — source breakdown per installation (comparativa_empresa)
        migrations.AddIndex(
            model_name='consumo',
            index=models.Index(
                fields=['instalacion', 'fuente', 'fecha'],
                name='idx_consumo_inst_fuente_fecha',
            ),
        ),
        # Bateria — latest reading per installation
        migrations.AddIndex(
            model_name='bateria',
            index=models.Index(
                fields=['instalacion', 'fecha_registro'],
                name='idx_bateria_inst_fecha',
            ),
        ),
    ]
