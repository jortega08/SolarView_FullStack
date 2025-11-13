from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from alerta.models import Alerta

@csrf_exempt
@require_GET
def ultimas_alertas(request):
    domicilio_id = request.GET.get("domicilio_id")
    queryset = (
        Alerta.objects
        .select_related('domicilio__ciudad__estado__pais', 'domicilio__usuario', 'tipoalerta')
    )
    if domicilio_id:
        queryset = queryset.filter(domicilio__iddomicilio=domicilio_id)
    alertas = queryset.order_by('-fecha')[:10]
    
    # Armar respuesta con campos útiles
    data = [
        {
            "id": alerta.idalerta,
            "estado": alerta.estado,
            "mensaje": alerta.mensaje,
            "fecha": alerta.fecha.strftime("%Y-%m-%d %H:%M"),
            "domicilio": str(alerta.domicilio),
            "usuario": alerta.domicilio.usuario.nombre,
            "ciudad": alerta.domicilio.ciudad.nombre,
            "tipo": (alerta.tipoalerta.nombre if alerta.tipoalerta else "Sin tipo"),
            "tipo_desc": (alerta.tipoalerta.descripcion if alerta.tipoalerta else ""),
        }
        for alerta in alertas
    ]
    return JsonResponse(data, safe=False)
