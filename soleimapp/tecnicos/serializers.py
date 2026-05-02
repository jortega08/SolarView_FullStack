import json

from rest_framework import serializers

from core.models import Ciudad, Empresa, PrestadorServicio, Usuario

from .models import Especialidad, PerfilTecnico


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ["idespecialidad", "nombre", "descripcion"]


class PerfilTecnicoSerializer(serializers.ModelSerializer):
    """Serializer principal de PerfilTecnico (lectura y escritura)."""

    usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())
    empresa = serializers.PrimaryKeyRelatedField(queryset=Empresa.objects.all())
    prestador = serializers.PrimaryKeyRelatedField(
        queryset=PrestadorServicio.objects.all(), required=False, allow_null=True
    )
    especialidades = serializers.PrimaryKeyRelatedField(
        queryset=Especialidad.objects.all(), many=True, required=False
    )
    zonas = serializers.PrimaryKeyRelatedField(
        queryset=Ciudad.objects.all(), many=True, required=False
    )

    # Campos derivados, sólo lectura
    usuario_nombre = serializers.CharField(source="usuario.nombre", read_only=True)
    usuario_email = serializers.CharField(source="usuario.email", read_only=True)
    empresa_nombre = serializers.CharField(source="empresa.nombre", read_only=True)
    prestador_nombre = serializers.CharField(
        source="prestador.nombre", read_only=True, default=""
    )
    especialidades_nombres = serializers.SerializerMethodField()
    zonas_nombres = serializers.SerializerMethodField()
    hoja_vida_url = serializers.SerializerMethodField()
    carga_actual = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = PerfilTecnico
        fields = [
            "idperfil",
            "usuario",
            "usuario_nombre",
            "usuario_email",
            "empresa",
            "empresa_nombre",
            "prestador",
            "prestador_nombre",
            "cedula",
            "telefono",
            "especialidades",
            "especialidades_nombres",
            "zonas",
            "zonas_nombres",
            "disponible",
            "area_profesional",
            "resumen_profesional",
            "hoja_vida",
            "hoja_vida_url",
            "estudios",
            "licencia_vence",
            "notas",
            # Formación y competencias
            "titulo_academico",
            "nivel_educativo",
            "certificaciones",
            "capacidad_operacion",
            "carga_actual",
            "creado_at",
            "actualizado_at",
        ]
        read_only_fields = ["idperfil", "creado_at", "actualizado_at"]

    def get_especialidades_nombres(self, obj):
        return list(obj.especialidades.values_list("nombre", flat=True))

    def get_zonas_nombres(self, obj):
        return list(obj.zonas.values_list("nombre", flat=True))

    def get_hoja_vida_url(self, obj):
        if not obj.hoja_vida:
            return None
        request = self.context.get("request")
        url = obj.hoja_vida.url
        return request.build_absolute_uri(url) if request else url

    def to_internal_value(self, data):
        if hasattr(data, "lists"):
            mutable = {
                key: values if len(values) > 1 else values[0]
                for key, values in data.lists()
            }
        else:
            mutable = data.copy() if hasattr(data, "copy") else dict(data)

        for field in ("especialidades", "zonas", "estudios"):
            value = mutable.get(field)
            if not isinstance(value, str):
                continue
            stripped = value.strip()
            if not stripped.startswith("["):
                continue
            try:
                mutable[field] = json.loads(stripped)
            except json.JSONDecodeError:
                pass

        return super().to_internal_value(mutable)

    def validate(self, attrs):
        # Asegurar que el usuario no tenga ya otro perfil técnico
        usuario = attrs.get("usuario") or getattr(self.instance, "usuario", None)
        if usuario and not self.instance:
            if PerfilTecnico.objects.filter(usuario=usuario).exists():
                raise serializers.ValidationError(
                    {"usuario": "Este usuario ya tiene un perfil de técnico."}
                )
        estudios = attrs.get("estudios")
        if estudios is not None and not isinstance(estudios, list):
            raise serializers.ValidationError(
                {"estudios": "Debe ser una lista de estudios."}
            )
        return attrs


class PerfilTecnicoLigeroSerializer(serializers.ModelSerializer):
    """Versión compacta para listados de despacho (`/disponibles/` y `/sugeridos/`)."""

    usuario_nombre = serializers.CharField(source="usuario.nombre", read_only=True)
    usuario_email = serializers.CharField(source="usuario.email", read_only=True)
    carga_actual = serializers.IntegerField(read_only=True, required=False)
    especialidades_nombres = serializers.SerializerMethodField()

    class Meta:
        model = PerfilTecnico
        fields = [
            "idperfil",
            "usuario",
            "usuario_nombre",
            "usuario_email",
            "telefono",
            "disponible",
            "especialidades_nombres",
            "area_profesional",
            "titulo_academico",
            "nivel_educativo",
            "capacidad_operacion",
            "carga_actual",
        ]

    def get_especialidades_nombres(self, obj):
        return list(obj.especialidades.values_list("nombre", flat=True))
