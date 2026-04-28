from rest_framework import serializers

from .models import ComentarioOrden, EvidenciaOrden, OrdenTrabajo


class ComentarioOrdenSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.nombre", read_only=True)

    class Meta:
        model = ComentarioOrden
        fields = [
            "idcomentario",
            "orden",
            "usuario",
            "usuario_nombre",
            "tipo",
            "texto",
            "creado_at",
        ]
        read_only_fields = ["idcomentario", "orden", "usuario", "creado_at"]


class EvidenciaOrdenSerializer(serializers.ModelSerializer):
    subido_por_nombre = serializers.CharField(
        source="subido_por.nombre", read_only=True
    )
    archivo_url = serializers.SerializerMethodField()

    class Meta:
        model = EvidenciaOrden
        fields = [
            "idevidencia",
            "orden",
            "tipo",
            "archivo",
            "archivo_url",
            "descripcion",
            "subido_por",
            "subido_por_nombre",
            "creado_at",
        ]
        read_only_fields = [
            "idevidencia",
            "orden",
            "subido_por",
            "creado_at",
            "archivo_url",
        ]

    def get_archivo_url(self, obj):
        if not obj.archivo:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.archivo.url)
        return obj.archivo.url


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    instalacion_nombre = serializers.CharField(
        source="instalacion.nombre", read_only=True
    )
    empresa_nombre = serializers.CharField(
        source="instalacion.empresa.nombre", read_only=True
    )
    asignado_a_nombre = serializers.CharField(
        source="asignado_a.nombre", read_only=True, default=None
    )
    creado_por_nombre = serializers.CharField(
        source="creado_por.nombre", read_only=True, default=None
    )
    sla_vencido = serializers.SerializerMethodField()
    tiempo_resolucion_horas = serializers.SerializerMethodField()

    class Meta:
        model = OrdenTrabajo
        fields = [
            "idorden",
            "codigo",
            "instalacion",
            "instalacion_nombre",
            "empresa_nombre",
            "alerta",
            "mantenimiento",
            "tipo",
            "prioridad",
            "estado",
            "titulo",
            "descripcion",
            "notas_resolucion",
            "asignado_a",
            "asignado_a_nombre",
            "creado_por",
            "creado_por_nombre",
            "sla_objetivo_horas",
            "sla_vencido",
            "creada_at",
            "asignada_at",
            "iniciada_at",
            "completada_at",
            "cerrada_at",
            "tiempo_resolucion_horas",
        ]
        read_only_fields = [
            "idorden",
            "codigo",
            "asignado_a",
            "creado_por",
            "asignada_at",
            "iniciada_at",
            "completada_at",
            "cerrada_at",
            "creada_at",
        ]

    def get_sla_vencido(self, obj):
        return obj.es_sla_vencido()

    def get_tiempo_resolucion_horas(self, obj):
        return obj.tiempo_resolucion_horas()


class OrdenTrabajoLigeroSerializer(serializers.ModelSerializer):
    """Versión liviana para `/mis-ordenes/` (móvil)."""

    instalacion_nombre = serializers.CharField(
        source="instalacion.nombre", read_only=True
    )
    sla_vencido = serializers.SerializerMethodField()

    class Meta:
        model = OrdenTrabajo
        fields = [
            "idorden",
            "codigo",
            "titulo",
            "instalacion",
            "instalacion_nombre",
            "tipo",
            "prioridad",
            "estado",
            "sla_objetivo_horas",
            "sla_vencido",
            "creada_at",
            "asignada_at",
        ]

    def get_sla_vencido(self, obj):
        return obj.es_sla_vencido()
