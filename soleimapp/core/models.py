from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


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
    # ---------- identidad ----------
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

    # ---------- estado de cuenta ----------
    is_active = models.BooleanField(
        default=True,
        help_text='Desactiva la cuenta sin eliminarla.',
    )

    # ---------- protección anti-fuerza-bruta ----------
    failed_login_attempts = models.IntegerField(
        default=0,
        help_text='Intentos fallidos consecutivos de inicio de sesión.',
    )
    locked_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text='La cuenta queda bloqueada hasta esta fecha/hora.',
    )

    # ---------- compatibilidad DRF IsAuthenticated ----------
    # La autenticación CoreUsuarioJWTAuthentication garantiza que sólo se
    # devuelve un Usuario real cuando el token es válido; por tanto, todo
    # Usuario real debe considerarse autenticado.
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.nombre

    # ---------- contraseña ----------
    def set_password(self, raw_password):
        self.contrasena = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.contrasena)

    def save(self, *args, **kwargs):
        if self.contrasena and not self.contrasena.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            self.contrasena = make_password(self.contrasena)
        super().save(*args, **kwargs)

    # ---------- lockout helpers ----------
    _MAX_FAILED_ATTEMPTS = 5
    _LOCKOUT_MINUTES = 15

    def is_locked(self):
        """Devuelve True si la cuenta está bloqueada en este momento."""
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False

    def record_failed_login(self):
        """Incrementa el contador de fallos y bloquea la cuenta si supera el umbral."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= self._MAX_FAILED_ATTEMPTS:
            self.locked_until = timezone.now() + timezone.timedelta(minutes=self._LOCKOUT_MINUTES)
        self.save(update_fields=['failed_login_attempts', 'locked_until'])

    def reset_failed_logins(self):
        """Restablece el contador tras un login exitoso."""
        if self.failed_login_attempts > 0 or self.locked_until:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=['failed_login_attempts', 'locked_until'])


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

    # --- Campos operativos de mantenimiento (P1) ---
    ultimo_mantenimiento = models.DateField(null=True, blank=True)
    proximo_mantenimiento = models.DateField(null=True, blank=True)
    garantia_hasta = models.DateField(null=True, blank=True)

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
