# Generated for Soleim Fase 4C on 2026-05-04

import django.db.models.deletion
from django.db import migrations, models


def backfill_empresa_prestador(apps, schema_editor):
    Empresa = apps.get_model("core", "Empresa")
    Instalacion = apps.get_model("core", "Instalacion")

    for empresa in Empresa.objects.filter(prestador__isnull=True).iterator():
        prestador_id = (
            Instalacion.objects.filter(cliente_id=empresa.idempresa, prestador__isnull=False)
            .values_list("prestador_id", flat=True)
            .first()
        )
        if prestador_id is None:
            prestador_id = (
                Instalacion.objects.filter(empresa_id=empresa.idempresa, prestador__isnull=False)
                .values_list("prestador_id", flat=True)
                .first()
            )
        if prestador_id:
            empresa.prestador_id = prestador_id
            empresa.save(update_fields=["prestador"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_usuario_es_admin_prestador_invitacionprestador"),
    ]

    operations = [
        migrations.AddField(
            model_name="empresa",
            name="prestador",
            field=models.ForeignKey(
                blank=True,
                help_text="Prestador que administra esta empresa cliente.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="clientes",
                to="core.prestadorservicio",
            ),
        ),
        migrations.CreateModel(
            name="InvitacionCliente",
            fields=[
                ("idinvitacion", models.AutoField(primary_key=True, serialize=False)),
                ("codigo", models.CharField(max_length=64, unique=True)),
                (
                    "email_destinatario",
                    models.EmailField(blank=True, max_length=254),
                ),
                (
                    "tipo_acceso",
                    models.CharField(
                        choices=[("cliente", "Cliente"), ("viewer", "Visor")],
                        default="cliente",
                        max_length=20,
                    ),
                ),
                ("vigente_hasta", models.DateTimeField()),
                ("revocada", models.BooleanField(default=False)),
                ("fecha_creacion", models.DateTimeField(auto_now_add=True)),
                ("fecha_uso", models.DateTimeField(blank=True, null=True)),
                (
                    "creada_por",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="invitaciones_cliente_emitidas",
                        to="core.usuario",
                    ),
                ),
                (
                    "empresa_cliente",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invitaciones_cliente",
                        to="core.empresa",
                    ),
                ),
                (
                    "prestador",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invitaciones_cliente",
                        to="core.prestadorservicio",
                    ),
                ),
                (
                    "usado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="invitacion_cliente_usada",
                        to="core.usuario",
                    ),
                ),
            ],
            options={
                "verbose_name": "Invitacion de cliente",
                "verbose_name_plural": "Invitaciones de cliente",
                "db_table": "invitacion_cliente",
                "ordering": ["-fecha_creacion"],
                "indexes": [
                    models.Index(fields=["codigo"], name="idx_inv_cliente_codigo"),
                    models.Index(fields=["prestador"], name="idx_inv_cliente_prestador"),
                    models.Index(fields=["empresa_cliente"], name="idx_inv_cliente_empresa"),
                ],
            },
        ),
        migrations.RunPython(backfill_empresa_prestador, migrations.RunPython.noop),
    ]
