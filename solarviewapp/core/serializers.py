from rest_framework import serializers
from .models import Pais, Estado, Ciudad, Usuario, Domicilio


class PaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pais
        fields = ['idpais', 'nombre']


class EstadoSerializer(serializers.ModelSerializer):
    pais_nombre = serializers.CharField(source='pais.nombre', read_only=True)

    class Meta:
        model = Estado
        fields = ['idestado', 'nombre', 'pais', 'pais_nombre']


class CiudadSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)

    class Meta:
        model = Ciudad
        fields = ['idciudad', 'nombre', 'estado', 'estado_nombre']


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['idusuario', 'nombre', 'email', 'rol', 'fecha_registro']
        read_only_fields = ['idusuario', 'fecha_registro']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ['idusuario', 'nombre', 'email', 'contrasena', 'rol', 'fecha_registro']
        read_only_fields = ['idusuario', 'fecha_registro']

    def create(self, validated_data):
        # Password will be hashed by the model's save() method
        return super().create(validated_data)


class DomicilioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)

    class Meta:
        model = Domicilio
        fields = ['iddomicilio', 'ciudad', 'usuario', 'usuario_nombre', 'ciudad_nombre']