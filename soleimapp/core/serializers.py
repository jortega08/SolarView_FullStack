from rest_framework import serializers

from .models import (
    Ciudad,
    Domicilio,
    Empresa,
    Estado,
    Instalacion,
    InvitacionPrestador,
    Pais,
    PrestadorServicio,
    RolInstalacion,
    Sensor,
    Tarifa,
    Usuario,
)


class PaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pais
        fields = ["idpais", "nombre"]


class EstadoSerializer(serializers.ModelSerializer):
    pais_nombre = serializers.CharField(source="pais.nombre", read_only=True)

    class Meta:
        model = Estado
        fields = ["idestado", "nombre", "pais", "pais_nombre"]


class CiudadSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source="estado.nombre", read_only=True)

    class Meta:
        model = Ciudad
        fields = ["idciudad", "nombre", "estado", "estado_nombre"]


class UsuarioSerializer(serializers.ModelSerializer):
    prestador_nombre = serializers.CharField(source="prestador.nombre", read_only=True)
    empresa_cliente_nombre = serializers.CharField(
        source="empresa_cliente.nombre", read_only=True
    )

    class Meta:
        model = Usuario
        fields = [
            "idusuario",
            "nombre",
            "email",
            "rol",
            "prestador",
            "prestador_nombre",
            "empresa_cliente",
            "empresa_cliente_nombre",
            "fecha_registro",
        ]
        read_only_fields = ["idusuario", "fecha_registro"]


class UsuarioCreateSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = [
            "idusuario",
            "nombre",
            "email",
            "contrasena",
            "rol",
            "prestador",
            "empresa_cliente",
            "fecha_registro",
        ]
        read_only_fields = ["idusuario", "fecha_registro"]

    def create(self, validated_data):
        return super().create(validated_data)


class _PaisNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pais
        fields = ['idpais', 'nombre']


class _EstadoNestedSerializer(serializers.ModelSerializer):
    pais = _PaisNestedSerializer(read_only=True)

    class Meta:
        model = Estado
        fields = ['idestado', 'nombre', 'pais']


class _CiudadNestedSerializer(serializers.ModelSerializer):
    estado = _EstadoNestedSerializer(read_only=True)

    class Meta:
        model = Ciudad
        fields = ['idciudad', 'nombre', 'estado']


class DomicilioSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    ciudad  = _CiudadNestedSerializer(read_only=True)

    # campos de escritura para recibir IDs del frontend
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(), source='usuario', write_only=True
    )
    ciudad_id = serializers.PrimaryKeyRelatedField(
        queryset=Ciudad.objects.all(), source='ciudad', write_only=True
    )

    class Meta:
        model = Domicilio
        fields = ['iddomicilio', 'usuario', 'ciudad', 'usuario_id', 'ciudad_id']


class EmpresaSerializer(serializers.ModelSerializer):
    ciudad_nombre = serializers.CharField(source="ciudad.nombre", read_only=True)

    class Meta:
        model = Empresa
        fields = [
            "idempresa",
            "nombre",
            "nit",
            "sector",
            "ciudad",
            "ciudad_nombre",
            "fecha_registro",
        ]
        read_only_fields = ["idempresa", "fecha_registro"]


class PrestadorServicioSerializer(serializers.ModelSerializer):
    ciudad_nombre = serializers.CharField(source="ciudad.nombre", read_only=True)

    class Meta:
        model = PrestadorServicio
        fields = [
            "idprestador",
            "nombre",
            "nit",
            "ciudad",
            "ciudad_nombre",
            "activo",
            "fecha_registro",
        ]
        read_only_fields = ["idprestador", "fecha_registro"]


class InstalacionSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source="empresa.nombre", read_only=True)
    prestador_nombre = serializers.CharField(source="prestador.nombre", read_only=True)
    cliente_nombre = serializers.CharField(source="cliente.nombre", read_only=True)
    ciudad_nombre = serializers.CharField(source="ciudad.nombre", read_only=True)
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Instalacion
        fields = [
            "idinstalacion",
            "empresa",
            "empresa_nombre",
            "prestador",
            "prestador_nombre",
            "cliente",
            "cliente_nombre",
            "nombre",
            "direccion",
            "ciudad",
            "ciudad_nombre",
            "tipo_sistema",
            "capacidad_panel_kw",
            "capacidad_bateria_kwh",
            "fecha_instalacion",
            "estado",
            "imagen",
            "imagen_url",
        ]
        read_only_fields = ["idinstalacion"]

    def get_imagen_url(self, obj):
        if not obj.imagen:
            return None
        request = self.context.get("request")
        url = obj.imagen.url
        return request.build_absolute_uri(url) if request else url


class RolInstalacionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.nombre", read_only=True)
    instalacion_nombre = serializers.CharField(
        source="instalacion.nombre", read_only=True
    )

    class Meta:
        model = RolInstalacion
        fields = [
            "id",
            "usuario",
            "usuario_nombre",
            "instalacion",
            "instalacion_nombre",
            "rol",
        ]
        read_only_fields = ["id"]


class InvitacionPrestadorSerializer(serializers.ModelSerializer):
    prestador_nombre = serializers.CharField(
        source="prestador.nombre", read_only=True
    )
    creado_por_nombre = serializers.CharField(
        source="creado_por.nombre", read_only=True, default=None
    )
    usado_por_nombre = serializers.CharField(
        source="usado_por.nombre", read_only=True, default=None
    )
    vigente = serializers.SerializerMethodField()

    class Meta:
        model = InvitacionPrestador
        fields = [
            "idinvitacion",
            "prestador",
            "prestador_nombre",
            "codigo",
            "rol",
            "email_destino",
            "creado_por",
            "creado_por_nombre",
            "creado_at",
            "vigente_hasta",
            "usado_por",
            "usado_por_nombre",
            "usado_at",
            "revocada",
            "vigente",
        ]
        read_only_fields = [
            "idinvitacion",
            "codigo",
            "creado_por",
            "creado_at",
            "usado_por",
            "usado_at",
            "prestador",  # se infiere del usuario que la crea
        ]

    def get_vigente(self, obj):
        return obj.esta_vigente()


class TarifaSerializer(serializers.ModelSerializer):
    ciudad_nombre = serializers.CharField(source="ciudad.nombre", read_only=True)
    instalacion_nombre = serializers.CharField(
        source="instalacion.nombre", read_only=True
    )

    class Meta:
        model = Tarifa
        fields = [
            "idtarifa",
            "nombre",
            "ciudad",
            "ciudad_nombre",
            "instalacion",
            "instalacion_nombre",
            "valor_kwh",
            "moneda",
            "vigente_desde",
            "vigente_hasta",
            "creado_at",
            "actualizado_at",
        ]
        read_only_fields = ["idtarifa", "creado_at", "actualizado_at"]

    def validate(self, attrs):
        ciudad = attrs.get("ciudad")
        instalacion = attrs.get("instalacion")
        if ciudad is None and instalacion is None:
            # Tarifa global por defecto: permitida pero advertir intención.
            return attrs
        if ciudad is not None and instalacion is not None:
            raise serializers.ValidationError(
                "Una tarifa aplica a ciudad O instalación, no a ambas."
            )
        vigente_desde = attrs.get("vigente_desde")
        vigente_hasta = attrs.get("vigente_hasta")
        if (
            vigente_desde is not None
            and vigente_hasta is not None
            and vigente_hasta <= vigente_desde
        ):
            raise serializers.ValidationError(
                "vigente_hasta debe ser posterior a vigente_desde."
            )
        return attrs


class SensorSerializer(serializers.ModelSerializer):
    instalacion_nombre = serializers.CharField(
        source="instalacion.nombre", read_only=True, default=""
    )

    class Meta:
        model = Sensor
        fields = [
            "idsensor",
            "instalacion",
            "instalacion_nombre",
            "nombre",
            "codigo",
            "tipo",
            "unidad",
            "estado",
            "ultima_lectura",
            "fecha_ultima_lectura",
            "notas",
            "creado_at",
            "actualizado_at",
        ]
        read_only_fields = ["idsensor", "creado_at", "actualizado_at"]
