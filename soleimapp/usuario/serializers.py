from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Ciudad, InvitacionPrestador, PrestadorServicio, Usuario


class RegisterSerializer(serializers.ModelSerializer):
    """
    Registro de Usuario operativo. Permite crear opcionalmente la empresa
    PrestadorServicio del usuario en el mismo POST y vincularla a `usuario.prestador`.

    El flujo de negocio es:
        Usuario -> PrestadorServicio (su empresa) -> atiende Empresa(s) cliente
        -> que tienen Instalacion(es).

    Si el usuario ya tiene un prestador asignado o no envía datos de prestador,
    el registro funciona como antes (back-compat).
    """

    contrasena = serializers.CharField(write_only=True, min_length=8)

    # --- datos opcionales de la empresa prestadora del usuario ---
    prestador_nombre = serializers.CharField(
        write_only=True, required=False, allow_blank=False, max_length=150
    )
    prestador_nit = serializers.CharField(
        write_only=True, required=False, allow_blank=True, max_length=50
    )
    prestador_ciudad = serializers.PrimaryKeyRelatedField(
        write_only=True, required=False, allow_null=True, queryset=Ciudad.objects.all()
    )

    # --- info read-only del prestador vinculado (en la respuesta) ---
    prestador = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "idusuario",
            "nombre",
            "email",
            "contrasena",
            "rol",
            "prestador_nombre",
            "prestador_nit",
            "prestador_ciudad",
            "prestador",
        ]
        read_only_fields = ["idusuario", "prestador"]

    def get_prestador(self, obj):
        if not obj.prestador_id:
            return None
        return {
            "id": obj.prestador_id,
            "nombre": obj.prestador.nombre,
            "nit": obj.prestador.nit,
        }

    def validate_email(self, value):
        normalized = value.strip().lower()
        if Usuario.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return normalized

    def validate_contrasena(self, value):
        """
        Ejecuta los AUTH_PASSWORD_VALIDATORS de Django más reglas adicionales:
        - Al menos una mayúscula
        - Al menos un dígito
        """
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc

        if not any(c.isupper() for c in value):
            raise serializers.ValidationError(
                "La contraseña debe contener al menos una letra mayúscula."
            )
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError(
                "La contraseña debe contener al menos un número."
            )
        return value

    def validate_prestador_nit(self, value):
        if value in (None, ""):
            return value
        if PrestadorServicio.objects.filter(nit=value).exists():
            raise serializers.ValidationError(
                "Ya existe un prestador con este NIT."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        prestador_nombre = validated_data.pop("prestador_nombre", None)
        prestador_nit = validated_data.pop("prestador_nit", None) or None
        prestador_ciudad = validated_data.pop("prestador_ciudad", None)

        # El hash lo aplica Usuario.save() automáticamente.
        usuario = Usuario.objects.create(**validated_data)

        if prestador_nombre:
            prestador = PrestadorServicio.objects.create(
                nombre=prestador_nombre,
                nit=prestador_nit,
                ciudad=prestador_ciudad,
            )
            usuario.prestador = prestador
            # Quien CREA un prestador queda como admin de su empresa.
            # Habilita invitar empleados y editar tarifas/empresa-cliente.
            usuario.es_admin_prestador = True
            usuario.save(update_fields=["prestador", "es_admin_prestador"])

        return usuario


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    contrasena = serializers.CharField()

    def validate_email(self, value):
        return value.strip().lower()


class UsuarioProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["idusuario", "nombre", "email", "rol", "fecha_registro", "is_active"]
        read_only_fields = ["idusuario", "fecha_registro", "is_active"]


class RegisterConCodigoSerializer(serializers.Serializer):
    """
    Registro de un usuario que se UNE a un PrestadorServicio existente
    mediante un código de invitación emitido por el admin del prestador.

    A diferencia de RegisterSerializer, NO crea un nuevo prestador:
    el usuario queda con `prestador_id = invitacion.prestador_id` y
    `es_admin_prestador = False` (es empleado, no admin).
    """

    nombre = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    contrasena = serializers.CharField(write_only=True, min_length=8)
    codigo = serializers.CharField(max_length=64)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if Usuario.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return normalized

    def validate_contrasena(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError(
                "La contraseña debe contener al menos una letra mayúscula."
            )
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError(
                "La contraseña debe contener al menos un número."
            )
        return value

    def validate_codigo(self, value):
        codigo = value.strip()
        try:
            invitacion = InvitacionPrestador.objects.select_related(
                "prestador"
            ).get(codigo=codigo)
        except InvitacionPrestador.DoesNotExist:
            raise serializers.ValidationError("Código de invitación inválido.")
        if invitacion.revocada:
            raise serializers.ValidationError("Esta invitación fue revocada.")
        if invitacion.usado_por_id is not None:
            raise serializers.ValidationError("Esta invitación ya fue usada.")
        if invitacion.vigente_hasta <= timezone.now():
            raise serializers.ValidationError("Esta invitación expiró.")
        # Adjuntamos la invitación validada para usarla en create()
        self.context["invitacion"] = invitacion
        return codigo

    @transaction.atomic
    def create(self, validated_data):
        invitacion = self.context["invitacion"]
        usuario = Usuario.objects.create(
            nombre=validated_data["nombre"],
            email=validated_data["email"],
            contrasena=validated_data["contrasena"],
            rol="user",
            prestador=invitacion.prestador,
            es_admin_prestador=False,
        )
        invitacion.usado_por = usuario
        invitacion.usado_at = timezone.now()
        invitacion.save(update_fields=["usado_por", "usado_at"])
        return usuario


class CoreUsuarioTokenRefreshSerializer(serializers.Serializer):
    """
    Refresh JWT que resuelve el usuario contra `core.Usuario` (no `auth.User`).

    Reemplaza al `TokenRefreshSerializer` por defecto de SimpleJWT, que invoca
    `get_user_model().objects.get(...)` y rompe en este proyecto porque el
    modelo operativo es `core.Usuario` y no se ha declarado AUTH_USER_MODEL.
    """

    refresh = serializers.CharField()

    def validate(self, attrs):
        try:
            refresh = RefreshToken(attrs["refresh"])
        except TokenError:
            raise serializers.ValidationError(
                {"refresh": "Token refresh inválido o expirado."}
            )

        user_id = refresh.get("user_id")
        if not user_id:
            raise serializers.ValidationError(
                {"refresh": "El token no contiene user_id."}
            )

        try:
            usuario = Usuario.objects.get(idusuario=user_id)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({"refresh": "Usuario no encontrado."})

        if not usuario.is_active:
            raise serializers.ValidationError({"refresh": "Usuario inactivo."})

        access = refresh.access_token
        access["user_id"] = usuario.idusuario
        access["email"] = usuario.email
        access["rol"] = usuario.rol

        return {"access": str(access)}
