"""Migración inicial: ContratoServicio, PlanMantenimiento, Mantenimiento.

NOTA: el FK `Mantenimiento.orden_trabajo` se añade en `0002_mantenimiento_orden_trabajo`
(después de que la app `ordenes` exista) para evitar dependencia cíclica.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0007_instalacion_mantenimiento_fields'),
        ('tecnicos', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContratoServicio',
            fields=[
                ('idcontrato', models.AutoField(primary_key=True, serialize=False)),
                ('nivel', models.CharField(
                    choices=[('basico', 'Básico'), ('estandar', 'Estándar'), ('premium', 'Premium')],
                    default='estandar', max_length=16,
                )),
                ('horas_respuesta', models.IntegerField(default=24, help_text='SLA en horas para alertas críticas.')),
                ('frecuencia_preventivo_dias', models.IntegerField(default=30, help_text='Frecuencia de mantenimientos preventivos en días.')),
                ('fecha_inicio', models.DateField()),
                ('fecha_fin', models.DateField(blank=True, null=True)),
                ('activo', models.BooleanField(default=True)),
                ('creado_at', models.DateTimeField(auto_now_add=True)),
                ('actualizado_at', models.DateTimeField(auto_now=True)),
                ('instalacion', models.OneToOneField(
                    on_delete=models.deletion.CASCADE,
                    related_name='contrato',
                    to='core.instalacion',
                )),
            ],
            options={
                'verbose_name': 'Contrato de servicio',
                'verbose_name_plural': 'Contratos de servicio',
                'db_table': 'contrato_servicio',
            },
        ),
        migrations.CreateModel(
            name='PlanMantenimiento',
            fields=[
                ('idplan', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=128)),
                ('tipo_sistema', models.CharField(
                    choices=[('hibrido', 'Híbrido'), ('off_grid', 'Off Grid'), ('grid_tie', 'Grid Tie')],
                    max_length=10,
                )),
                ('frecuencia_dias', models.IntegerField(default=30, help_text='Cada cuántos días aplica este plan.')),
                ('duracion_estimada_horas', models.DecimalField(decimal_places=2, default=2, max_digits=5)),
                ('checklist', models.JSONField(default=list)),
                ('activo', models.BooleanField(default=True)),
                ('creado_at', models.DateTimeField(auto_now_add=True)),
                ('especialidad_requerida', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=models.deletion.SET_NULL,
                    related_name='planes_mantenimiento',
                    to='tecnicos.especialidad',
                )),
            ],
            options={
                'verbose_name': 'Plan de mantenimiento',
                'verbose_name_plural': 'Planes de mantenimiento',
                'db_table': 'plan_mantenimiento',
                'indexes': [
                    models.Index(fields=['tipo_sistema', 'activo'], name='plan_mant_tipo_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='Mantenimiento',
            fields=[
                ('idmantenimiento', models.AutoField(primary_key=True, serialize=False)),
                ('fecha_programada', models.DateField()),
                ('estado', models.CharField(
                    choices=[
                        ('programado', 'Programado'),
                        ('en_proceso', 'En proceso'),
                        ('completado', 'Completado'),
                        ('cancelado', 'Cancelado'),
                    ],
                    default='programado', max_length=12,
                )),
                ('notas', models.TextField(blank=True)),
                ('creado_at', models.DateTimeField(auto_now_add=True)),
                ('instalacion', models.ForeignKey(
                    on_delete=models.deletion.CASCADE,
                    related_name='mantenimientos',
                    to='core.instalacion',
                )),
                ('plan', models.ForeignKey(
                    on_delete=models.deletion.PROTECT,
                    related_name='mantenimientos',
                    to='mantenimiento.planmantenimiento',
                )),
                # `orden_trabajo` se añade en 0002_mantenimiento_orden_trabajo
            ],
            options={
                'verbose_name': 'Mantenimiento programado',
                'verbose_name_plural': 'Mantenimientos programados',
                'db_table': 'mantenimiento',
                'ordering': ['fecha_programada'],
                'indexes': [
                    models.Index(fields=['instalacion', 'estado'], name='mant_inst_est_idx'),
                    models.Index(fields=['fecha_programada', 'estado'], name='mant_fecha_est_idx'),
                ],
            },
        ),
    ]
