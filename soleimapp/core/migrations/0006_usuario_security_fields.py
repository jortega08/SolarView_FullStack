"""
Añade campos de seguridad al modelo Usuario:
  - is_active            → permite deshabilitar cuentas sin borrarlas
  - failed_login_attempts → contador anti-fuerza-bruta
  - locked_until          → timestamp hasta el que la cuenta está bloqueada
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_data_migrate_domicilio_to_instalacion"),
    ]

    operations = [
        migrations.AddField(
            model_name="usuario",
            name="is_active",
            field=models.BooleanField(
                default=True,
                help_text="Desactiva la cuenta sin eliminarla.",
            ),
        ),
        migrations.AddField(
            model_name="usuario",
            name="failed_login_attempts",
            field=models.IntegerField(
                default=0,
                help_text="Intentos fallidos consecutivos de inicio de sesión.",
            ),
        ),
        migrations.AddField(
            model_name="usuario",
            name="locked_until",
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text="La cuenta queda bloqueada hasta esta fecha/hora.",
            ),
        ),
    ]
