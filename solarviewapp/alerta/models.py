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
    idalerta = models.AutoField(primary_key=True)
    tipoalerta = models.ForeignKey(TipoAlerta, on_delete=models.PROTECT, related_name='alertas', null=True, blank=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='alertas')
    mensaje = models.CharField(max_length=255)
    fecha = models.DateTimeField(auto_now_add=True)
    
    ESTADOS_ALERTA = (
        ('activa', 'Activa'),
        ('resuelta', 'Resuelta'),
        ('cancelada', 'Cancelada'),
    )

    estado = models.CharField(max_length=10, choices=ESTADOS_ALERTA, default='activa')

    class Meta:
        db_table = 'alerta'
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.estado.upper()} - {self.mensaje[:50]} - {self.fecha.strftime('%Y-%m-%d %H:%M:%S')}"