from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tecnicos", "0004_backfill_perfiltecnico_prestador"),
    ]

    operations = [
        migrations.AddField(
            model_name="perfiltecnico",
            name="titulo_academico",
            field=models.CharField(
                blank=True,
                max_length=120,
                help_text="Ej: Ingeniero Electrónico, Técnico en Electricidad Industrial",
            ),
        ),
        migrations.AddField(
            model_name="perfiltecnico",
            name="nivel_educativo",
            field=models.CharField(
                blank=True,
                max_length=32,
                choices=[
                    ("bachiller", "Bachiller"),
                    ("tecnico", "Técnico"),
                    ("tecnologo", "Tecnólogo"),
                    ("profesional", "Profesional"),
                    ("especializacion", "Especialización"),
                    ("maestria", "Maestría"),
                    ("doctorado", "Doctorado"),
                ],
            ),
        ),
        migrations.AddField(
            model_name="perfiltecnico",
            name="certificaciones",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Lista de {nombre, institucion, ano} de certificaciones adicionales.",
            ),
        ),
        migrations.AddField(
            model_name="perfiltecnico",
            name="capacidad_operacion",
            field=models.CharField(
                blank=True,
                default="campo",
                max_length=32,
                choices=[
                    ("supervision", "Solo supervisión"),
                    ("campo", "Trabajo en campo"),
                    ("ambas", "Supervisión y campo"),
                ],
                help_text="Tipo de trabajo que puede realizar el técnico.",
            ),
        ),
    ]
