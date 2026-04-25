from django.contrib.auth.hashers import check_password, make_password
from django.db import models


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


class Empresa(models.Model):
    idempresa = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    nit = models.CharField(max_length=20, unique=True)
    sector = models.CharField(max_length=100, blank=True)
    ciudad = models.ForeignKey(Ciudad, on_delete=models.SET_NULL, null=True, blank=True, related_name='empresas')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'empresa'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'

    def __str__(self):
        return self.nombre


class Instalacion(models.Model):
    TIPOS_SISTEMA = (
        ('hibrido', 'Híbrido'),
        ('off_grid', 'Off Grid'),
        ('grid_tie', 'Grid Tie'),
    )
    ESTADOS = (
        ('activa', 'Activa'),
        ('inactiva', 'Inactiva'),
        ('mantenimiento', 'Mantenimiento'),
    )

    idinstalacion = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='instalaciones')
    nombre = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255, blank=True)
    ciudad = models.ForeignKey(Ciudad, on_delete=models.SET_NULL, null=True, blank=True, related_name='instalaciones')
    tipo_sistema = models.CharField(max_length=10, choices=TIPOS_SISTEMA, default='hibrido')
    capacidad_panel_kw = models.FloatField(default=0)
    capacidad_bateria_kwh = models.FloatField(default=0)
    fecha_instalacion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=15, choices=ESTADOS, default='activa')

    class Meta:
        db_table = 'instalacion'
        verbose_name = 'Instalación'
        verbose_name_plural = 'Instalaciones'

    def __str__(self):
        return self.nombre


class RolInstalacion(models.Model):
    ROLES = (
        ('admin_empresa', 'Admin'),
        ('operador', 'Operador'),
        ('viewer', 'Viewer'),
    )

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='roles_instalacion')
    instalacion = models.ForeignKey(Instalacion, on_delete=models.CASCADE, related_name='roles')
    rol = models.CharField(max_length=20, choices=ROLES, default='viewer')

    class Meta:
        db_table = 'rol_instalacion'
        unique_together = ('usuario', 'instalacion')
        verbose_name = 'Rol por instalación'
        verbose_name_plural = 'Roles por instalación'

    def __str__(self):
        return f"{self.usuario.nombre} - {self.instalacion.nombre} ({self.rol})"


class ConfiguracionUser(models.Model):
    idconfiguracion = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    domicilio = models.ForeignKey(Domicilio, on_delete=models.CASCADE, related_name='configuraciones')
    instalacion = models.ForeignKey(Instalacion, on_delete=models.CASCADE, related_name='configuraciones', null=True, blank=True)
    notificaciones_email = models.BooleanField(default=True)

    PRIORIDADES = (
        ('electrica', 'Electrica'),
        ('solar', 'Solar'),
        ('auto', 'Auto'),
    )
    from alerta.models import Alerta

    prioridad = models.CharField(max_length=10, choices=PRIORIDADES, default='auto')
    alertas_activas = models.ManyToManyField(Alerta, related_name='configuraciones', blank=True)

    def tiene_alertas_activas(self):
        filtros = {'estado': 'activa'}
        if self.instalacion_id:
            filtros['instalacion'] = self.instalacion
        else:
            filtros['domicilio'] = self.domicilio
        return self.Alerta.objects.filter(**filtros).exists()

    def obtener_alertas_activas(self):
        filtros = {'estado': 'activa'}
        if self.instalacion_id:
            filtros['instalacion'] = self.instalacion
        else:
            filtros['domicilio'] = self.domicilio
        return self.Alerta.objects.filter(**filtros)

    class Meta:
        db_table = 'configuracion_usuario'
        verbose_name = 'Configuración de Usuario'
        verbose_name_plural = 'Configuraciones de Usuario'

    def __str__(self):
        return f"Configuración de {self.domicilio} - Alertas activas: {self.tiene_alertas_activas()}"
