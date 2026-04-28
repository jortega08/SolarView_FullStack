from rest_framework import serializers

from core.models import Ciudad, Empresa, Usuario

from .models import Especialidad, PerfilTecnico


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ['idespecialidad', 'nombre', 'descripcion']


class PerfilTecnicoSerializer(serializers.ModelSerializer):
    """Serializer principal de PerfilTecnico (lectura y escritura)."""

    usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())
    empresa = serializers.PrimaryKeyRelatedField(queryset=Empresa.objects.all())
    especialidades = serializers.PrimaryKeyRelatedField(
        queryset=Especialidad.objects.all(), many=True, required=False
    )
    zonas = serializers.PrimaryKeyRelatedField(
        queryset=Ciudad.objects.all(), many=True, required=False
    )

    # Campos derivados, sólo lectura
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    especialidades_nombres = serializers.SerializerMethodField()
    zonas_nombres = serializers.SerializerMethodField()
    carga_actual = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = PerfilTecnico
        fields = [
            'idperfil',
            'usuario', 'usuario_nombre', 'usuario_email',
            'empresa', 'empresa_nombre',
            'cedula', 'telefono',
            'especialidades', 'especialidades_nombres',
            'zonas', 'zonas_nombres',
            'disponible', 'licencia_vence', 'notas',
            'carga_actual',
            'creado_at', 'actualizado_at',
        ]
        read_only_fields = ['idperfil', 'creado_at', 'actualizado_at']

    def get_especialidades_nombres(self, obj):
        return list(obj.especialidades.values_list('nombre', flat=True))

    def get_zonas_nombres(self, obj):
        return list(obj.zonas.values_list('nombre', flat=True))

    def validate(self, attrs):
        # Asegurar que el usuario no tenga ya otro perfil técnico
        usuario = attrs.get('usuario') or getattr(self.instance, 'usuario', None)
        if usuario and not self.instance:
            if PerfilTecnico.objects.filter(usuario=usuario).exists():
                raise serializers.ValidationError(
                    {'usuario': 'Este usuario ya tiene un perfil de técnico.'}
                )
        return attrs


class PerfilTecnicoLigeroSerializer(serializers.ModelSerializer):
    """Versión compacta para listados de despacho (`/disponibles/`)."""
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    carga_actual = serializers.IntegerField(read_only=True, required=False)
    especialidades_nombres = serializers.SerializerMethodField()

    class Meta:
        model = PerfilTecnico
        fields = [
            'idperfil',
            'usuario', 'usuario_nombre', 'usuario_email',
            'telefono', 'disponible',
            'especialidades_nombres', 'carga_actual',
        ]

    def get_especialidades_nombres(self, obj):
        return list(obj.especialidades.values_list('nombre', flat=True))
