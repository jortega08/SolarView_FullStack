from rest_framework import serializers

from .models import Notificacion, PlantillaNotificacion


class PlantillaNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantillaNotificacion
        fields = ['idplantilla', 'clave', 'asunto', 'cuerpo_txt',
                  'cuerpo_html', 'canales_default', 'activo']
        read_only_fields = ['idplantilla']


class NotificacionSerializer(serializers.ModelSerializer):
    plantilla_clave = serializers.CharField(source='plantilla.clave', read_only=True, default=None)

    class Meta:
        model = Notificacion
        fields = [
            'idnotificacion', 'usuario', 'canal',
            'plantilla', 'plantilla_clave',
            'asunto', 'cuerpo', 'enlace',
            'estado', 'intentos', 'metadata',
            'creada_at', 'enviada_at', 'leida_at',
        ]
        read_only_fields = fields  # bandeja sólo lectura desde la API
