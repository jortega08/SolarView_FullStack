import csv
import logging
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Count, OuterRef, Q, Subquery, Sum
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from alerta.models import Alerta
from auditoria.utils import registrar_evento
from core.access import get_user_installation_queryset
from core.models import Instalacion
from core.permissions import IsActiveUser
from ordenes.models import OrdenTrabajo
from telemetria.models import Bateria, Consumo

from .permissions import (
    check_instalacion_access,
    get_user_from_request,
)

logger = logging.getLogger("soleim")


def _calcular_riesgo(alertas_criticas, alertas_medias, bateria_pct):
    if (alertas_criticas or 0) > 0:
        return "alto"
    if (alertas_medias or 0) > 0 or (bateria_pct is not None and bateria_pct < 20):
        return "medio"
    return "bajo"


def _autonomia_horas(instalacion):
    bateria = (
        Bateria.objects.filter(instalacion=instalacion)
        .order_by("-fecha_registro")
        .first()
    )
    if not bateria:
        return None

    desde = timezone.now() - timedelta(hours=24)
    total_24h = (
        Consumo.objects.filter(instalacion=instalacion, fecha__gte=desde)
        .aggregate(total=Sum("energia_consumida"))
        .get("total")
        or 0
    )
    promedio_hora = total_24h / 24 if total_24h else 0
    if promedio_hora <= 0:
        return None

    energia_disponible = bateria.capacidad_bateria * (bateria.porcentaje_carga / 100)
    return round(float(energia_disponible / promedio_hora), 2)


def _round_float(value, digits=2):
    if value is None:
        return None
    return round(float(value), digits)


def _solar_irradiancia(potencia_actual, capacidad_panel_kw):
    if potencia_actual is None or not capacidad_panel_kw:
        return None
    return round(
        max(0, min(1000, (float(potencia_actual) / capacidad_panel_kw) * 1000)),
        2,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def panel_empresa(request):
    usuario = get_user_from_request(request)
    cliente_id = request.GET.get("cliente_id") or request.GET.get("empresa_id")
    prestador_id = request.GET.get("prestador_id")
    cache_key = (
        f"panel_{usuario.idusuario}:cliente:{cliente_id or 'all'}:"
        f"prestador:{prestador_id or 'all'}"
    )
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)

    base_qs = get_user_installation_queryset(usuario)
    if cliente_id:
        base_qs = base_qs.filter(Q(cliente_id=cliente_id) | Q(empresa_id=cliente_id))
    if prestador_id:
        base_qs = base_qs.filter(prestador_id=prestador_id)

    if not base_qs.exists():
        data = {
            "empresa": None,
            "prestador": None,
            "clientes": [],
            "instalaciones": [],
            "resumen": {"total": 0, "con_alerta_critica": 0, "en_mantenimiento": 0},
        }
        cache.set(cache_key, data, 30)
        return JsonResponse(data)

    referencia = base_qs.select_related("empresa", "cliente", "prestador").first()
    if not referencia:
        return JsonResponse(
            {
                "empresa": None,
                "prestador": None,
                "clientes": [],
                "instalaciones": [],
                "resumen": {"total": 0, "con_alerta_critica": 0, "en_mantenimiento": 0},
            }
        )

    latest_battery = Bateria.objects.filter(instalacion_id=OuterRef("pk")).order_by(
        "-fecha_registro"
    )
    latest_consumo = Consumo.objects.filter(instalacion_id=OuterRef("pk")).order_by(
        "-fecha"
    )
    hoy = timezone.localdate()
    solar_hoy = (
        Consumo.objects.filter(
            instalacion_id=OuterRef("pk"),
            fecha__date=hoy,
            fuente="solar",
        )
        .values("instalacion_id")
        .annotate(total=Sum("energia_consumida"))
        .values("total")
    )
    red_hoy = (
        Consumo.objects.filter(
            instalacion_id=OuterRef("pk"),
            fecha__date=hoy,
            fuente="electrica",
        )
        .values("instalacion_id")
        .annotate(total=Sum("energia_consumida"))
        .values("total")
    )
    instalaciones = (
        base_qs.select_related("empresa", "cliente", "prestador", "ciudad")
        .annotate(
            bateria_pct=Subquery(latest_battery.values("porcentaje_carga")[:1]),
            bateria_temp=Subquery(latest_battery.values("temperatura")[:1]),
            ultimo_registro=Subquery(latest_battery.values("fecha_registro")[:1]),
            potencia_actual=Subquery(latest_consumo.values("potencia")[:1]),
            generacion_hoy=Subquery(solar_hoy[:1]),
            red_hoy=Subquery(red_hoy[:1]),
            alertas_criticas=Count(
                "alertas",
                filter=Q(
                    alertas__estado="activa", alertas__severidad__in=["critica", "alta"]
                ),
                distinct=True,
            ),
            alertas_medias=Count(
                "alertas",
                filter=Q(alertas__estado="activa", alertas__severidad="media"),
                distinct=True,
            ),
        )
        .order_by("nombre")
    )

    instalaciones_data = []
    con_alerta_critica = 0
    en_mantenimiento = 0
    total_generacion_hoy = 0.0
    total_red_hoy = 0.0
    temperaturas = []
    irradiancias = []

    for instalacion in instalaciones:
        bateria_pct = (
            instalacion.bateria_pct
            if instalacion.capacidad_bateria_kwh
            and instalacion.capacidad_bateria_kwh > 0
            else None
        )
        riesgo = _calcular_riesgo(
            instalacion.alertas_criticas,
            instalacion.alertas_medias,
            bateria_pct,
        )
        if instalacion.alertas_criticas:
            con_alerta_critica += 1
        if instalacion.estado == "mantenimiento":
            en_mantenimiento += 1

        generacion_hoy = float(instalacion.generacion_hoy or 0)
        red_kwh = float(instalacion.red_hoy or 0)
        total_generacion_hoy += generacion_hoy
        total_red_hoy += red_kwh
        if instalacion.bateria_temp is not None:
            temperaturas.append(float(instalacion.bateria_temp))
        irradiancia = _solar_irradiancia(
            instalacion.potencia_actual,
            instalacion.capacidad_panel_kw,
        )
        if irradiancia is not None:
            irradiancias.append(irradiancia)

        instalaciones_data.append(
            {
                "id": instalacion.idinstalacion,
                "nombre": instalacion.nombre,
                "estado": instalacion.estado,
                "bateria_pct": (
                    round(float(bateria_pct), 2) if bateria_pct is not None else None
                ),
                "alertas_criticas": instalacion.alertas_criticas,
                "riesgo": riesgo,
                "potencia_actual": _round_float(instalacion.potencia_actual),
                "generacion_hoy": round(generacion_hoy, 2),
                "tipo_sistema": instalacion.tipo_sistema,
                "empresa": (
                    instalacion.cliente.nombre
                    if instalacion.cliente
                    else instalacion.empresa.nombre
                ),
                "cliente": (
                    {
                        "id": instalacion.cliente_id,
                        "nombre": instalacion.cliente.nombre,
                    }
                    if instalacion.cliente
                    else {
                        "id": instalacion.empresa_id,
                        "nombre": instalacion.empresa.nombre,
                    }
                ),
                "prestador": (
                    {
                        "id": instalacion.prestador_id,
                        "nombre": instalacion.prestador.nombre,
                    }
                    if instalacion.prestador
                    else None
                ),
                "ciudad": instalacion.ciudad.nombre if instalacion.ciudad else None,
                "ultimo_registro": (
                    instalacion.ultimo_registro.isoformat()
                    if instalacion.ultimo_registro
                    else None
                ),
                "imagen": (
                    instalacion.imagen.url if instalacion.imagen else None
                ),
            }
        )

    inst_ids_ref = [item["id"] for item in instalaciones_data]
    ordenes_activas = OrdenTrabajo.objects.filter(
        instalacion_id__in=inst_ids_ref,
        estado__in=OrdenTrabajo.ESTADOS_ACTIVOS,
    ).select_related("instalacion")
    ordenes_abiertas = ordenes_activas.count()
    sla_en_riesgo = sum(1 for orden in ordenes_activas if orden.es_sla_vencido())
    energia_total = total_generacion_hoy + total_red_hoy
    temperatura_promedio = (
        round(sum(temperaturas) / len(temperaturas), 2) if temperaturas else None
    )
    irradiancia_promedio = (
        round(sum(irradiancias) / len(irradiancias), 2) if irradiancias else None
    )

    clientes = {}
    prestadores = {}
    for instalacion in instalaciones:
        cliente = instalacion.cliente or instalacion.empresa
        clientes[cliente.idempresa] = {
            "id": cliente.idempresa,
            "nombre": cliente.nombre,
        }
        if instalacion.prestador:
            prestadores[instalacion.prestador_id] = {
                "id": instalacion.prestador_id,
                "nombre": instalacion.prestador.nombre,
            }

    empresa_contexto = None
    if cliente_id and referencia:
        cliente_ref = referencia.cliente or referencia.empresa
        empresa_contexto = {"id": cliente_ref.idempresa, "nombre": cliente_ref.nombre}
    elif len(clientes) == 1:
        empresa_contexto = next(iter(clientes.values()))
    elif usuario.prestador_id and usuario.prestador:
        empresa_contexto = {
            "id": usuario.prestador_id,
            "nombre": usuario.prestador.nombre,
        }
    elif len(prestadores) == 1:
        empresa_contexto = next(iter(prestadores.values()))

    data = {
        "empresa": empresa_contexto,
        "prestador": (
            {"id": usuario.prestador_id, "nombre": usuario.prestador.nombre}
            if usuario.prestador_id and usuario.prestador
            else (next(iter(prestadores.values())) if len(prestadores) == 1 else None)
        ),
        "clientes": list(clientes.values()),
        "instalaciones_activas": sum(
            1 for item in instalaciones_data if item["estado"] == "activa"
        ),
        "total_generacion_hoy": round(total_generacion_hoy, 2),
        "ahorro_estimado": round(total_generacion_hoy * 800, 2),
        "alertas_criticas": con_alerta_critica,
        "ordenes_abiertas": ordenes_abiertas,
        "sla_en_riesgo": sla_en_riesgo,
        "fuentes_energia": {
            "solar_kwh": round(total_generacion_hoy, 2),
            "red_kwh": round(total_red_hoy, 2),
            "solar_pct": (
                round((total_generacion_hoy / energia_total) * 100, 2)
                if energia_total
                else 0
            ),
            "red_pct": (
                round((total_red_hoy / energia_total) * 100, 2) if energia_total else 0
            ),
        },
        "clima": {
            "temperatura": temperatura_promedio,
            "humedad": None,
            "viento": None,
            "descripcion": "Estimado desde telemetria de campo",
            "irradiancia": irradiancia_promedio,
        },
        "instalaciones": instalaciones_data,
        "resumen": {
            "total": len(instalaciones_data),
            "con_alerta_critica": con_alerta_critica,
            "en_mantenimiento": en_mantenimiento,
        },
    }
    cache.set(cache_key, data, 30)
    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def listar_instalaciones(request):
    usuario = get_user_from_request(request)
    cliente_id = request.GET.get("cliente_id") or request.GET.get("empresa_id")
    prestador_id = request.GET.get("prestador_id")

    instalaciones = get_user_installation_queryset(usuario).select_related(
        "empresa", "cliente", "prestador", "ciudad"
    )
    if cliente_id:
        instalaciones = instalaciones.filter(
            Q(cliente_id=cliente_id) | Q(empresa_id=cliente_id)
        )
    if prestador_id:
        instalaciones = instalaciones.filter(prestador_id=prestador_id)
    instalaciones = instalaciones.order_by(
        "cliente__nombre", "empresa__nombre", "nombre"
    )

    return JsonResponse(
        {
            "success": True,
            "results": [
                {
                    "id": instalacion.idinstalacion,
                    "nombre": instalacion.nombre,
                    "empresa": (
                        instalacion.cliente.nombre
                        if instalacion.cliente
                        else instalacion.empresa.nombre
                    ),
                    "cliente": (
                        {
                            "id": instalacion.cliente_id,
                            "nombre": instalacion.cliente.nombre,
                        }
                        if instalacion.cliente
                        else {
                            "id": instalacion.empresa_id,
                            "nombre": instalacion.empresa.nombre,
                        }
                    ),
                    "prestador": (
                        {
                            "id": instalacion.prestador_id,
                            "nombre": instalacion.prestador.nombre,
                        }
                        if instalacion.prestador
                        else None
                    ),
                    "ciudad": instalacion.ciudad.nombre if instalacion.ciudad else None,
                    "estado": instalacion.estado,
                    "tipo_sistema": instalacion.tipo_sistema,
                    "imagen": (
                        instalacion.imagen.url if instalacion.imagen else None
                    ),
                }
                for instalacion in instalaciones
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def detalle_instalacion(request, pk):
    usuario = get_user_from_request(request)
    if not check_instalacion_access(usuario, pk):
        return JsonResponse(
            {"success": False, "error": "Sin acceso a la instalacion"}, status=403
        )

    cache_key = f"instalacion_detail_{pk}"
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)

    instalacion = Instalacion.objects.select_related(
        "empresa", "cliente", "prestador", "ciudad"
    ).get(idinstalacion=pk)
    bateria = (
        Bateria.objects.filter(instalacion=instalacion)
        .order_by("-fecha_registro")
        .first()
    )
    hoy = timezone.localdate()

    consumo_hoy = Consumo.objects.filter(instalacion=instalacion, fecha__date=hoy)
    ultimo_consumo = (
        Consumo.objects.filter(instalacion=instalacion).order_by("-fecha").first()
    )
    consumo_solar = (
        consumo_hoy.filter(fuente="solar")
        .aggregate(total=Sum("energia_consumida"))
        .get("total")
        or 0
    )
    consumo_electrica = (
        consumo_hoy.filter(fuente="electrica")
        .aggregate(total=Sum("energia_consumida"))
        .get("total")
        or 0
    )
    costo_total = consumo_hoy.aggregate(total=Sum("costo")).get("total") or 0
    consumo_total = float(consumo_solar or 0) + float(consumo_electrica or 0)
    potencia_actual = ultimo_consumo.potencia if ultimo_consumo else None
    eficiencia = (
        _solar_irradiancia(potencia_actual, instalacion.capacidad_panel_kw) / 10
        if potencia_actual is not None and instalacion.capacidad_panel_kw
        else None
    )
    alertas = (
        Alerta.objects.filter(instalacion=instalacion, estado="activa")
        .select_related("tipoalerta", "resuelta_por")
        .order_by("-fecha")[:20]
    )

    data = {
        "instalacion": {
            "id": instalacion.idinstalacion,
            "empresa": (
                instalacion.cliente.nombre
                if instalacion.cliente
                else instalacion.empresa.nombre
            ),
            "cliente": (
                {
                    "id": instalacion.cliente_id,
                    "nombre": instalacion.cliente.nombre,
                }
                if instalacion.cliente
                else {
                    "id": instalacion.empresa_id,
                    "nombre": instalacion.empresa.nombre,
                }
            ),
            "prestador": (
                {
                    "id": instalacion.prestador_id,
                    "nombre": instalacion.prestador.nombre,
                }
                if instalacion.prestador
                else None
            ),
            "nombre": instalacion.nombre,
            "direccion": instalacion.direccion,
            "ciudad": instalacion.ciudad.nombre if instalacion.ciudad else None,
            "tipo_sistema": instalacion.tipo_sistema,
            "capacidad_panel_kw": instalacion.capacidad_panel_kw,
            "capacidad_bateria_kwh": instalacion.capacidad_bateria_kwh,
            "estado": instalacion.estado,
            "fecha_instalacion": (
                instalacion.fecha_instalacion.isoformat()
                if instalacion.fecha_instalacion
                else None
            ),
            "potencia_actual": _round_float(potencia_actual),
            "generacion_hoy": round(float(consumo_solar), 2),
            "consumo_actual": round(consumo_total, 2),
            "bateria_soc": (
                round(float(bateria.porcentaje_carga), 2)
                if bateria and instalacion.capacidad_bateria_kwh > 0
                else None
            ),
            "eficiencia": round(eficiencia, 2) if eficiencia is not None else None,
            "imagen": (
                instalacion.imagen.url if instalacion.imagen else None
            ),
        },
        "bateria": (
            {
                "voltaje": bateria.voltaje,
                "corriente": bateria.corriente,
                "temperatura": bateria.temperatura,
                "capacidad_bateria": bateria.capacidad_bateria,
                "porcentaje_carga": bateria.porcentaje_carga,
                "tiempo_restante": bateria.tiempo_restante,
                "fecha_registro": bateria.fecha_registro.isoformat(),
            }
            if bateria
            else None
        ),
        "consumo_hoy": {
            "solar": round(float(consumo_solar), 2),
            "electrica": round(float(consumo_electrica), 2),
            "costo": round(float(costo_total), 2),
        },
        "alertas_activas": [
            {
                "id": alerta.idalerta,
                "mensaje": alerta.mensaje,
                "severidad": alerta.severidad,
                "causa_probable": alerta.causa_probable,
                "accion_sugerida": alerta.accion_sugerida,
                "fecha": alerta.fecha.isoformat(),
                "tipo": alerta.tipoalerta.nombre if alerta.tipoalerta else None,
            }
            for alerta in alertas
        ],
        "autonomia_estimada_horas": _autonomia_horas(instalacion),
    }

    cache.set(cache_key, data, 30)
    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def reporte_consumo_csv(request):
    usuario = get_user_from_request(request)
    instalacion_id = request.GET.get("instalacion_id")
    dias = int(request.GET.get("dias", 30))

    if not instalacion_id:
        return JsonResponse(
            {"success": False, "error": "instalacion_id es requerido"}, status=400
        )
    if not check_instalacion_access(usuario, int(instalacion_id)):
        return JsonResponse({"success": False, "error": "Sin acceso"}, status=403)

    instalacion = Instalacion.objects.select_related("empresa").get(
        idinstalacion=instalacion_id
    )
    desde = timezone.now() - timedelta(days=dias)
    consumos = (
        Consumo.objects.filter(instalacion=instalacion, fecha__gte=desde)
        .order_by("-fecha")
        .values("fecha", "fuente", "energia_consumida", "potencia", "costo")
    )

    # Auditor\u00eda de descarga
    logger.info(
        "Descarga CSV consumo \u2014 usuario=%s instalacion=%s dias=%s",
        usuario.email,
        instalacion_id,
        dias,
    )
    registrar_evento(
        usuario=usuario,
        accion="descarga_reporte_consumo",
        entidad="Instalacion",
        entidad_id=int(instalacion_id),
        detalle={"dias": dias, "instalacion_nombre": instalacion.nombre},
        request=request,
    )

    nombre_archivo = f"consumo_{instalacion.nombre.replace(' ', '_')}_{dias}d.csv"
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{nombre_archivo}"'
    response.write("\ufeff")  # BOM para Excel

    writer = csv.writer(response)
    writer.writerow(["Fecha", "Fuente", "Energia_kWh", "Potencia_kW", "Costo_COP"])
    for c in consumos:
        writer.writerow(
            [
                c["fecha"].strftime("%Y-%m-%d %H:%M"),
                c["fuente"],
                c["energia_consumida"],
                c["potencia"],
                c["costo"],
            ]
        )
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def reporte_alertas_csv(request):
    usuario = get_user_from_request(request)
    instalacion_id = request.GET.get("instalacion_id")
    dias = int(request.GET.get("dias", 30))

    if not instalacion_id:
        return JsonResponse(
            {"success": False, "error": "instalacion_id es requerido"}, status=400
        )
    if not check_instalacion_access(usuario, int(instalacion_id)):
        return JsonResponse({"success": False, "error": "Sin acceso"}, status=403)

    instalacion = Instalacion.objects.select_related("empresa").get(
        idinstalacion=instalacion_id
    )
    desde = timezone.now() - timedelta(days=dias)
    alertas = (
        Alerta.objects.filter(instalacion=instalacion, fecha__gte=desde)
        .select_related("tipoalerta", "resuelta_por")
        .order_by("-fecha")
        .values(
            "fecha",
            "severidad",
            "estado",
            "mensaje",
            "causa_probable",
            "accion_sugerida",
            "resuelta_por__nombre",
        )
    )

    # Auditor\u00eda de descarga
    logger.info(
        "Descarga CSV alertas \u2014 usuario=%s instalacion=%s dias=%s",
        usuario.email,
        instalacion_id,
        dias,
    )
    registrar_evento(
        usuario=usuario,
        accion="descarga_reporte_alertas",
        entidad="Instalacion",
        entidad_id=int(instalacion_id),
        detalle={"dias": dias, "instalacion_nombre": instalacion.nombre},
        request=request,
    )

    nombre_archivo = f"alertas_{instalacion.nombre.replace(' ', '_')}_{dias}d.csv"
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{nombre_archivo}"'
    response.write("\ufeff")

    writer = csv.writer(response)
    writer.writerow(
        [
            "Fecha",
            "Severidad",
            "Estado",
            "Mensaje",
            "Causa_probable",
            "Accion_sugerida",
            "Resuelta_por",
        ]
    )
    for a in alertas:
        writer.writerow(
            [
                a["fecha"].strftime("%Y-%m-%d %H:%M"),
                a["severidad"],
                a["estado"],
                a["mensaje"],
                a["causa_probable"] or "",
                a["accion_sugerida"] or "",
                a["resuelta_por__nombre"] or "",
            ]
        )
    return response
