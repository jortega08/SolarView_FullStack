from django.db import models
from core.models import Domicilio
from analitica.models import Puntaje

class Consumo(models.Model):
    idconsumo = models.AutoField(primary_key=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='consumos')
    FUENTES_CONSUMO = (
        ('solar', 'Solar'),
        ('electrica', 'Electrica')
    )
    energia_consumida = models.FloatField(help_text='Energía Consumida en kwH') # kwH
    potencia = models.FloatField(help_text='Potencia en kW')
    
    fuente = models.CharField(max_length=12, choices=FUENTES_CONSUMO, default='electrica')
    costo = models.FloatField(help_text='Costo en moneda local del kwH')
    fecha = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = 'consumo'
        verbose_name = 'Consumo'
        verbose_name_plural = 'Consumos'
        ordering = ['-fecha']
        unique_together = ('domicilio', 'fecha')

    def __str__(self):
        return f"Consumo de {self.energia_consumida} kwH de {self.fuente} del usuario {self.domicilio.usuario.nombre} el {self.fecha.strftime('%Y-%m-%d %H:%M:%S')}"
    
    def calcular_costo(self, tarifa):
        self.costo = self.energia_consumida * tarifa
        self.save()

    #--EFICIENCIA SOLAR--#
    #disparador para cuando el consumo en kwh de energia solar es mayor al de energia electrica dar 100 puntos por día
    def actualizar_puntaje(self):
        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        if self.fuente == 'solar':
            puntaje.puntos += 100
            puntaje.actualizar_puntos()
            puntaje.save()
        elif self.fuente == 'electrica':
            puntaje.puntos -= 50
            puntaje.actualizar_puntos()
            puntaje.save()
    #Si el usuario logra autonomía solar total (100% solar) en un día → +200 pts, si el consumo de red electric es 0 y el de la solar es mayor a 0
    def autonomia_solar(self):
        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        if self.fuente == 'solar' and self.energia_consumida > 0:
            consumo_electrica = Consumo.objects.filter(domicilio=self.domicilio, fuente='electrica', fecha__date=self.fecha.date()).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0
            if consumo_electrica == 0:
                puntaje.puntos += 200
                puntaje.actualizar_puntos()
                puntaje.save()

    #Si se mantiene 3 días seguidos usando más energía solar que eléctrica → +150 pts
    def uso_solar_constante(self):
        from django.utils import timezone
        from datetime import timedelta

        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        hoy = timezone.now().date()
        tres_dias_atras = hoy - timedelta(days=3)

        dias_con_mas_solar = 0

        for i in range(3):
            dia = hoy - timedelta(days=i)
            consumo_solar = Consumo.objects.filter(domicilio=self.domicilio, fuente='solar', fecha__date=dia).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0
            consumo_electrica = Consumo.objects.filter(domicilio=self.domicilio, fuente='electrica', fecha__date=dia).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0

            if consumo_solar > consumo_electrica:
                dias_con_mas_solar += 1

        if dias_con_mas_solar == 3:
            puntaje.puntos += 150
            puntaje.actualizar_puntos()
            puntaje.save()
    #Si se registra una reducción del consumo eléctrico semanal → +120 pts
    def reduccion_consumo_semanal(self):
        from django.utils import timezone
        from datetime import timedelta

        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        hoy = timezone.now().date()
        semana_pasada_inicio = hoy - timedelta(days=7)
        semana_pasada_fin = hoy - timedelta(days=1)

        consumo_semana_actual = Consumo.objects.filter(domicilio=self.domicilio, fuente='electrica', fecha__date__gte=hoy - timedelta(days=7), fecha__date__lte=hoy).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0
        consumo_semana_pasada = Consumo.objects.filter(domicilio=self.domicilio, fuente='electrica', fecha__date__gte=semana_pasada_inicio, fecha__date__lte=semana_pasada_fin).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0

        if consumo_semana_actual < consumo_semana_pasada:
            puntaje.puntos += 120
            puntaje.actualizar_puntos()
            puntaje.save()
    #---PENALIZACIONES--#
    #Si el consumo total diario supera el triple del promedio → -50 pts
    def penalizacion_consumo_diario(self):
        from django.utils import timezone
        from datetime import timedelta

        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        hoy = timezone.now().date()
        consumo_hoy = Consumo.objects.filter(domicilio=self.domicilio, fecha__date=hoy).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0
        consumo_promedio = Consumo.objects.filter(domicilio=self.domicilio).aggregate(models.Avg('energia_consumida'))['energia_consumida__avg'] or 0

        if consumo_promedio > 0 and consumo_hoy > 3 * consumo_promedio:
            puntaje.puntos -= 50
            puntaje.actualizar_puntos()
            puntaje.save()
    #Si se detectan picos de consumo bruscos en menos de 1 hora → -20 pts
    def penalizacion_picos_consumo(self):
        from django.utils import timezone
        from datetime import timedelta

        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        ahora = timezone.now()
        una_hora_atras = ahora - timedelta(hours=1)

        consumos_recientes = Consumo.objects.filter(domicilio=self.domicilio, fecha__gte=una_hora_atras, fecha__lte=ahora).order_by('fecha')

        if consumos_recientes.count() >= 2:
            primer_consumo = consumos_recientes.first().energia_consumida
            ultimo_consumo = consumos_recientes.last().energia_consumida

            if abs(ultimo_consumo - primer_consumo) > (0.5 * primer_consumo):  # Si el cambio es mayor al 50%
                puntaje.puntos -= 20
                puntaje.actualizar_puntos()
                puntaje.save()

    #--LOGROS--#
    #Completar un mes con consumo solar mayor al 60% → +500 pts
    def logro_mes_solar(self):
        from django.utils import timezone
        from datetime import timedelta

        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        hoy = timezone.now().date()
        inicio_mes = hoy - timedelta(days=30)

        consumo_solar = Consumo.objects.filter(domicilio=self.domicilio, fuente='solar', fecha__date__gte=inicio_mes, fecha__date__lte=hoy).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0
        consumo_total = Consumo.objects.filter(domicilio=self.domicilio, fecha__date__gte=inicio_mes, fecha__date__lte=hoy).aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0

        if consumo_total > 0 and (consumo_solar / consumo_total) >= 0.6:
            puntaje.puntos += 500
            puntaje.actualizar_puntos()
            puntaje.save()
    #Alcanzar 1 MWh generado en total → +1000 pts
    def logro_1MWh_generado(self):
        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        consumo_solar_total = Consumo.objects.filter(domicilio=self.domicilio, fuente='solar').aggregate(models.Sum('energia_consumida'))['energia_consumida__sum'] or 0

        if consumo_solar_total >= 1000:  # 1 MWh = 1000 kWh
            puntaje.puntos += 1000
            puntaje.actualizar_puntos()
            puntaje.save()

class Bateria(models.Model):
    idbateria = models.AutoField(primary_key=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='baterias')
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

    def __str__(self):
        # Ajusta esto según lo que tenga Domicilio
        usuario_nombre = getattr(self.domicilio.usuario, "nombre", str(self.domicilio))
        return (
            f"Batería {self.idbateria} - {self.capacidad_bateria} kWh - "
            f"{usuario_nombre} - {self.fecha_registro.strftime('%Y-%m-%d %H:%M:%S')}"
        )
    
    # este debe ser un trigger un disparador que cuando la temperatura supere 40ºC mande una alerta
    def alerta_temperatura(self):
        if self.temperatura > 40:
            from alerta.models import Alerta, TipoAlerta
            tipo_alerta, created = TipoAlerta.objects.get_or_create(
                nombre='Alerta de Temperatura',
                descripcion='La temperatura de la batería ha superado el umbral permitido.'
            )
            Alerta.objects.create(
                tipoalerta=tipo_alerta,
                domicilio=self.domicilio,
                mensaje=f'La temperatura de la batería es {self.temperatura}°C, que supera el umbral de {40}°C.'
            )

    # este debe ser un trigger un disparador que cuando el porcentaje de carga sea menor al 20% mande una alerta
    def alerta_carga(self):
        if self.porcentaje_carga < 20:
            from alerta.models import Alerta, TipoAlerta
            tipo_alerta, created = TipoAlerta.objects.get_or_create(
                nombre='Alerta de Carga Baja',
                descripcion='El porcentaje de carga de la batería ha caído por debajo del umbral permitido.'
            )
            Alerta.objects.create(
                tipoalerta=tipo_alerta,
                domicilio=self.domicilio,
                mensaje=f'El porcentaje de carga de la batería es {self.porcentaje_carga}%, que está por debajo del umbral de {20}%.'
            )
    
    #Si el rendimiento del panel solar (kWh generados / capacidad total) supera el 90% → +50 pts
    def actualizar_puntaje_rendimiento(self, energia_generada):
        puntaje, created = Puntaje.objects.get_or_create(domicilio=self.domicilio)
        capacidad_total = self.capacidad_bateria
        rendimiento = (energia_generada / capacidad_total) * 100 if capacidad_total > 0 else 0
        if rendimiento > 90:
            puntaje.puntos += 50
            puntaje.actualizar_puntos()
            puntaje.save()