from django.db import models
from core.models import Domicilio

class Puntaje(models.Model):
    idpuntaje = models.AutoField(primary_key=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='puntajes')
    puntos =   models.IntegerField(default=0)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    NIVEL_PUNTOS = (
        ('basico', 'Basico'),
        ('intermedio', 'Intermedio'),
        ('experto', 'Experto'),
        ('maestro', 'Maestro')
    )
    nivel = models.CharField(max_length=12, choices=NIVEL_PUNTOS, default='basico')

    class Meta:
        db_table = 'puntaje'
        verbose_name = 'Puntaje'
        verbose_name_plural = 'Puntajes'
        ordering = ['-puntos']
    
    def __str__(self):
        return f"El puntaje del usuario {self.domicilio.usuario.nombre} del domicilio {self.domicilio.nombre} es: {self.puntos} puntos - Nivel: {self.nivel}"
    
    def actualizar_puntos(self):
        if self.puntos >= 10000:
            self.nivel = 'maestro'
        elif self.puntos >= 5000:
            self.nivel = 'experto'
        elif self.puntos >= 1000:
            self.nivel = 'intermedio'
        else:
            self.nivel = 'basico'
        self.save()



class Recomendacion(models.Model):
    idrecomendacion = models.AutoField(primary_key=True)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='recomendaciones')
    mensaje = models.CharField(max_length=255)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recomendacion'
        verbose_name = 'Recomendacion'
        verbose_name_plural = 'Recomendaciones'
        ordering = ['-fecha_publicacion']
    
    def __str__(self):
        return f"Recomendación para {self.domicilio.usuario.nombre}: {self.mensaje}"