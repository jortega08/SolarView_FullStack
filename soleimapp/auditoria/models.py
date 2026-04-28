from django.db import models


class EventoAuditoria(models.Model):
    usuario = models.ForeignKey(
        "core.Usuario", on_delete=models.SET_NULL, null=True, blank=True
    )
    accion = models.CharField(max_length=64)
    entidad = models.CharField(max_length=64)
    entidad_id = models.IntegerField(null=True, blank=True)
    detalle = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = "evento_auditoria"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(
                fields=["entidad", "entidad_id"], name="evento_audi_entidad_idx"
            ),
            models.Index(
                fields=["usuario", "timestamp"], name="evento_audi_usuario_idx"
            ),
        ]

    def __str__(self):
        return f"{self.accion} sobre {self.entidad}#{self.entidad_id}"
