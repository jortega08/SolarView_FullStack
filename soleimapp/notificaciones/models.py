from django.db import models

CANALES = (
    ("in_app", "In-app"),
    ("email", "Email"),
    ("sms", "SMS"),
    ("push", "Push"),
    ("webhook", "Webhook"),
)


class PlantillaNotificacion(models.Model):
    """Plantilla reutilizable de notificación, indexada por `clave`."""

    idplantilla = models.AutoField(primary_key=True)
    clave = models.CharField(max_length=64, unique=True)
    asunto = models.CharField(max_length=255)
    cuerpo_txt = models.TextField(
        help_text='Soporta {context} con .format() — ej.: "Tu orden {codigo} fue asignada".',
    )
    cuerpo_html = models.TextField(blank=True)
    canales_default = models.JSONField(
        default=list,
        help_text='Canales por defecto: ["in_app","email"].',
    )
    activo = models.BooleanField(default=True)
    creado_at = models.DateTimeField(auto_now_add=True)
    actualizado_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plantilla_notificacion"
        verbose_name = "Plantilla de notificación"
        verbose_name_plural = "Plantillas de notificación"

    def __str__(self):
        return self.clave


class Notificacion(models.Model):
    """Notificación individual enviada (o pendiente de envío) a un usuario."""

    ESTADOS = (
        ("pendiente", "Pendiente"),
        ("enviada", "Enviada"),
        ("fallida", "Fallida"),
        ("leida", "Leída"),
    )

    idnotificacion = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        "core.Usuario",
        on_delete=models.CASCADE,
        related_name="notificaciones",
    )
    canal = models.CharField(max_length=12, choices=CANALES, default="in_app")
    plantilla = models.ForeignKey(
        PlantillaNotificacion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificaciones",
    )
    asunto = models.CharField(max_length=255)
    cuerpo = models.TextField()
    enlace = models.URLField(blank=True)
    estado = models.CharField(max_length=12, choices=ESTADOS, default="pendiente")
    intentos = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    creada_at = models.DateTimeField(auto_now_add=True)
    enviada_at = models.DateTimeField(null=True, blank=True)
    leida_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notificacion"
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-creada_at"]
        indexes = [
            models.Index(
                fields=["usuario", "estado", "-creada_at"], name="notif_usr_est_idx"
            ),
            models.Index(fields=["canal", "estado"], name="notif_canal_est_idx"),
        ]

    def __str__(self):
        return f"#{self.idnotificacion} {self.canal} → {self.usuario_id}"
