from django.db import models, transaction
from django.utils import timezone


class OrdenTrabajo(models.Model):
    """Orden de trabajo (work order). Núcleo operativo de despacho."""

    TIPOS = (
        ('correctivo', 'Correctivo'),
        ('preventivo', 'Preventivo'),
        ('inspeccion', 'Inspección'),
        ('instalacion', 'Instalación'),
    )
    PRIORIDADES = (
        ('urgente', 'Urgente'),
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    )
    ESTADOS = (
        ('abierta', 'Abierta'),
        ('asignada', 'Asignada'),
        ('en_progreso', 'En progreso'),
        ('completada', 'Completada'),
        ('cerrada', 'Cerrada'),
        ('cancelada', 'Cancelada'),
    )
    ESTADOS_ACTIVOS = ('abierta', 'asignada', 'en_progreso')

    idorden = models.AutoField(primary_key=True)
    codigo = models.CharField(
        max_length=24,
        unique=True,
        editable=False,
        help_text='Código legible: OT-YYYY-NNNNN.',
    )

    instalacion = models.ForeignKey(
        'core.Instalacion',
        on_delete=models.PROTECT,
        related_name='ordenes',
    )
    alerta = models.ForeignKey(
        'alerta.Alerta',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ordenes',
    )
    mantenimiento = models.OneToOneField(
        'mantenimiento.Mantenimiento',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='_orden',
    )

    tipo = models.CharField(max_length=12, choices=TIPOS, default='correctivo')
    prioridad = models.CharField(max_length=8, choices=PRIORIDADES, default='media')
    estado = models.CharField(max_length=12, choices=ESTADOS, default='abierta')

    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    notas_resolucion = models.TextField(blank=True)

    asignado_a = models.ForeignKey(
        'core.Usuario',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ordenes_asignadas',
    )
    creado_por = models.ForeignKey(
        'core.Usuario',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ordenes_creadas',
    )

    sla_objetivo_horas = models.IntegerField(default=24)

    creada_at = models.DateTimeField(auto_now_add=True)
    asignada_at = models.DateTimeField(null=True, blank=True)
    iniciada_at = models.DateTimeField(null=True, blank=True)
    completada_at = models.DateTimeField(null=True, blank=True)
    cerrada_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'orden_trabajo'
        verbose_name = 'Orden de trabajo'
        verbose_name_plural = 'Órdenes de trabajo'
        ordering = ['-creada_at']
        indexes = [
            models.Index(fields=['instalacion', 'estado'], name='ot_inst_est_idx'),
            models.Index(fields=['asignado_a', 'estado'], name='ot_asig_est_idx'),
            models.Index(fields=['estado', 'prioridad', 'creada_at'], name='ot_est_prio_fch_idx'),
        ]

    # ----- estado tracking para signals (cambio_estado) -----
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # _old_estado se usa por el signal pre_save para detectar transiciones
        self._old_estado = self.estado if self.pk else None

    @classmethod
    def from_db(cls, db, field_names, values):
        instance = super().from_db(db, field_names, values)
        instance._old_estado = instance.estado
        return instance

    def __str__(self):
        return f'{self.codigo} — {self.titulo[:40]}'

    # ----- helpers operativos -----
    def es_sla_vencido(self):
        """True si la orden lleva activa más tiempo que su SLA objetivo."""
        if self.estado not in self.ESTADOS_ACTIVOS:
            return False
        if not self.creada_at:
            return False
        deadline = self.creada_at + timezone.timedelta(hours=self.sla_objetivo_horas)
        return timezone.now() > deadline

    def tiempo_resolucion_horas(self):
        """Horas transcurridas desde creación hasta completada (o None)."""
        if not self.completada_at:
            return None
        delta = self.completada_at - self.creada_at
        return round(delta.total_seconds() / 3600, 2)

    # ----- generación de código OT-YYYY-NNNNN -----
    def _generar_codigo(self):
        anio = timezone.now().year
        prefix = f'OT-{anio}-'
        ultimo = (
            OrdenTrabajo.objects
            .filter(codigo__startswith=prefix)
            .order_by('-codigo')
            .first()
        )
        if ultimo:
            try:
                seq = int(ultimo.codigo.rsplit('-', 1)[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        return f'{prefix}{seq:05d}'

    def save(self, *args, **kwargs):
        if not self.codigo:
            with transaction.atomic():
                self.codigo = self._generar_codigo()
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)


class ComentarioOrden(models.Model):
    """Historial de comentarios y cambios de estado de una orden (inmutable)."""
    TIPOS = (
        ('comentario', 'Comentario'),
        ('cambio_estado', 'Cambio de estado'),
        ('sistema', 'Sistema'),
    )

    idcomentario = models.AutoField(primary_key=True)
    orden = models.ForeignKey(
        OrdenTrabajo,
        on_delete=models.CASCADE,
        related_name='comentarios',
    )
    usuario = models.ForeignKey(
        'core.Usuario',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='comentarios_orden',
    )
    tipo = models.CharField(max_length=16, choices=TIPOS, default='comentario')
    texto = models.TextField()
    creado_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comentario_orden'
        verbose_name = 'Comentario de orden'
        verbose_name_plural = 'Comentarios de orden'
        ordering = ['creado_at']
        indexes = [
            models.Index(fields=['orden', 'creado_at'], name='com_ord_fch_idx'),
        ]

    def __str__(self):
        return f'#{self.idcomentario} {self.tipo} sobre {self.orden_id}'


class EvidenciaOrden(models.Model):
    """Foto, firma del cliente o documento adjunto a una orden de trabajo."""
    TIPOS = (
        ('foto', 'Foto'),
        ('firma', 'Firma del cliente'),
        ('documento', 'Documento'),
    )

    idevidencia = models.AutoField(primary_key=True)
    orden = models.ForeignKey(
        OrdenTrabajo,
        on_delete=models.CASCADE,
        related_name='evidencias',
    )
    tipo = models.CharField(max_length=12, choices=TIPOS, default='foto')
    archivo = models.FileField(upload_to='ordenes/%Y/%m/')
    descripcion = models.CharField(max_length=255, blank=True)
    subido_por = models.ForeignKey(
        'core.Usuario',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='evidencias_subidas',
    )
    creado_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'evidencia_orden'
        verbose_name = 'Evidencia de orden'
        verbose_name_plural = 'Evidencias de orden'
        ordering = ['-creado_at']
        indexes = [
            models.Index(fields=['orden', 'tipo'], name='evi_ord_tipo_idx'),
        ]

    def __str__(self):
        return f'{self.tipo} de orden {self.orden_id}'
