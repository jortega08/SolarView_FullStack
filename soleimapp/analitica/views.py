import logging
from calendar import monthrange
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Avg, Case, Count, FloatField, Q, Sum, When
from django.db.models.functions import TruncDay
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from alerta.models import Alerta
from core.access import get_user_installation_queryset
from core.models import Domicilio, Empresa, Instalacion
from core.permissions import IsActiveUser
from telemetria.models import Bateria, Consumo

logger = logging.getLogger("soleim")

CACHE_TTL_SHORT = 30
CACHE_TTL_MEDIUM = 300


def _resolve_context(request):
    domicilio_id = request.GET.get("domicilio_id")
    instalacion_id = request.GET.get("instalacion_id")

    domicilio = (
        Domicilio.objects.filter(iddomicilio=domicilio_id).first()
        if domicilio_id
        else None
    )
    if (
        domicilio_id
        and domicilio is not None
        and getattr(request.user, "rol", None) != "admin"
        and domicilio.usuario_id != request.user.idusuario
    ):
        raise ValueError("Sin acceso al domicilio")
    instalacion = (
        get_user_installation_queryset(request.user)
        .filter(idinstalacion=instalacion_id)
        .first()
        if instalacion_id
        else None
    )
    if instalacion_id and instalacion is None:
        raise ValueError("Sin acceso a la instalacion")
    return domicilio, instalacion


def _build_filters(user, domicilio=None, instalacion=None):
    if instalacion is not None:
        return {"instalacion": instalacion}
    if domicilio is not None:
        return {"domicilio": domicilio}
    if getattr(user, "rol", None) != "admin":
        ids = get_user_installation_queryset(user).values_list(
            "idinstalacion", flat=True
        )
        return {"instalacion_id__in": ids}
    return {}


def _estado_bateria(porcentaje_carga, temperatura):
    if porcentaje_carga is None:
        return None
    if porcentaje_carga <= 15 or (temperatura is not None and temperatura >= 40):
        return "critica"
    if porcentaje_carga <= 30 or (temperatura is not None and temperatura >= 36):
        return "advertencia"
    return "normal"


def _irradiancia_desde_generacion(generacion_kwh, capacidad_panel_kw):
    if not capacidad_panel_kw:
        return None
    # Estimado diario: 5 horas solares pico como base conservadora.
    return round(
        max(0, min(1000, (generacion_kwh / (capacidad_panel_kw * 5)) * 1000)),
        2,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def obtener_actividades_mensuales(request):
    try:
        domicilio, instalacion = _resolve_context(request)
        periodo = request.GET.get("periodo", "year")
        context_key = (
            instalacion.idinstalacion
            if instalacion
            else (domicilio.iddomicilio if domicilio else 1)
        )
        filtros = _build_filters(
            request.user, domicilio=domicilio, instalacion=instalacion
        )

        cache_key = f"actividades_{context_key}_{periodo}"
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse(
                {"success": True, "data": cached, "periodo": periodo, "cached": True}
            )

        hoy = timezone.localdate()
        actividades = []

        if periodo == "week":
            start_date = hoy - timedelta(days=6)
            qs = Consumo.objects.filter(
                **filtros,
                fecha__date__gte=start_date,
                fecha__date__lte=hoy,
            )
            agregados = (
                qs.annotate(dia=TruncDay("fecha"))
                .values("dia", "fuente")
                .annotate(total=Sum("energia_consumida"))
            )
            mapa = {}
            for row in agregados:
                dia = row["dia"].date()
                mapa.setdefault(dia, {"solar": 0.0, "electrica": 0.0})
                if row["fuente"] in ("solar", "electrica"):
                    mapa[dia][row["fuente"]] += float(row["total"] or 0)

            for i in range(6, -1, -1):
                fecha = hoy - timedelta(days=i)
                actividades.append(
                    {
                        "mes": fecha.strftime("%a %d"),
                        "fecha": fecha.isoformat(),
                        "solar": round(mapa.get(fecha, {}).get("solar", 0.0), 2),
                        "electrica": round(
                            mapa.get(fecha, {}).get("electrica", 0.0), 2
                        ),
                    }
                )

        elif periodo == "month":
            start_date = hoy.replace(day=1)
            ultimo_dia = monthrange(hoy.year, hoy.month)[1]
            qs = Consumo.objects.filter(
                **filtros,
                fecha__date__gte=start_date,
                fecha__date__lte=hoy,
            )
            agregados = (
                qs.annotate(dia=TruncDay("fecha"))
                .values("dia", "fuente")
                .annotate(total=Sum("energia_consumida"))
                .order_by("dia")
            )
            mapa = {}
            for row in agregados:
                dia = row["dia"].date()
                mapa.setdefault(dia, {"solar": 0.0, "electrica": 0.0})
                if row["fuente"] in ("solar", "electrica"):
                    mapa[dia][row["fuente"]] += float(row["total"] or 0)

            for day in range(1, ultimo_dia + 1):
                fecha = hoy.replace(day=day)
                actividades.append(
                    {
                        "mes": fecha.strftime("%a %d"),
                        "fecha": fecha.isoformat(),
                        "solar": round(mapa.get(fecha, {}).get("solar", 0.0), 2),
                        "electrica": round(
                            mapa.get(fecha, {}).get("electrica", 0.0), 2
                        ),
                        "dia": day,
                    }
                )

        else:
            meses_labels = [
                "Ene",
                "Feb",
                "Mar",
                "Abr",
                "May",
                "Jun",
                "Jul",
                "Ago",
                "Sep",
                "Oct",
                "Nov",
                "Dic",
            ]
            year = hoy.year
            month = hoy.month
            twelve_months_ago = hoy - timedelta(days=365)
            qs = (
                Consumo.objects.filter(
                    **filtros, fecha__date__gte=twelve_months_ago, fecha__date__lte=hoy
                )
                .values("fecha__year", "fecha__month", "fuente")
                .annotate(total=Sum("energia_consumida"))
            )
            mapa = {}
            for row in qs:
                key = (row["fecha__year"], row["fecha__month"])
                mapa.setdefault(key, {"solar": 0.0, "electrica": 0.0})
                if row["fuente"] in ("solar", "electrica"):
                    mapa[key][row["fuente"]] = float(row["total"] or 0)

            for _ in range(11, -1, -1):
                key = (year, month)
                actividades.append(
                    {
                        "mes": meses_labels[month - 1],
                        "ano": year,
                        "solar": round(mapa.get(key, {}).get("solar", 0.0), 2),
                        "electrica": round(mapa.get(key, {}).get("electrica", 0.0), 2),
                    }
                )
                month -= 1
                if month == 0:
                    month = 12
                    year -= 1
            actividades = list(reversed(actividades))

        cache.set(cache_key, actividades, CACHE_TTL_SHORT)
        return JsonResponse({"success": True, "data": actividades, "periodo": periodo})
    except Exception as e:
        logger.exception("Error en obtener_actividades_mensuales")
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def obtener_estado_bateria(request):
    try:
        domicilio, instalacion = _resolve_context(request)
        context_key = (
            instalacion.idinstalacion
            if instalacion
            else (domicilio.iddomicilio if domicilio else 1)
        )
        filtros = _build_filters(
            request.user, domicilio=domicilio, instalacion=instalacion
        )

        cache_key = f"bateria_{context_key}"
        cached = cache.get(cache_key)
        if cached is not None:
            return JsonResponse({"success": True, "data": cached, "cached": True})

        bateria = Bateria.objects.filter(**filtros).order_by("-fecha_registro").first()
        consumo = Consumo.objects.filter(**filtros).order_by("-fecha").first()
        if bateria:
            capacidad_disponible = bateria.capacidad_bateria * (
                bateria.porcentaje_carga / 100
            )
            data = {
                "instalacion_id": bateria.instalacion_id,
                "voltaje": bateria.voltaje,
                "corriente": bateria.corriente,
                "temperatura": bateria.temperatura,
                "capacidad": bateria.capacidad_bateria,
                "capacidad_bateria": bateria.capacidad_bateria,
                "capacidad_total": bateria.capacidad_bateria,
                "capacidad_disponible": round(float(capacidad_disponible), 2),
                "porcentaje_carga": bateria.porcentaje_carga,
                "soc": bateria.porcentaje_carga,
                "tiempo_restante": bateria.tiempo_restante,
                "tiempo_restante_minutos": round(
                    float(bateria.tiempo_restante) * 60,
                    2,
                ),
                "estado": _estado_bateria(
                    bateria.porcentaje_carga, bateria.temperatura
                ),
                "fuente_principal": consumo.fuente if consumo else None,
                "desde_red": (
                    round(float(consumo.potencia), 2)
                    if consumo and consumo.fuente == "electrica"
                    else 0
                ),
                "fecha": bateria.fecha_registro.isoformat(),
            }
        else:
            data = None

        cache.set(cache_key, data, CACHE_TTL_SHORT)
        return JsonResponse({"success": True, "data": data})
    except Exception as e:
        logger.exception("Error en obtener_estado_bateria")
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def autonomia_instalacion(request):
    try:
        instalacion_id = request.GET.get("instalacion_id")
        if not instalacion_id:
            return JsonResponse(
                {"success": False, "error": "instalacion_id es requerido"}, status=400
            )

        cache_key = f"autonomia_{instalacion_id}"
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({"success": True, "data": cached, "cached": True})

        instalacion = Instalacion.objects.get(idinstalacion=instalacion_id)
        bateria = (
            Bateria.objects.filter(instalacion=instalacion)
            .order_by("-fecha_registro")
            .first()
        )
        if not bateria:
            data = {
                "instalacion_id": instalacion.idinstalacion,
                "autonomia_horas": None,
                "autonomia_minutos": None,
            }
        else:
            desde = timezone.now() - timedelta(hours=24)
            total_24h = (
                Consumo.objects.filter(instalacion=instalacion, fecha__gte=desde)
                .aggregate(total=Sum("energia_consumida"))
                .get("total")
                or 0
            )
            promedio_hora = total_24h / 24 if total_24h else 0
            if promedio_hora <= 0:
                data = {
                    "instalacion_id": instalacion.idinstalacion,
                    "autonomia_horas": None,
                    "autonomia_minutos": None,
                }
            else:
                autonomia_horas = (
                    bateria.capacidad_bateria * (bateria.porcentaje_carga / 100)
                ) / promedio_hora
                data = {
                    "instalacion_id": instalacion.idinstalacion,
                    "autonomia_horas": round(float(autonomia_horas), 2),
                    "autonomia_minutos": round(float(autonomia_horas) * 60, 2),
                }

        cache.set(cache_key, data, CACHE_TTL_SHORT)
        return JsonResponse({"success": True, "data": data})
    except Exception as e:
        logger.exception("Error en autonomia_instalacion")
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def tendencia_instalacion(request):
    try:
        instalacion_id = request.GET.get("instalacion_id")
        dias = int(request.GET.get("dias", 7))
        if not instalacion_id:
            return JsonResponse(
                {"success": False, "error": "instalacion_id es requerido"}, status=400
            )

        cache_key = f"tendencia_{instalacion_id}_{dias}"
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({"success": True, "data": cached, "cached": True})

        instalacion = Instalacion.objects.get(idinstalacion=instalacion_id)
        hoy = timezone.localdate()
        inicio = hoy - timedelta(days=max(dias - 1, 0))

        consumos = (
            Consumo.objects.filter(
                instalacion=instalacion, fecha__date__gte=inicio, fecha__date__lte=hoy
            )
            .annotate(dia=TruncDay("fecha"))
            .values("dia", "fuente")
            .annotate(total=Sum("energia_consumida"))
            .order_by("dia")
        )
        baterias = (
            Bateria.objects.filter(
                instalacion=instalacion,
                fecha_registro__date__gte=inicio,
                fecha_registro__date__lte=hoy,
            )
            .annotate(dia=TruncDay("fecha_registro"))
            .values("dia")
            .annotate(bateria_avg=Avg("porcentaje_carga"))
            .order_by("dia")
        )

        mapa = {}
        for row in consumos:
            dia = row["dia"].date()
            mapa.setdefault(dia, {"solar": 0.0, "electrica": 0.0, "bateria_avg": None})
            mapa[dia][row["fuente"]] = round(float(row["total"] or 0), 2)
        for row in baterias:
            dia = row["dia"].date()
            mapa.setdefault(dia, {"solar": 0.0, "electrica": 0.0, "bateria_avg": None})
            mapa[dia]["bateria_avg"] = round(float(row["bateria_avg"] or 0), 2)

        data = []
        for i in range(dias):
            fecha = inicio + timedelta(days=i)
            datos = mapa.get(
                fecha, {"solar": 0.0, "electrica": 0.0, "bateria_avg": None}
            )
            solar = datos["solar"]
            electrica = datos["electrica"]
            consumo_total = round(solar + electrica, 2)
            data.append(
                {
                    "fecha": fecha.isoformat(),
                    "solar": solar,
                    "electrica": electrica,
                    "generacion": solar,
                    "consumo": consumo_total,
                    "bateria_avg": datos["bateria_avg"],
                    "bateria_soc": datos["bateria_avg"],
                    "irradiancia": _irradiancia_desde_generacion(
                        solar, instalacion.capacidad_panel_kw
                    ),
                    "exportacion": round(max(solar - electrica, 0), 2),
                    "importacion": electrica,
                }
            )

        cache.set(cache_key, data, CACHE_TTL_MEDIUM)
        return JsonResponse({"success": True, "data": data})
    except Exception as e:
        logger.exception("Error en tendencia_instalacion")
        return JsonResponse({"success": False, "error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def comparativa_empresa(request):
    """
    Comparativa de consumo por instalación para los últimos 30 días.

    P2 — Reescrito para eliminar el N+1 original (4 queries por instalación).
    Ahora usa exactamente 3 queries sin importar cuántas instalaciones tenga la empresa:
      1. Instalaciones de la empresa  (1 query)
      2. Agregados de consumo  (1 query, GROUP BY instalacion_id)
      3. Conteo de alertas activas  (1 query, GROUP BY instalacion_id)
    """
    try:
        empresa_id = request.GET.get("empresa_id")
        if not empresa_id:
            return JsonResponse(
                {"success": False, "error": "empresa_id es requerido"}, status=400
            )

        empresa = Empresa.objects.filter(idempresa=empresa_id).first()
        if not empresa:
            return JsonResponse(
                {"success": False, "error": "Empresa no encontrada"}, status=404
            )

        cache_key = f"comparativa_empresa:{empresa_id}:user:{request.user.idusuario}"
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse({"success": True, "data": cached, "cached": True})

        desde = timezone.now() - timedelta(days=30)

        # --- Query 1: installations (already ordered) ----
        instalaciones = list(
            get_user_installation_queryset(request.user)
            .filter(Q(cliente_id=empresa_id) | Q(empresa_id=empresa_id))
            .order_by("nombre")
        )
        if not instalaciones and request.user.rol != "admin":
            return JsonResponse(
                {"success": False, "error": "Sin acceso a esta empresa"},
                status=403,
            )
        if not instalaciones:
            cache.set(cache_key, [], CACHE_TTL_MEDIUM)
            return JsonResponse({"success": True, "data": []})

        inst_ids = [i.idinstalacion for i in instalaciones]

        # --- Query 2: consumo aggregates (1 query, GROUP BY instalacion_id) ---
        consumo_stats = (
            Consumo.objects.filter(instalacion_id__in=inst_ids, fecha__gte=desde)
            .values("instalacion_id")
            .annotate(
                solar=Sum(
                    Case(
                        When(fuente="solar", then="energia_consumida"),
                        default=0,
                        output_field=FloatField(),
                    )
                ),
                total=Sum("energia_consumida"),
                costo_total=Sum("costo"),
            )
        )
        consumo_map = {r["instalacion_id"]: r for r in consumo_stats}

        # --- Query 3: active alert counts (1 query, GROUP BY instalacion_id) ---
        alerta_map = {
            r["instalacion_id"]: r["count"]
            for r in (
                Alerta.objects.filter(
                    instalacion_id__in=inst_ids, estado="activa", fecha__gte=desde
                )
                .values("instalacion_id")
                .annotate(count=Count("idalerta"))
            )
        }

        data = []
        for instalacion in instalaciones:
            stats = consumo_map.get(instalacion.idinstalacion, {})
            solar = float(stats.get("solar") or 0)
            total = float(stats.get("total") or 0)
            costo_total = float(stats.get("costo_total") or 0)
            alertas_activas = alerta_map.get(instalacion.idinstalacion, 0)

            data.append(
                {
                    "instalacion_id": instalacion.idinstalacion,
                    "instalacion_nombre": instalacion.nombre,
                    "solar_ratio": round(solar / total, 4) if total else 0,
                    "costo_total": round(costo_total, 2),
                    "alertas_activas": alertas_activas,
                }
            )

        cache.set(cache_key, data, CACHE_TTL_MEDIUM)
        return JsonResponse({"success": True, "data": data})
    except Exception as e:
        logger.exception("Error en comparativa_empresa")
        return JsonResponse({"success": False, "error": str(e)}, status=400)
