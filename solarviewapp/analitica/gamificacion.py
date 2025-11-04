# analitica/gamificacion.py
from datetime import timedelta
from django.db.models import Sum, Avg
from django.utils import timezone

from telemetria.models import Consumo
from core.models import Domicilio
from .models import Puntaje


def _consumo_solar_y_electrica_por_dia(domicilio, fecha):
  qs = Consumo.objects.filter(domicilio=domicilio, fecha__date=fecha)
  solar = qs.filter(fuente="solar").aggregate(total=Sum("energia_consumida"))["total"] or 0
  electrica = qs.filter(fuente="electrica").aggregate(total=Sum("energia_consumida"))["total"] or 0
  return float(solar), float(electrica)


def _consumo_solar_y_electrica_rango(domicilio, inicio, fin):
  qs = Consumo.objects.filter(
      domicilio=domicilio,
      fecha__date__gte=inicio,
      fecha__date__lte=fin,
  )
  solar = qs.filter(fuente="solar").aggregate(total=Sum("energia_consumida"))["total"] or 0
  electrica = qs.filter(fuente="electrica").aggregate(total=Sum("energia_consumida"))["total"] or 0
  total = qs.aggregate(total=Sum("energia_consumida"))["total"] or 0
  return float(solar), float(electrica), float(total)


def construir_logros_para_domicilio(domicilio: Domicilio):
  hoy = timezone.now().date()

  # --- Métricas base que vamos a reutilizar ---

  # Día actual
  solar_hoy, electrica_hoy = _consumo_solar_y_electrica_por_dia(domicilio, hoy)
  total_hoy = solar_hoy + electrica_hoy

  # Últimos 3 días (para uso_solar_constante)
  dias_3 = [hoy - timedelta(days=i) for i in range(3)]
  dias_con_mas_solar = 0
  for dia in dias_3:
    s, e = _consumo_solar_y_electrica_por_dia(domicilio, dia)
    if s > e:
      dias_con_mas_solar += 1

  # Semanas para reducción consumo
  semana_actual_inicio = hoy - timedelta(days=6)
  semana_pasada_inicio = hoy - timedelta(days=13)
  semana_pasada_fin = hoy - timedelta(days=7)

  _, electrica_semana_actual, _tmp = _consumo_solar_y_electrica_rango(
      domicilio, semana_actual_inicio, hoy
  )  # usamos electrica_semana_actual
  # _tmp es total, pero aquí nos interesa electrica
  electrica_semana_pasada = Consumo.objects.filter(
      domicilio=domicilio,
      fuente="electrica",
      fecha__date__gte=semana_pasada_inicio,
      fecha__date__lte=semana_pasada_fin,
  ).aggregate(total=Sum("energia_consumida"))["total"] or 0
  electrica_semana_pasada = float(electrica_semana_pasada)

  # Promedio histórico para penalización de consumo diario
  consumo_promedio = (
      Consumo.objects.filter(domicilio=domicilio).aggregate(
          avg=Avg("energia_consumida")
      )["avg"]
      or 0
  )
  consumo_promedio = float(consumo_promedio)

  # Últimos 30 días para logro_mes_solar
  inicio_mes = hoy - timedelta(days=30)
  solar_30, electrica_30, total_30 = _consumo_solar_y_electrica_rango(domicilio, inicio_mes, hoy)
  ratio_solar_30 = (solar_30 / total_30) if total_30 > 0 else 0

  # Solar histórico para 1 MWh
  consumo_solar_total = (
      Consumo.objects.filter(domicilio=domicilio, fuente="solar").aggregate(
          total=Sum("energia_consumida")
      )["total"]
      or 0
  )
  consumo_solar_total = float(consumo_solar_total)

  # Puntaje actual y nivel
  puntaje_obj, _ = Puntaje.objects.get_or_create(domicilio=domicilio)
  puntos_actuales = puntaje_obj.puntos
  nivel_actual = puntaje_obj.nivel

  logros = []

  # 1) Uso solar constante 3 días seguidos
  progreso_uso_constante = dias_con_mas_solar / 3.0
  status_uso_constante = "completed" if dias_con_mas_solar == 3 else ("in_progress" if dias_con_mas_solar > 0 else "locked")
  logros.append(
      {
          "id": "uso_solar_constante",
          "titulo": "Uso solar constante",
          "categoria": "Eficiencia solar",
          "descripcion": "Mantén 3 días seguidos usando más energía solar que eléctrica.",
          "puntos": 150,
          "status": status_uso_constante,
          "progreso": round(progreso_uso_constante, 2),
          "progresoTexto": f"{dias_con_mas_solar} de 3 días con más solar que eléctrica",
      }
  )

  # 2) Autonomía solar diaria (100% solar, sin red)
  # criterio igual a tu trigger: consumo_electrica == 0 y solar > 0
  autonomia_completada = (solar_hoy > 0 and electrica_hoy == 0)
  progreso_autonomia = (solar_hoy / total_hoy) if total_hoy > 0 else 0
  status_autonomia = "completed" if autonomia_completada else ("in_progress" if total_hoy > 0 else "locked")
  logros.append(
      {
          "id": "autonomia_solar_dia",
          "titulo": "Autonomía solar diaria",
          "categoria": "Autonomía",
          "descripcion": "Logra que el 100% de tu consumo diario sea desde energía solar.",
          "puntos": 200,
          "status": status_autonomia,
          "progreso": round(progreso_autonomia, 2),
          "progresoTexto": f"{round(progreso_autonomia * 100)}% de consumo solar hoy",
      }
  )

  # 3) Reducción de consumo eléctrico semanal
  if electrica_semana_pasada > 0:
    mejora = electrica_semana_pasada - electrica_semana_actual
    progreso_reduccion = max(0.0, min(1.0, mejora / electrica_semana_pasada))
  else:
    progreso_reduccion = 0.0
  reduccion_cumplida = electrica_semana_actual < electrica_semana_pasada and electrica_semana_pasada > 0
  status_reduccion = "completed" if reduccion_cumplida else ("in_progress" if electrica_semana_pasada > 0 else "locked")
  logros.append(
      {
          "id": "reduccion_consumo_semanal",
          "titulo": "Reducción del consumo eléctrico semanal",
          "categoria": "Eficiencia eléctrica",
          "descripcion": "Reduce tu consumo eléctrico comparado con la semana anterior.",
          "puntos": 120,
          "status": status_reduccion,
          "progreso": round(progreso_reduccion, 2),
          "progresoTexto": f"Consumo actual: {electrica_semana_actual:.2f} kWh · Semana pasada: {electrica_semana_pasada:.2f} kWh",
      }
  )

  # 4) Mes solar (>= 60% solar últimos 30 días)
  objetivo_ratio = 0.6
  progreso_mes_solar = min(1.0, ratio_solar_30 / objetivo_ratio) if objetivo_ratio > 0 else 0
  mes_solar_completado = ratio_solar_30 >= objetivo_ratio and total_30 > 0
  status_mes_solar = "completed" if mes_solar_completado else ("in_progress" if total_30 > 0 else "locked")
  logros.append(
      {
          "id": "logro_mes_solar",
          "titulo": "Mes solar",
          "categoria": "Logro mensual",
          "descripcion": "Al menos el 60% de tu consumo de los últimos 30 días proviene de energía solar.",
          "puntos": 500,
          "status": status_mes_solar,
          "progreso": round(progreso_mes_solar, 2),
          "progresoTexto": f"{round(ratio_solar_30 * 100)}% solar en los últimos 30 días",
      }
  )

  # 5) 1 MWh solar acumulado
  objetivo_mwh = 1000.0  # kWh
  progreso_mwh = min(1.0, consumo_solar_total / objetivo_mwh) if objetivo_mwh > 0 else 0
  mwh_completado = consumo_solar_total >= objetivo_mwh
  status_mwh = "completed" if mwh_completado else ("in_progress" if consumo_solar_total > 0 else "locked")
  logros.append(
      {
          "id": "logro_1MWh_generado",
          "titulo": "1 MWh solar generado",
          "categoria": "Logro histórico",
          "descripcion": "Alcanza 1 MWh de energía solar generada/acumulada en total.",
          "puntos": 1000,
          "status": status_mwh,
          "progreso": round(progreso_mwh, 2),
          "progresoTexto": f"{consumo_solar_total:.2f} kWh solares acumulados",
      }
  )

  # 6) Penalización por consumo diario excesivo (lo mostramos como “riesgo”)
  riesgo_consumo_diario = False
  if consumo_promedio > 0 and total_hoy > 3 * consumo_promedio:
    riesgo_consumo_diario = True

  logros.append(
      {
          "id": "penalizacion_consumo_diario",
          "titulo": "Consumo diario excesivo",
          "categoria": "Penalización",
          "descripcion": "Evita que tu consumo diario supere 3 veces tu promedio histórico.",
          "puntos": -50,
          "status": "completed" if riesgo_consumo_diario else "in_progress",
          "progreso": 1.0 if riesgo_consumo_diario else 0.0,
          "progresoTexto": (
              "Hoy superaste 3× tu consumo promedio."
              if riesgo_consumo_diario
              else "Mantén tu consumo diario por debajo de 3× tu promedio."
          ),
      }
  )

  # 7) Info de nivel actual (no es logro puntual, pero sirve como “meta global”)
  logros.append(
      {
          "id": "nivel_usuario",
          "titulo": "Nivel de usuario",
          "categoria": "Progreso global",
          "descripcion": "Suma puntos completando logros y mejora tu nivel de usuario.",
          "puntos": 0,
          "status": "in_progress",
          "progreso": 1.0,  # solo informativo
          "progresoTexto": f"Tienes {puntos_actuales} puntos · Nivel actual: {nivel_actual}",
      }
  )

  return logros
