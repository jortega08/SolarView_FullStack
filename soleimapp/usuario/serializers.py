from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.models import Usuario


class RegisterSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ["idusuario", "nombre", "email", "contrasena", "rol"]
        read_only_fields = ["idusuario"]

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

    def create(self, validated_data):
        # El hash lo aplica Usuario.save() automáticamente.
        return Usuario.objects.create(**validated_data)


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
