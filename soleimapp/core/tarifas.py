"""
Resolución de tarifa kWh y cálculos derivados (consumo, ahorro, total).

La tarifa varía por ubicación: se busca primero un override por instalación,
luego una tarifa de la ciudad, y por último un fallback global.

Uso típico desde una vista o tarea:

    tarifa = resolver_tarifa(instalacion)
    valores = calcular_valores_energia(generacion_solar_kwh, consumo_red_kwh, tarifa)
    # valores -> {valor_consumo, valor_ahorro, valor_total, tarifa_kwh, moneda}
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from django.db.models import Q
from django.utils import timezone

from core.models import Tarifa


# Fallback final cuando no hay ninguna Tarifa configurada (COP/kWh).
# Mantener cerca del valor histórico hardcodeado (800) para no romper dashboards
# existentes mientras se cargan tarifas reales.
DEFAULT_TARIFA_KWH = Decimal("800.00")
DEFAULT_MONEDA = "COP"


@dataclass(frozen=True)
class TarifaResuelta:
    valor_kwh: Decimal
    moneda: str
    fuente: str  # "instalacion" | "ciudad" | "default"
    tarifa_id: Optional[int]


def resolver_tarifa(instalacion, ahora=None) -> TarifaResuelta:
    """
    Devuelve la tarifa vigente aplicable a `instalacion`.

    Cascada:
      1. Tarifa con `instalacion=instalacion` y vigencia activa.
      2. Tarifa con `ciudad=instalacion.ciudad` y vigencia activa.
      3. DEFAULT_TARIFA_KWH.
    """
    ahora = ahora or timezone.now()
    vigencia = Q(vigente_desde__lte=ahora) & (
        Q(vigente_hasta__isnull=True) | Q(vigente_hasta__gt=ahora)
    )

    if instalacion is not None and getattr(instalacion, "idinstalacion", None):
        tarifa_inst = (
            Tarifa.objects.filter(vigencia, instalacion_id=instalacion.idinstalacion)
            .order_by("-vigente_desde")
            .first()
        )
        if tarifa_inst:
            return TarifaResuelta(
                valor_kwh=Decimal(tarifa_inst.valor_kwh),
                moneda=tarifa_inst.moneda,
                fuente="instalacion",
                tarifa_id=tarifa_inst.idtarifa,
            )

    ciudad_id = getattr(instalacion, "ciudad_id", None) if instalacion else None
    if ciudad_id:
        tarifa_ciudad = (
            Tarifa.objects.filter(
                vigencia, ciudad_id=ciudad_id, instalacion__isnull=True
            )
            .order_by("-vigente_desde")
            .first()
        )
        if tarifa_ciudad:
            return TarifaResuelta(
                valor_kwh=Decimal(tarifa_ciudad.valor_kwh),
                moneda=tarifa_ciudad.moneda,
                fuente="ciudad",
                tarifa_id=tarifa_ciudad.idtarifa,
            )

    return TarifaResuelta(
        valor_kwh=DEFAULT_TARIFA_KWH,
        moneda=DEFAULT_MONEDA,
        fuente="default",
        tarifa_id=None,
    )


def calcular_valores_energia(
    generacion_solar_kwh: float,
    consumo_red_kwh: float,
    tarifa: TarifaResuelta,
) -> dict:
    """
    Devuelve los tres valores monetarios pedidos por negocio:

      - valor_consumo  : lo que paga el usuario por la energía tomada de la red.
      - valor_ahorro   : lo que NO paga gracias a la energía solar.
      - valor_total    : el costo total que tendría sin paneles
                         (consumo_red + generación_solar) * tarifa.

    El tipo retornado es Decimal redondeado a 2 decimales para que
    los importes monetarios sean exactos.
    """
    tarifa_kwh = Decimal(tarifa.valor_kwh)
    consumo = Decimal(str(consumo_red_kwh or 0))
    solar = Decimal(str(generacion_solar_kwh or 0))

    valor_consumo = (consumo * tarifa_kwh).quantize(Decimal("0.01"))
    valor_ahorro = (solar * tarifa_kwh).quantize(Decimal("0.01"))
    valor_total = (valor_consumo + valor_ahorro).quantize(Decimal("0.01"))

    return {
        "valor_consumo": float(valor_consumo),
        "valor_ahorro": float(valor_ahorro),
        "valor_total": float(valor_total),
        "tarifa_kwh": float(tarifa_kwh),
        "moneda": tarifa.moneda,
        "tarifa_fuente": tarifa.fuente,
    }
