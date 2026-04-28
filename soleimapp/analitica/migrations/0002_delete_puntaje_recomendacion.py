# Generated manually for Soleim B2B migration plan

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("telemetria", "0003_telemetria_instalacion_fk"),
        ("analitica", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(name="Puntaje"),
        migrations.DeleteModel(name="Recomendacion"),
    ]
