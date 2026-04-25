from rest_framework import serializers

from .models import Ciudad, Domicilio, Empresa, Estado, Instalacion, Pais, RolInstalacion, Usuario


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
        return super().create(validated_data)


class DomicilioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)

    class Meta:
        model = Domicilio
        fields = ['iddomicilio', 'ciudad', 'usuario', 'usuario_nombre', 'ciudad_nombre']


class EmpresaSerializer(serializers.ModelSerializer):
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)

    class Meta:
        model = Empresa
        fields = ['idempresa', 'nombre', 'nit', 'sector', 'ciudad', 'ciudad_nombre', 'fecha_registro']
        read_only_fields = ['idempresa', 'fecha_registro']


class InstalacionSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)

    class Meta:
        model = Instalacion
        fields = [
            'idinstalacion',
            'empresa',
            'empresa_nombre',
            'nombre',
            'direccion',
            'ciudad',
            'ciudad_nombre',
            'tipo_sistema',
            'capacidad_panel_kw',
            'capacidad_bateria_kwh',
            'fecha_instalacion',
            'estado',
        ]
        read_only_fields = ['idinstalacion']


class RolInstalacionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    instalacion_nombre = serializers.CharField(source='instalacion.nombre', read_only=True)

    class Meta:
        model = RolInstalacion
        fields = ['id', 'usuario', 'usuario_nombre', 'instalacion', 'instalacion_nombre', 'rol']
        read_only_fields = ['id']
