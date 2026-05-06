from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


class Pais(models.Model):
    idpais = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)

    class Meta:
        db_table = "pais"
        verbose_name = "País"
        verbose_name_plural = "Países"

    def __str__(self):
        return self.nombre


class Estado(models.Model):
    idestado = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    pais = models.ForeignKey(Pais, on_delete=models.CASCADE, related_name="estados")

    class Meta:
        db_table = "estado"
        verbose_name = "Estado"
        verbose_name_plural = "Estados"

    def __str__(self):
        return self.nombre


class Ciudad(models.Model):
    idciudad = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    estado = models.ForeignKey(
        Estado, on_delete=models.CASCADE, related_name="ciudades"
    )

    class Meta:
        db_table = "ciudad"
        verbose_name = "Ciudad"
        verbose_name_plural = "Ciudades"

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    # ---------- identidad ----------
    idusuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=128)
    ROLES = (
        ("admin", "Administrador"),
        ("user", "Usuario"),
    )
    rol = models.CharField(max_length=10, choices=ROLES, default="user")
    prestador = models.ForeignKey(
        "PrestadorServicio",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )
    empresa_cliente = models.ForeignKey(
        "Empresa",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios_cliente",
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    # ---------- estado de cuenta ----------
    is_active = models.BooleanField(
        default=True,
        help_text="Desactiva la cuenta sin eliminarla.",
    )

    # ---------- rol dentro del prestador ----------
    # True para el usuario que CREA un PrestadorServicio (vía registro o
    # POST /api/core/prestadores/). Habilita gestionar la empresa, invitar
    # empleados y editar tarifas. No es lo mismo que `rol="admin"` (admin
    # global de plataforma).
    es_admin_prestador = models.BooleanField(
        default=False,
        help_text="True si es el admin de su PrestadorServicio (puede invitar empleados).",
    )

    # ---------- protección anti-fuerza-bruta ----------
    failed_login_attempts = models.IntegerField(
        default=0,
        help_text="Intentos fallidos consecutivos de inicio de sesión.",
    )
    locked_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="La cuenta queda bloqueada hasta esta fecha/hora.",
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
        db_table = "usuario"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.nombre

    # ---------- contraseña ----------
    def set_password(self, raw_password):
        self.contrasena = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.contrasena)

    def save(self, *args, **kwargs):
        if self.contrasena and not self.contrasena.startswith(
            ("pbkdf2_sha256$", "bcrypt$", "argon2")
        ):
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
            self.locked_until = timezone.now() + timezone.timedelta(
                minutes=self._LOCKOUT_MINUTES
            )
        self.save(update_fields=["failed_login_attempts", "locked_until"])

    def reset_failed_logins(self):
        """Restablece el contador tras un login exitoso."""
        if self.failed_login_attempts > 0 or self.locked_until:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=["failed_login_attempts", "locked_until"])


class Domicilio(models.Model):
    iddomicilio = models.AutoField(primary_key=True)
    ciudad = models.ForeignKey(
        Ciudad, on_delete=models.CASCADE, related_name="domicilios"
    )
    usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name="domicilios"
    )

    class Meta:
        db_table = "domicilio"
        verbose_name = "Domicilio"
        verbose_name_plural = "Domicilios"

    def __str__(self):
        return f"{self.usuario.nombre}-{self.ciudad.nombre}"


class Empresa(models.Model):
    idempresa = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    nit = models.CharField(max_length=20, unique=True)
    sector = models.CharField(max_length=100, blank=True)
    prestador = models.ForeignKey(
        "PrestadorServicio",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clientes",
        help_text="Prestador que administra esta empresa cliente.",
    )
    ciudad = models.ForeignKey(
        Ciudad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="empresas",
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "empresa"
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"

    def __str__(self):
        return self.nombre


class PrestadorServicio(models.Model):
    idprestador = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    nit = models.CharField(max_length=50, unique=True, null=True, blank=True)
    ciudad = models.ForeignKey(
        Ciudad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prestadores_servicio",
    )
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "prestador_servicio"
        ordering = ["nombre"]
        verbose_name = "Prestador de servicio"
        verbose_name_plural = "Prestadores de servicio"

    def __str__(self):
        return self.nombre


class Instalacion(models.Model):
    TIPOS_SISTEMA = (
        ("hibrido", "Híbrido"),
        ("off_grid", "Off Grid"),
        ("grid_tie", "Grid Tie"),
    )
    ESTADOS = (
        ("activa", "Activa"),
        ("inactiva", "Inactiva"),
        ("mantenimiento", "Mantenimiento"),
    )

    idinstalacion = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        Empresa, on_delete=models.CASCADE, related_name="instalaciones"
    )
    prestador = models.ForeignKey(
        PrestadorServicio,
        on_delete=models.PROTECT,
        related_name="instalaciones",
        null=True,
        blank=True,
    )
    cliente = models.ForeignKey(
        Empresa,
        on_delete=models.PROTECT,
        related_name="instalaciones_cliente",
        null=True,
        blank=True,
    )
    nombre = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255, blank=True)
    ciudad = models.ForeignKey(
        Ciudad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instalaciones",
    )
    tipo_sistema = models.CharField(
        max_length=10, choices=TIPOS_SISTEMA, default="hibrido"
    )
    capacidad_panel_kw = models.FloatField(default=0)
    capacidad_bateria_kwh = models.FloatField(default=0)
    fecha_instalacion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=15, choices=ESTADOS, default="activa")
    imagen = models.ImageField(
        upload_to="instalaciones/",
        null=True,
        blank=True,
        help_text="Foto principal de la instalacion.",
    )

    # --- Campos operativos de mantenimiento (P1) ---
    ultimo_mantenimiento = models.DateField(null=True, blank=True)
    proximo_mantenimiento = models.DateField(null=True, blank=True)
    garantia_hasta = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "instalacion"
        verbose_name = "Instalación"
        verbose_name_plural = "Instalaciones"

    def __str__(self):
        return self.nombre


class Sensor(models.Model):
    TIPOS = (
        ("gateway", "Gateway"),
        ("inversor", "Inversor"),
        ("medidor", "Medidor"),
        ("bateria", "Bateria"),
        ("irradiancia", "Irradiancia"),
        ("temperatura", "Temperatura"),
        ("otro", "Otro"),
    )
    ESTADOS = (
        ("activo", "Activo"),
        ("inactivo", "Inactivo"),
        ("mantenimiento", "Mantenimiento"),
    )

    idsensor = models.AutoField(primary_key=True)
    instalacion = models.ForeignKey(
        Instalacion,
        on_delete=models.SET_NULL,
        related_name="sensores",
        null=True,
        blank=True,
    )
    nombre = models.CharField(max_length=120)
    codigo = models.CharField(max_length=64, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPOS, default="medidor")
    unidad = models.CharField(max_length=24, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    ultima_lectura = models.FloatField(null=True, blank=True)
    fecha_ultima_lectura = models.DateTimeField(null=True, blank=True)
    notas = models.TextField(blank=True)
    creado_at = models.DateTimeField(auto_now_add=True)
    actualizado_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sensor"
        ordering = ["instalacion__nombre", "nombre"]
        indexes = [
            models.Index(fields=["instalacion", "estado"], name="sensor_inst_estado"),
            models.Index(fields=["codigo"], name="sensor_codigo_idx"),
        ]
        verbose_name = "Sensor"
        verbose_name_plural = "Sensores"

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class InvitacionPrestador(models.Model):
    """
    Código de invitación para que un nuevo Usuario se una a un PrestadorServicio
    existente como empleado, sin tener que crear otro prestador.

    Flujo:
      1. Admin del prestador crea una invitación → se genera `codigo`.
      2. El admin comparte el código por fuera (email, WhatsApp...).
      3. El nuevo usuario va a Register, elige "Unirme con código",
         envía POST /api/auth/registrar-con-codigo/ con {nombre, email,
         contrasena, codigo}.
      4. Backend valida vigencia + no usado, crea Usuario con
         prestador_id = invitacion.prestador_id, marca la invitación.

    Una invitación es de un solo uso (`usado_por` queda set).
    """

    ROLES = (
        ("admin_empresa", "Admin de empresa"),
        ("operador", "Operador"),
        ("viewer", "Viewer"),
    )

    idinvitacion = models.AutoField(primary_key=True)
    prestador = models.ForeignKey(
        "PrestadorServicio",
        on_delete=models.CASCADE,
        related_name="invitaciones",
    )
    codigo = models.CharField(
        max_length=32,
        unique=True,
        help_text="Token aleatorio compartido por el admin con el invitado.",
    )
    rol = models.CharField(
        max_length=20,
        choices=ROLES,
        default="operador",
        help_text="Rol operativo que tendrá el invitado al unirse.",
    )
    email_destino = models.EmailField(
        blank=True,
        help_text="Opcional: email esperado del invitado (sólo informativo).",
    )
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name="invitaciones_emitidas",
    )
    creado_at = models.DateTimeField(auto_now_add=True)
    vigente_hasta = models.DateTimeField(
        help_text="Después de esta fecha la invitación deja de ser canjeable.",
    )
    usado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitacion_usada",
    )
    usado_at = models.DateTimeField(null=True, blank=True)
    revocada = models.BooleanField(default=False)

    class Meta:
        db_table = "invitacion_prestador"
        ordering = ["-creado_at"]
        verbose_name = "Invitación de prestador"
        verbose_name_plural = "Invitaciones de prestador"
        indexes = [
            models.Index(fields=["codigo"], name="idx_invitacion_codigo"),
            models.Index(fields=["prestador"], name="idx_invitacion_prestador"),
        ]

    def __str__(self):
        return f"{self.codigo} → {self.prestador.nombre} ({self.rol})"

    def esta_vigente(self) -> bool:
        if self.revocada or self.usado_por_id:
            return False
        return self.vigente_hasta > timezone.now()


class InvitacionCliente(models.Model):
    """
    Codigo de invitacion para que un contacto externo se registre como usuario
    cliente de una Empresa administrada por un PrestadorServicio.

    No vincula al usuario al equipo interno del prestador: al canjearse, el
    Usuario queda con empresa_cliente asignada y prestador nulo.
    """

    TIPOS_ACCESO = (
        ("cliente", "Cliente"),
        ("viewer", "Visor"),
    )

    idinvitacion = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=64, unique=True)
    prestador = models.ForeignKey(
        "PrestadorServicio",
        on_delete=models.CASCADE,
        related_name="invitaciones_cliente",
    )
    empresa_cliente = models.ForeignKey(
        "Empresa",
        on_delete=models.CASCADE,
        related_name="invitaciones_cliente",
    )
    email_destinatario = models.EmailField(blank=True)
    tipo_acceso = models.CharField(
        max_length=20,
        choices=TIPOS_ACCESO,
        default="cliente",
    )
    vigente_hasta = models.DateTimeField()
    usado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitacion_cliente_usada",
    )
    creada_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name="invitaciones_cliente_emitidas",
    )
    revocada = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_uso = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "invitacion_cliente"
        ordering = ["-fecha_creacion"]
        verbose_name = "Invitacion de cliente"
        verbose_name_plural = "Invitaciones de cliente"
        indexes = [
            models.Index(fields=["codigo"], name="idx_inv_cliente_codigo"),
            models.Index(fields=["prestador"], name="idx_inv_cliente_prestador"),
            models.Index(fields=["empresa_cliente"], name="idx_inv_cliente_empresa"),
        ]

    def __str__(self):
        return f"{self.codigo} -> {self.empresa_cliente.nombre}"

    def esta_vigente(self) -> bool:
        if self.revocada or self.usado_por_id:
            return False
        return self.vigente_hasta > timezone.now()


class Tarifa(models.Model):
    """
    Tarifa de energía eléctrica por kWh (moneda local).

    Se resuelve en cascada:
      1. Tarifa específica para una instalación (`instalacion` no nulo).
      2. Tarifa de la ciudad (`ciudad` no nulo, `instalacion` nulo).
      3. Tarifa global por defecto (ambos nulos) — fallback final.

    Sólo se usan tarifas con `vigente_desde <= now` y (`vigente_hasta` nulo
    o `vigente_hasta > now`).
    """

    idtarifa = models.AutoField(primary_key=True)
    nombre = models.CharField(
        max_length=120,
        help_text="Etiqueta humana, p.ej. 'Bogotá - Estrato 4 - 2026 Q1'.",
    )
    ciudad = models.ForeignKey(
        Ciudad,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tarifas",
        help_text="Si se define, aplica a todas las instalaciones de la ciudad.",
    )
    instalacion = models.ForeignKey(
        "Instalacion",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="tarifas",
        help_text="Override puntual para una instalación.",
    )
    valor_kwh = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Costo del kWh en moneda local (ej. COP).",
    )
    moneda = models.CharField(max_length=8, default="COP")
    vigente_desde = models.DateTimeField()
    vigente_hasta = models.DateTimeField(null=True, blank=True)
    creado_at = models.DateTimeField(auto_now_add=True)
    actualizado_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tarifa"
        ordering = ["-vigente_desde", "-idtarifa"]
        verbose_name = "Tarifa de energía"
        verbose_name_plural = "Tarifas de energía"
        indexes = [
            models.Index(
                fields=["ciudad", "vigente_desde"], name="idx_tarifa_ciudad_desde"
            ),
            models.Index(
                fields=["instalacion", "vigente_desde"],
                name="idx_tarifa_inst_desde",
            ),
        ]

    def __str__(self):
        scope = (
            f"instalación {self.instalacion_id}"
            if self.instalacion_id
            else (f"ciudad {self.ciudad_id}" if self.ciudad_id else "global")
        )
        return f"{self.nombre} ({self.valor_kwh} {self.moneda}/kWh - {scope})"


class RolInstalacion(models.Model):
    ROLES = (
        ("admin_empresa", "Admin"),
        ("operador", "Operador"),
        ("viewer", "Viewer"),
    )

    usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name="roles_instalacion"
    )
    instalacion = models.ForeignKey(
        Instalacion, on_delete=models.CASCADE, related_name="roles"
    )
    rol = models.CharField(max_length=20, choices=ROLES, default="viewer")

    class Meta:
        db_table = "rol_instalacion"
        unique_together = ("usuario", "instalacion")
        verbose_name = "Rol por instalación"
        verbose_name_plural = "Roles por instalación"

    def __str__(self):
        return f"{self.usuario.nombre} - {self.instalacion.nombre} ({self.rol})"


class ConfiguracionUser(models.Model):
    idconfiguracion = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    domicilio = models.ForeignKey(
        Domicilio, on_delete=models.CASCADE, related_name="configuraciones"
    )
    instalacion = models.ForeignKey(
        Instalacion,
        on_delete=models.CASCADE,
        related_name="configuraciones",
        null=True,
        blank=True,
    )
    notificaciones_email = models.BooleanField(default=True)

    PRIORIDADES = (
        ("electrica", "Electrica"),
        ("solar", "Solar"),
        ("auto", "Auto"),
    )
    from alerta.models import Alerta

    prioridad = models.CharField(max_length=10, choices=PRIORIDADES, default="auto")
    alertas_activas = models.ManyToManyField(
        Alerta, related_name="configuraciones", blank=True
    )

    def tiene_alertas_activas(self):
        filtros = {"estado": "activa"}
        if self.instalacion_id:
            filtros["instalacion"] = self.instalacion
        else:
            filtros["domicilio"] = self.domicilio
        return self.Alerta.objects.filter(**filtros).exists()

    def obtener_alertas_activas(self):
        filtros = {"estado": "activa"}
        if self.instalacion_id:
            filtros["instalacion"] = self.instalacion
        else:
            filtros["domicilio"] = self.domicilio
        return self.Alerta.objects.filter(**filtros)

    class Meta:
        db_table = "configuracion_usuario"
        verbose_name = "Configuración de Usuario"
        verbose_name_plural = "Configuraciones de Usuario"

    def __str__(self):
        return f"Configuración de {self.domicilio} - Alertas activas: {self.tiene_alertas_activas()}"
