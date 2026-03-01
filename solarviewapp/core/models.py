from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class Pais(models.Model):
    idpais = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)

    class Meta:
        db_table = 'pais'
        verbose_name = 'País'
        verbose_name_plural = 'Países'

    def __str__(self):
        return self.nombre

class Estado(models.Model):
    idestado = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    pais = models.ForeignKey(Pais, on_delete=models.CASCADE, related_name='estados')

    class Meta:
        db_table = 'estado'
        verbose_name = 'Estado'
        verbose_name_plural = 'Estados'

    def __str__(self):
        return self.nombre

class Ciudad(models.Model):
    idciudad = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    estado = models.ForeignKey(Estado, on_delete=models.CASCADE, related_name='ciudades')

    class Meta:
        db_table = 'ciudad'
        verbose_name = 'Ciudad'
        verbose_name_plural = 'Ciudades'

    def __str__(self):
        return self.nombre

class Usuario(models.Model):
    idusuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=128)
    ROLES = (
        ('admin', 'Administrador'),
        ('user', 'Usuario'),
    )
    rol = models.CharField(max_length=10, choices=ROLES, default='user')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.nombre

    def set_password(self, raw_password):
        self.contrasena = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.contrasena)

    def save(self, *args, **kwargs):
        # Hash password if it's not already hashed
        if self.contrasena and not self.contrasena.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            self.contrasena = make_password(self.contrasena)
        super().save(*args, **kwargs)

class Domicilio(models.Model):
    iddomicilio = models.AutoField(primary_key=True)
    ciudad = models.ForeignKey(Ciudad, on_delete=models.CASCADE, related_name='domicilios')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='domicilios')

    class Meta:
        db_table = 'domicilio'
        verbose_name = 'Domicilio'
        verbose_name_plural = 'Domicilios'

    def __str__(self):
        return f"{self.usuario.nombre}-{self.ciudad.nombre}"


class ConfiguracionUser(models.Model):
    idconfiguracion = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='configuraciones')
    notificaciones_email = models.BooleanField(default=True)

    PRIORIDADES = (
        ('electrica', 'Electrica'),
        ('solar', 'Solar'),
        ('auto', 'Auto')
    )
    from alerta.models import Alerta

    prioridad = models.CharField(max_length=10, choices=PRIORIDADES, default='auto')
    alertas_activas = models.ManyToManyField(Alerta, related_name='configuraciones', blank=True)

    def tiene_alertas_activas(self):
        return Alerta.objects.filter(domicilio=self.domicilio, estado='activa').exists()

    def obtener_alertas_activas(self):
        return Alerta.objects.filter(domicilio=self.domicilio, estado='activa')

    class Meta:
        db_table = 'configuracion_usuario'
        verbose_name = 'Configuración de Usuario'
        verbose_name_plural = 'Configuraciones de Usuario'

    def __str__(self):
        return f"Configuración de {self.domicilio} - Alertas Activas: {self.tiene_alertas_activas()}"
