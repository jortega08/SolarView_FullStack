# Generated manually for Soleim B2B migration plan

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventoAuditoria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('accion', models.CharField(max_length=64)),
                ('entidad', models.CharField(max_length=64)),
                ('entidad_id', models.IntegerField(blank=True, null=True)),
                ('detalle', models.JSONField(default=dict)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('usuario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.usuario')),
            ],
            options={
                'db_table': 'evento_auditoria',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='eventoauditoria',
            index=models.Index(fields=['entidad', 'entidad_id'], name='evento_audi_entidad_idx'),
        ),
        migrations.AddIndex(
            model_name='eventoauditoria',
            index=models.Index(fields=['usuario', 'timestamp'], name='evento_audi_usuario_idx'),
        ),
    ]
