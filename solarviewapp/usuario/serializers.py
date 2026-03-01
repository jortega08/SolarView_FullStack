from rest_framework import serializers
from core.models import Usuario


class RegisterSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ['idusuario', 'nombre', 'email', 'contrasena', 'rol']
        read_only_fields = ['idusuario']

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email.")
        return value

    def create(self, validated_data):
        # Password will be hashed by the model's save() method
        return Usuario.objects.create(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    contrasena = serializers.CharField()


class UsuarioProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['idusuario', 'nombre', 'email', 'rol', 'fecha_registro']
        read_only_fields = ['idusuario', 'fecha_registro']
