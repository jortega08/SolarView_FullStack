from rest_framework import serializers

from .models import Alerta, TipoAlerta


class TipoAlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAlerta
        fields = ['idtipoalerta', 'nombre', 'descripcion']


class AlertaSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='tipoalerta.nombre', read_only=True, default='Sin tipo')
    domicilio_nombre = serializers.StringRelatedField(source='domicilio', read_only=True)
    instalacion_nombre = serializers.CharField(source='instalacion.nombre', read_only=True, default='')
    resuelta_por_nombre = serializers.CharField(source='resuelta_por.nombre', read_only=True, default='')

    class Meta:
        model = Alerta
        fields = [
            'idalerta',
            'tipoalerta',
            'tipo_nombre',
            'domicilio',
            'domicilio_nombre',
            'instalacion',
            'instalacion_nombre',
            'mensaje',
            'fecha',
            'estado',
            'severidad',
            'causa_probable',
            'accion_sugerida',
            'resuelta_por',
            'resuelta_por_nombre',
        ]
        read_only_fields = ['idalerta', 'fecha']
