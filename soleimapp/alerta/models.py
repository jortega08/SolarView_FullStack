from django.db import models

from core.models import Domicilio


class TipoAlerta(models.Model):
    idtipoalerta = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=64)
    descripcion = models.CharField(max_length=255)

    class Meta:
        db_table = 'tipoalerta'
        verbose_name = 'Tipo de Alerta'
        verbose_name_plural = 'Tipos de Alerta'

    def __str__(self):
        return self.descripcion


class Alerta(models.Model):
    ESTADOS_ALERTA = (
        ('activa', 'Activa'),
        ('resuelta', 'Resuelta'),
        ('cancelada', 'Cancelada'),
    )
    SEVERIDADES = (
        ('critica', 'Crítica'),
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    )

    idalerta = models.AutoField(primary_key=True)
    tipoalerta = models.ForeignKey(TipoAlerta, on_delete=models.PROTECT, related_name='alertas', null=True, blank=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='alertas', null=True, blank=True)
    instalacion = models.ForeignKey('core.Instalacion', on_delete=models.CASCADE, related_name='alertas', null=True, blank=True)
    mensaje = models.CharField(max_length=255)
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=10, choices=ESTADOS_ALERTA, default='activa')
    severidad = models.CharField(max_length=8, choices=SEVERIDADES, default='media')
    causa_probable = models.CharField(max_length=255, blank=True, default='')
    accion_sugerida = models.CharField(max_length=255, blank=True, default='')
    resuelta_por = models.ForeignKey(
        'core.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_resueltas',
    )

    class Meta:
        db_table = 'alerta'
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.estado.upper()} - {self.mensaje[:50]} - {self.fecha.strftime('%Y-%m-%d %H:%M:%S')}"
