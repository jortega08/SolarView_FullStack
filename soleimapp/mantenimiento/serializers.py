from rest_framework import serializers

from .models import ContratoServicio, Mantenimiento, PlanMantenimiento


class ContratoServicioSerializer(serializers.ModelSerializer):
    instalacion_nombre = serializers.CharField(source='instalacion.nombre', read_only=True)
    empresa_nombre = serializers.CharField(source='instalacion.empresa.nombre', read_only=True)

    class Meta:
        model = ContratoServicio
        fields = [
            'idcontrato', 'instalacion', 'instalacion_nombre', 'empresa_nombre',
            'nivel', 'horas_respuesta', 'frecuencia_preventivo_dias',
            'fecha_inicio', 'fecha_fin', 'activo',
            'creado_at', 'actualizado_at',
        ]
        read_only_fields = ['idcontrato', 'creado_at', 'actualizado_at']


class PlanMantenimientoSerializer(serializers.ModelSerializer):
    especialidad_nombre = serializers.CharField(
        source='especialidad_requerida.nombre', read_only=True, default=None,
    )

    class Meta:
        model = PlanMantenimiento
        fields = [
            'idplan', 'nombre', 'tipo_sistema',
            'frecuencia_dias', 'duracion_estimada_horas',
            'checklist',
            'especialidad_requerida', 'especialidad_nombre',
            'activo', 'creado_at',
        ]
        read_only_fields = ['idplan', 'creado_at']


class MantenimientoSerializer(serializers.ModelSerializer):
    instalacion_nombre = serializers.CharField(source='instalacion.nombre', read_only=True)
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)
    orden_codigo = serializers.SerializerMethodField()

    class Meta:
        model = Mantenimiento
        fields = [
            'idmantenimiento',
            'instalacion', 'instalacion_nombre',
            'plan', 'plan_nombre',
            'fecha_programada', 'estado', 'notas',
            'orden_trabajo', 'orden_codigo',
            'creado_at',
        ]
        read_only_fields = ['idmantenimiento', 'creado_at', 'orden_trabajo']

    def get_orden_codigo(self, obj):
        ot = getattr(obj, 'orden_trabajo', None)
        return ot.codigo if ot else None
