"""Migración inicial: PlantillaNotificacion + Notificacion."""
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0006_usuario_security_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlantillaNotificacion',
            fields=[
                ('idplantilla', models.AutoField(primary_key=True, serialize=False)),
                ('clave', models.CharField(max_length=64, unique=True)),
                ('asunto', models.CharField(max_length=255)),
                ('cuerpo_txt', models.TextField()),
                ('cuerpo_html', models.TextField(blank=True)),
                ('canales_default', models.JSONField(default=list)),
                ('activo', models.BooleanField(default=True)),
                ('creado_at', models.DateTimeField(auto_now_add=True)),
                ('actualizado_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Plantilla de notificación',
                'verbose_name_plural': 'Plantillas de notificación',
                'db_table': 'plantilla_notificacion',
            },
        ),
        migrations.CreateModel(
            name='Notificacion',
            fields=[
                ('idnotificacion', models.AutoField(primary_key=True, serialize=False)),
                ('canal', models.CharField(
                    choices=[
                        ('in_app', 'In-app'), ('email', 'Email'), ('sms', 'SMS'),
                        ('push', 'Push'), ('webhook', 'Webhook'),
                    ],
                    default='in_app', max_length=12,
                )),
                ('asunto', models.CharField(max_length=255)),
                ('cuerpo', models.TextField()),
                ('enlace', models.URLField(blank=True)),
                ('estado', models.CharField(
                    choices=[
                        ('pendiente', 'Pendiente'), ('enviada', 'Enviada'),
                        ('fallida', 'Fallida'), ('leida', 'Leída'),
                    ],
                    default='pendiente', max_length=12,
                )),
                ('intentos', models.IntegerField(default=0)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('creada_at', models.DateTimeField(auto_now_add=True)),
                ('enviada_at', models.DateTimeField(blank=True, null=True)),
                ('leida_at', models.DateTimeField(blank=True, null=True)),
                ('plantilla', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=models.deletion.SET_NULL,
                    related_name='notificaciones',
                    to='notificaciones.plantillanotificacion',
                )),
                ('usuario', models.ForeignKey(
                    on_delete=models.deletion.CASCADE,
                    related_name='notificaciones',
                    to='core.usuario',
                )),
            ],
            options={
                'verbose_name': 'Notificación',
                'verbose_name_plural': 'Notificaciones',
                'db_table': 'notificacion',
                'ordering': ['-creada_at'],
                'indexes': [
                    models.Index(fields=['usuario', 'estado', '-creada_at'], name='notif_usr_est_idx'),
                    models.Index(fields=['canal', 'estado'], name='notif_canal_est_idx'),
                ],
            },
        ),
    ]
