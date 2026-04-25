# Generated manually for Soleim B2B migration plan

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_alter_usuario_contrasena'),
    ]

    operations = [
        migrations.CreateModel(
            name='Empresa',
            fields=[
                ('idempresa', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=255)),
                ('nit', models.CharField(max_length=20, unique=True)),
                ('sector', models.CharField(blank=True, max_length=100)),
                ('fecha_registro', models.DateTimeField(auto_now_add=True)),
                ('ciudad', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='empresas', to='core.ciudad')),
            ],
            options={
                'verbose_name': 'Empresa',
                'verbose_name_plural': 'Empresas',
                'db_table': 'empresa',
            },
        ),
        migrations.CreateModel(
            name='Instalacion',
            fields=[
                ('idinstalacion', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=255)),
                ('direccion', models.CharField(blank=True, max_length=255)),
                ('tipo_sistema', models.CharField(choices=[('hibrido', 'Híbrido'), ('off_grid', 'Off Grid'), ('grid_tie', 'Grid Tie')], default='hibrido', max_length=10)),
                ('capacidad_panel_kw', models.FloatField(default=0)),
                ('capacidad_bateria_kwh', models.FloatField(default=0)),
                ('fecha_instalacion', models.DateField(blank=True, null=True)),
                ('estado', models.CharField(choices=[('activa', 'Activa'), ('inactiva', 'Inactiva'), ('mantenimiento', 'Mantenimiento')], default='activa', max_length=15)),
                ('ciudad', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='instalaciones', to='core.ciudad')),
                ('empresa', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='instalaciones', to='core.empresa')),
            ],
            options={
                'verbose_name': 'Instalación',
                'verbose_name_plural': 'Instalaciones',
                'db_table': 'instalacion',
            },
        ),
        migrations.CreateModel(
            name='RolInstalacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rol', models.CharField(choices=[('admin_empresa', 'Admin'), ('operador', 'Operador'), ('viewer', 'Viewer')], default='viewer', max_length=20)),
                ('instalacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='roles', to='core.instalacion')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='roles_instalacion', to='core.usuario')),
            ],
            options={
                'verbose_name': 'Rol por instalación',
                'verbose_name_plural': 'Roles por instalación',
                'db_table': 'rol_instalacion',
                'unique_together': {('usuario', 'instalacion')},
            },
        ),
    ]
