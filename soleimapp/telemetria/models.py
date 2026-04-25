from django.db import models

from core.models import Domicilio


class Consumo(models.Model):
    idconsumo = models.AutoField(primary_key=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='consumos', null=True, blank=True)
    instalacion = models.ForeignKey('core.Instalacion', on_delete=models.CASCADE, related_name='consumos', null=True, blank=True)
    FUENTES_CONSUMO = (
        ('solar', 'Solar'),
        ('electrica', 'Electrica'),
    )
    energia_consumida = models.FloatField(help_text='Energía Consumida en kwH')
    potencia = models.FloatField(help_text='Potencia en kW')
    fuente = models.CharField(max_length=12, choices=FUENTES_CONSUMO, default='electrica')
    costo = models.FloatField(help_text='Costo en moneda local del kwH')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'consumo'
        verbose_name = 'Consumo'
        verbose_name_plural = 'Consumos'
        ordering = ['-fecha']
        unique_together = ('instalacion', 'fecha')
        indexes = [
            models.Index(fields=['domicilio', 'fecha'], name='idx_consumo_dom_fecha'),
            models.Index(fields=['domicilio', 'fuente', 'fecha'], name='idx_consumo_dom_fuente_fecha'),
            models.Index(fields=['fecha'], name='idx_consumo_fecha'),
        ]

    def __str__(self):
        if self.instalacion:
            sujeto = self.instalacion.nombre
        elif self.domicilio:
            sujeto = self.domicilio.usuario.nombre
        else:
            sujeto = f'consumo-{self.idconsumo}'
        return f"Consumo de {self.energia_consumida} kWh ({self.fuente}) en {sujeto} el {self.fecha.strftime('%Y-%m-%d %H:%M:%S')}"

    def calcular_costo(self, tarifa):
        self.costo = self.energia_consumida * tarifa
        self.save()


class Bateria(models.Model):
    idbateria = models.AutoField(primary_key=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='baterias', null=True, blank=True)
    instalacion = models.ForeignKey('core.Instalacion', on_delete=models.CASCADE, related_name='baterias', null=True, blank=True)
    voltaje = models.FloatField(help_text='Voltaje VCA en V')
    corriente = models.FloatField(help_text='Corriente en A')
    temperatura = models.FloatField(help_text='Temperatura en °C')
    capacidad_bateria = models.FloatField(help_text='Capacidad de la batería en kWh')
    porcentaje_carga = models.FloatField(help_text='Porcentaje de carga en %')
    tiempo_restante = models.FloatField(help_text='Tiempo restante en horas')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bateria'
        verbose_name = 'Bateria'
        verbose_name_plural = 'Baterias'
        indexes = [
            models.Index(fields=['domicilio', 'fecha_registro'], name='idx_bateria_dom_fecha'),
            models.Index(fields=['-fecha_registro'], name='idx_bateria_fecha_desc'),
        ]

    def __str__(self):
        if self.instalacion:
            sujeto = self.instalacion.nombre
        elif self.domicilio:
            sujeto = self.domicilio.usuario.nombre
        else:
            sujeto = f'bateria-{self.idbateria}'
        return (
            f"Batería {self.idbateria} - {self.capacidad_bateria} kWh - "
            f"{sujeto} - {self.fecha_registro.strftime('%Y-%m-%d %H:%M:%S')}"
        )

    def alerta_temperatura(self):
        if self.temperatura > 40:
            from alerta.models import Alerta, TipoAlerta

            tipo_alerta, _ = TipoAlerta.objects.get_or_create(
                nombre='Alerta de Temperatura',
                descripcion='La temperatura de la batería ha superado el umbral permitido.',
            )
            Alerta.objects.create(
                tipoalerta=tipo_alerta,
                domicilio=self.domicilio,
                instalacion=self.instalacion,
                mensaje=f'La temperatura de la batería es {self.temperatura}°C, que supera el umbral de 40°C.',
                severidad='critica' if self.temperatura >= 45 else 'alta',
                causa_probable='Posible sobrecarga, ventilación insuficiente o falla del sistema de gestión.',
                accion_sugerida='Inspeccionar el sistema de enfriamiento y reducir la carga mientras se revisa la batería.',
            )

    def alerta_carga(self):
        if self.porcentaje_carga < 20:
            from alerta.models import Alerta, TipoAlerta

            tipo_alerta, _ = TipoAlerta.objects.get_or_create(
                nombre='Alerta de Carga Baja',
                descripcion='El porcentaje de carga de la batería ha caído por debajo del umbral permitido.',
            )
            Alerta.objects.create(
                tipoalerta=tipo_alerta,
                domicilio=self.domicilio,
                instalacion=self.instalacion,
                mensaje=f'El porcentaje de carga de la batería es {self.porcentaje_carga}%, por debajo del umbral de 20%.',
                severidad='critica' if self.porcentaje_carga <= 10 else 'media',
                causa_probable='Descarga sostenida, baja generación solar o demanda elevada en la instalación.',
                accion_sugerida='Verificar fuentes de carga, reducir consumo no crítico y programar mantenimiento preventivo.',
            )
