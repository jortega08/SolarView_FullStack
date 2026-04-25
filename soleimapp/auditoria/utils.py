from .models import EventoAuditoria


def registrar_evento(usuario, accion, entidad, entidad_id=None, detalle=None, request=None):
    ip_address = None
    if request is not None:
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            ip_address = forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

    return EventoAuditoria.objects.create(
        usuario=usuario,
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        detalle=detalle or {},
        ip_address=ip_address,
    )
