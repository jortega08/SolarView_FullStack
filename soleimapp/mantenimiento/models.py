from django.db import models


class ContratoServicio(models.Model):
    """
    Contrato de servicio asociado a una instalación.
    Define el SLA de respuesta y la frecuencia de mantenimientos preventivos.
    """
    NIVELES = (
        ('basico', 'Básico'),
        ('estandar', 'Estándar'),
        ('premium', 'Premium'),
    )

    idcontrato = models.AutoField(primary_key=True)
    instalacion = models.OneToOneField(
        'core.Instalacion',
        on_delete=models.CASCADE,
        related_name='contrato',
    )
    nivel = models.CharField(max_length=16, choices=NIVELES, default='estandar')
    horas_respuesta = models.IntegerField(
        default=24,
        help_text='SLA en horas para alertas críticas.',
    )
    frecuencia_preventivo_dias = models.IntegerField(
        default=30,
        help_text='Frecuencia de mantenimientos preventivos en días.',
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    creado_at = models.DateTimeField(auto_now_add=True)
    actualizado_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contrato_servicio'
        verbose_name = 'Contrato de servicio'
        verbose_name_plural = 'Contratos de servicio'

    def __str__(self):
        return f'Contrato {self.nivel} — {self.instalacion.nombre}'


class PlanMantenimiento(models.Model):
    """
    Plantilla de mantenimiento preventivo por tipo de sistema.
    Define la lista de chequeos y la frecuencia.
    """
    TIPOS_SISTEMA = (
        ('hibrido', 'Híbrido'),
        ('off_grid', 'Off Grid'),
        ('grid_tie', 'Grid Tie'),
    )

    idplan = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=128)
    tipo_sistema = models.CharField(max_length=10, choices=TIPOS_SISTEMA)
    frecuencia_dias = models.IntegerField(
        default=30,
        help_text='Cada cuántos días aplica este plan.',
    )
    duracion_estimada_horas = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=2,
        help_text='Duración estimada de la visita.',
    )
    checklist = models.JSONField(
        default=list,
        help_text='Lista de items a verificar: [{titulo, requerido}].',
    )
    especialidad_requerida = models.ForeignKey(
        'tecnicos.Especialidad',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planes_mantenimiento',
    )
    activo = models.BooleanField(default=True)
    creado_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'plan_mantenimiento'
        verbose_name = 'Plan de mantenimiento'
        verbose_name_plural = 'Planes de mantenimiento'
        indexes = [
            models.Index(fields=['tipo_sistema', 'activo'], name='plan_mant_tipo_idx'),
        ]

    def __str__(self):
        return f'{self.nombre} ({self.tipo_sistema})'


class Mantenimiento(models.Model):
    """
    Instancia programada de un plan de mantenimiento sobre una instalación específica.
    Generalmente se asocia con una OrdenTrabajo (creada en lote 3).
    """
    ESTADOS = (
        ('programado', 'Programado'),
        ('en_proceso', 'En proceso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    )

    idmantenimiento = models.AutoField(primary_key=True)
    instalacion = models.ForeignKey(
        'core.Instalacion',
        on_delete=models.CASCADE,
        related_name='mantenimientos',
    )
    plan = models.ForeignKey(
        PlanMantenimiento,
        on_delete=models.PROTECT,
        related_name='mantenimientos',
    )
    fecha_programada = models.DateField()
    estado = models.CharField(max_length=12, choices=ESTADOS, default='programado')

    # FK a OrdenTrabajo se añade en una migración posterior (lote 3) — usamos string ref
    # para evitar dependencia cíclica en la migración inicial.
    orden_trabajo = models.OneToOneField(
        'ordenes.OrdenTrabajo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='_mantenimiento_origen',
    )

    notas = models.TextField(blank=True)
    creado_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mantenimiento'
        verbose_name = 'Mantenimiento programado'
        verbose_name_plural = 'Mantenimientos programados'
        ordering = ['fecha_programada']
        indexes = [
            models.Index(fields=['instalacion', 'estado'], name='mant_inst_est_idx'),
            models.Index(fields=['fecha_programada', 'estado'], name='mant_fecha_est_idx'),
        ]

    def __str__(self):
        return f'{self.plan.nombre} @ {self.instalacion.nombre} ({self.fecha_programada})'
