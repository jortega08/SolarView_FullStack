"""Migración inicial: OrdenTrabajo, ComentarioOrden, EvidenciaOrden."""

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0007_instalacion_mantenimiento_fields"),
        ("alerta", "0004_alerta_domicilio_nullable"),
        ("mantenimiento", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrdenTrabajo",
            fields=[
                ("idorden", models.AutoField(primary_key=True, serialize=False)),
                (
                    "codigo",
                    models.CharField(editable=False, max_length=24, unique=True),
                ),
                (
                    "tipo",
                    models.CharField(
                        choices=[
                            ("correctivo", "Correctivo"),
                            ("preventivo", "Preventivo"),
                            ("inspeccion", "Inspección"),
                            ("instalacion", "Instalación"),
                        ],
                        default="correctivo",
                        max_length=12,
                    ),
                ),
                (
                    "prioridad",
                    models.CharField(
                        choices=[
                            ("urgente", "Urgente"),
                            ("alta", "Alta"),
                            ("media", "Media"),
                            ("baja", "Baja"),
                        ],
                        default="media",
                        max_length=8,
                    ),
                ),
                (
                    "estado",
                    models.CharField(
                        choices=[
                            ("abierta", "Abierta"),
                            ("asignada", "Asignada"),
                            ("en_progreso", "En progreso"),
                            ("completada", "Completada"),
                            ("cerrada", "Cerrada"),
                            ("cancelada", "Cancelada"),
                        ],
                        default="abierta",
                        max_length=12,
                    ),
                ),
                ("titulo", models.CharField(max_length=255)),
                ("descripcion", models.TextField(blank=True)),
                ("notas_resolucion", models.TextField(blank=True)),
                ("sla_objetivo_horas", models.IntegerField(default=24)),
                ("creada_at", models.DateTimeField(auto_now_add=True)),
                ("asignada_at", models.DateTimeField(blank=True, null=True)),
                ("iniciada_at", models.DateTimeField(blank=True, null=True)),
                ("completada_at", models.DateTimeField(blank=True, null=True)),
                ("cerrada_at", models.DateTimeField(blank=True, null=True)),
                (
                    "alerta",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="ordenes",
                        to="alerta.alerta",
                    ),
                ),
                (
                    "asignado_a",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="ordenes_asignadas",
                        to="core.usuario",
                    ),
                ),
                (
                    "creado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="ordenes_creadas",
                        to="core.usuario",
                    ),
                ),
                (
                    "instalacion",
                    models.ForeignKey(
                        on_delete=models.deletion.PROTECT,
                        related_name="ordenes",
                        to="core.instalacion",
                    ),
                ),
                (
                    "mantenimiento",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="_orden",
                        to="mantenimiento.mantenimiento",
                    ),
                ),
            ],
            options={
                "verbose_name": "Orden de trabajo",
                "verbose_name_plural": "Órdenes de trabajo",
                "db_table": "orden_trabajo",
                "ordering": ["-creada_at"],
                "indexes": [
                    models.Index(
                        fields=["instalacion", "estado"], name="ot_inst_est_idx"
                    ),
                    models.Index(
                        fields=["asignado_a", "estado"], name="ot_asig_est_idx"
                    ),
                    models.Index(
                        fields=["estado", "prioridad", "creada_at"],
                        name="ot_est_prio_fch_idx",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="ComentarioOrden",
            fields=[
                ("idcomentario", models.AutoField(primary_key=True, serialize=False)),
                (
                    "tipo",
                    models.CharField(
                        choices=[
                            ("comentario", "Comentario"),
                            ("cambio_estado", "Cambio de estado"),
                            ("sistema", "Sistema"),
                        ],
                        default="comentario",
                        max_length=16,
                    ),
                ),
                ("texto", models.TextField()),
                ("creado_at", models.DateTimeField(auto_now_add=True)),
                (
                    "orden",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="comentarios",
                        to="ordenes.ordentrabajo",
                    ),
                ),
                (
                    "usuario",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="comentarios_orden",
                        to="core.usuario",
                    ),
                ),
            ],
            options={
                "verbose_name": "Comentario de orden",
                "verbose_name_plural": "Comentarios de orden",
                "db_table": "comentario_orden",
                "ordering": ["creado_at"],
                "indexes": [
                    models.Index(fields=["orden", "creado_at"], name="com_ord_fch_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="EvidenciaOrden",
            fields=[
                ("idevidencia", models.AutoField(primary_key=True, serialize=False)),
                (
                    "tipo",
                    models.CharField(
                        choices=[
                            ("foto", "Foto"),
                            ("firma", "Firma del cliente"),
                            ("documento", "Documento"),
                        ],
                        default="foto",
                        max_length=12,
                    ),
                ),
                ("archivo", models.FileField(upload_to="ordenes/%Y/%m/")),
                ("descripcion", models.CharField(blank=True, max_length=255)),
                ("creado_at", models.DateTimeField(auto_now_add=True)),
                (
                    "orden",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="evidencias",
                        to="ordenes.ordentrabajo",
                    ),
                ),
                (
                    "subido_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="evidencias_subidas",
                        to="core.usuario",
                    ),
                ),
            ],
            options={
                "verbose_name": "Evidencia de orden",
                "verbose_name_plural": "Evidencias de orden",
                "db_table": "evidencia_orden",
                "ordering": ["-creado_at"],
                "indexes": [
                    models.Index(fields=["orden", "tipo"], name="evi_ord_tipo_idx"),
                ],
            },
        ),
    ]
