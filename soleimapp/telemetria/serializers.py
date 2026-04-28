from rest_framework import serializers

from .models import Bateria, Consumo


class ConsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consumo
        fields = [
            "idconsumo",
            "instalacion",
            "domicilio",
            "energia_consumida",
            "potencia",
            "fuente",
            "costo",
            "fecha",
        ]
        read_only_fields = fields


class BateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bateria
        fields = [
            "idbateria",
            "instalacion",
            "domicilio",
            "voltaje",
            "corriente",
            "temperatura",
            "capacidad_bateria",
            "porcentaje_carga",
            "tiempo_restante",
            "fecha_registro",
        ]
        read_only_fields = fields
