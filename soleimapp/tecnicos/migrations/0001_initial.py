"""Migración inicial de la app `tecnicos`: Especialidad y PerfilTecnico."""

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0006_usuario_security_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="Especialidad",
            fields=[
                ("idespecialidad", models.AutoField(primary_key=True, serialize=False)),
                ("nombre", models.CharField(max_length=64, unique=True)),
                ("descripcion", models.CharField(blank=True, max_length=255)),
            ],
            options={
                "verbose_name": "Especialidad",
                "verbose_name_plural": "Especialidades",
                "db_table": "especialidad",
                "ordering": ["nombre"],
            },
        ),
        migrations.CreateModel(
            name="PerfilTecnico",
            fields=[
                ("idperfil", models.AutoField(primary_key=True, serialize=False)),
                ("cedula", models.CharField(max_length=32, unique=True)),
                ("telefono", models.CharField(blank=True, max_length=32)),
                (
                    "disponible",
                    models.BooleanField(
                        default=True,
                        help_text="Si el técnico está disponible para nuevas asignaciones.",
                    ),
                ),
                ("licencia_vence", models.DateField(blank=True, null=True)),
                ("notas", models.TextField(blank=True)),
                ("creado_at", models.DateTimeField(auto_now_add=True)),
                ("actualizado_at", models.DateTimeField(auto_now=True)),
                (
                    "empresa",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="tecnicos",
                        to="core.empresa",
                    ),
                ),
                (
                    "especialidades",
                    models.ManyToManyField(
                        blank=True,
                        related_name="tecnicos",
                        to="tecnicos.especialidad",
                    ),
                ),
                (
                    "usuario",
                    models.OneToOneField(
                        on_delete=models.deletion.CASCADE,
                        related_name="perfil_tecnico",
                        to="core.usuario",
                    ),
                ),
                (
                    "zonas",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Ciudades donde el técnico puede ser despachado.",
                        related_name="tecnicos",
                        to="core.ciudad",
                    ),
                ),
            ],
            options={
                "verbose_name": "Perfil de técnico",
                "verbose_name_plural": "Perfiles de técnico",
                "db_table": "perfil_tecnico",
                "indexes": [
                    models.Index(
                        fields=["empresa", "disponible"], name="perfil_emp_disp_idx"
                    ),
                ],
            },
        ),
    ]
