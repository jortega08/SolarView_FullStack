import json
import math
import os
import random
import time
from datetime import datetime

import paho.mqtt.client as mqtt

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_USER = os.getenv("MQTT_USER", "")
MQTT_PASS = os.getenv("MQTT_PASS", "")
DOMICILIO_ID = int(os.getenv("DOMICILIO_ID", 0)) or None
INSTALACION_ID = int(os.getenv("INSTALACION_ID", 0)) or None
INSTALACION_IDS = os.getenv("INSTALACION_IDS", "")
PUBLISH_INTERVAL_SECONDS = float(os.getenv("PUBLISH_INTERVAL_SECONDS", 10))
SAMPLE_MINUTES = float(os.getenv("SAMPLE_MINUTES", 15))
ALERT_PROBABILITY = float(os.getenv("ALERT_PROBABILITY", 0.01))

# Perfiles demo para las instalaciones creadas por seed_demo_data.
# Si aparece una instalacion nueva sin perfil, se genera uno deterministico.
INSTALLATION_PROFILES = {
    1: {"panel_kw": 5.0, "battery_kwh": 10.0, "base_load_kw": 2.0},
    2: {"panel_kw": 22.5, "battery_kwh": 0.0, "base_load_kw": 8.5},
    3: {"panel_kw": 145.0, "battery_kwh": 320.0, "base_load_kw": 42.0},
    4: {"panel_kw": 86.0, "battery_kwh": 60.0, "base_load_kw": 31.0},
    5: {"panel_kw": 98.0, "battery_kwh": 240.0, "base_load_kw": 38.0},
    6: {"panel_kw": 42.0, "battery_kwh": 180.0, "base_load_kw": 16.0},
    7: {"panel_kw": 64.5, "battery_kwh": 48.0, "base_load_kw": 20.0},
    8: {"panel_kw": 78.0, "battery_kwh": 120.0, "base_load_kw": 25.0},
    9: {"panel_kw": 118.0, "battery_kwh": 360.0, "base_load_kw": 48.0},
    10: {"panel_kw": 56.0, "battery_kwh": 210.0, "base_load_kw": 18.0},
}

_battery_soc_by_installation = {}


def _parse_int_list(raw):
    ids = []
    for token in raw.replace(";", ",").split(","):
        token = token.strip()
        if not token:
            continue
        if "-" in token:
            start, end = token.split("-", 1)
            ids.extend(range(int(start), int(end) + 1))
        else:
            ids.append(int(token))
    return sorted(set(ids))


def get_installation_ids():
    if INSTALACION_IDS:
        return _parse_int_list(INSTALACION_IDS)
    if INSTALACION_ID:
        return [INSTALACION_ID]
    return []


def _profile_for_installation(instalacion_id):
    if instalacion_id in INSTALLATION_PROFILES:
        return INSTALLATION_PROFILES[instalacion_id]

    rng = random.Random(instalacion_id)
    return {
        "panel_kw": round(rng.uniform(18, 95), 1),
        "battery_kwh": round(rng.uniform(40, 240), 1),
        "base_load_kw": round(rng.uniform(8, 35), 1),
    }


def _sun_factor(ts):
    hour = ts.hour + ts.minute / 60
    # Simula curva solar entre 6:00 y 18:00.
    return max(0.0, math.sin(((hour - 6) / 12) * math.pi))


def _battery_soc(instalacion_id, solar_kw, load_kw, battery_kwh):
    if battery_kwh <= 0:
        return 100.0

    current = _battery_soc_by_installation.setdefault(
        instalacion_id, random.uniform(58, 88)
    )
    drift = (solar_kw - load_kw) / max(battery_kwh, 1) * 8
    current += drift + random.uniform(-1.1, 1.1)

    # Muy ocasionalmente fuerza escenarios de alerta para probar el flujo,
    # pero evita inundar el sistema con ordenes cada ciclo.
    forced_alert = random.random() < ALERT_PROBABILITY
    if forced_alert:
        current = random.choice([random.uniform(8, 18), random.uniform(88, 96)])

    current = min(98.0, max(8.0 if forced_alert else 24.0, current))
    _battery_soc_by_installation[instalacion_id] = current
    return current


def build_sensor_payload(instalacion_id):
    now = datetime.now()
    profile = _profile_for_installation(instalacion_id)
    panel_kw = profile["panel_kw"]
    battery_kwh = profile["battery_kwh"]
    base_load_kw = profile["base_load_kw"]

    sun = _sun_factor(now)
    cloud_factor = random.uniform(0.62, 1.0)
    solar_kw = round(panel_kw * sun * cloud_factor, 3)
    load_kw = round(max(0.2, random.gauss(base_load_kw, base_load_kw * 0.12)), 3)
    grid_kw = round(max(load_kw - solar_kw, 0), 3)
    exported_kw = round(max(solar_kw - load_kw, 0), 3)

    sample_hours = max(SAMPLE_MINUTES, 1) / 60
    solar_kwh = round(solar_kw * sample_hours, 3)
    grid_kwh = round(grid_kw * sample_hours, 3)
    load_kwh = round(load_kw * sample_hours, 3)
    fuente = "solar" if solar_kw >= load_kw * 0.55 else "electrica"
    energia_consumida = solar_kwh if fuente == "solar" else max(grid_kwh, load_kwh)
    costo = round((grid_kwh * 850) if fuente == "electrica" else (solar_kwh * 80), 2)

    soc = _battery_soc(instalacion_id, solar_kw, load_kw, battery_kwh)
    ambient_temp = 23 + (sun * 9) + random.uniform(-2, 2)
    temperature = ambient_temp + random.uniform(2, 7)
    if random.random() < ALERT_PROBABILITY:
        temperature = random.uniform(40.5, 43.5)

    voltage = 48 + (soc / 100 * 6) + random.uniform(-0.8, 0.8)
    current = load_kw / max(voltage / 1000, 1)
    available_kwh = battery_kwh * (soc / 100)
    remaining_hours = available_kwh / max(load_kw - solar_kw, load_kw * 0.35, 0.1)
    irradiance = round(sun * cloud_factor * 1000, 2)

    return {
        "instalacion_id": instalacion_id,
        "energia_consumida": round(max(energia_consumida, 0.001), 3),
        "potencia": round(load_kw, 3),
        "fuente": fuente,
        "costo": costo,
        "voltaje": round(voltage, 2),
        "corriente": round(current, 2),
        "temperatura": round(temperature, 2),
        "capacidad_bateria": round(battery_kwh, 2),
        "porcentaje_carga": round(soc, 2),
        "tiempo_restante": round(max(remaining_hours, 0), 2),
        # Campos extra para tiempo real y diagnostico; el backend deriva los
        # historicos desde Consumo/Bateria aunque estos no se persistan aun.
        "energia_generada": solar_kwh,
        "irradiancia": irradiance,
        "exportacion": round(exported_kw * sample_hours, 3),
        "importacion": grid_kwh,
        "temperatura_ambiente": round(ambient_temp, 2),
        "humedad": round(random.uniform(42, 76), 2),
        "viento": round(random.uniform(1.5, 12), 2),
        "timestamp": now.isoformat(),
    }


def on_connect(client, userdata, flags, rc):
    print(f"[Publisher] Conectado al broker MQTT: {rc}")


def on_disconnect(client, userdata, rc):
    print(f"[Publisher] Desconectado del broker MQTT: {rc}")


def publish_sensor_data(client):
    installation_ids = get_installation_ids()
    if not installation_ids and DOMICILIO_ID is None:
        print(
            "[Publisher] ERROR: se requiere INSTALACION_IDS, INSTALACION_ID "
            "o DOMICILIO_ID en env. Abortando."
        )
        return

    if installation_ids:
        print(
            "[Publisher] Publicando telemetria para instalaciones: "
            f"{installation_ids}"
        )
    else:
        print(
            "[Publisher] Publicando telemetria legacy para domicilio: "
            f"{DOMICILIO_ID}"
        )

    while True:
        targets = installation_ids or [DOMICILIO_ID]
        for context_key in targets:
            if installation_ids:
                data = build_sensor_payload(context_key)
            else:
                data = build_sensor_payload(0)
                data.pop("instalacion_id", None)
                data["domicilio_id"] = DOMICILIO_ID

            topic = f"soleim/battery/{context_key}"
            client.publish(topic, json.dumps(data), qos=1)
            print(f"[Publisher] Publicado en {topic}: {data}")

        time.sleep(PUBLISH_INTERVAL_SECONDS)


def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASS)

    print(f"[Publisher] MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_start()

    try:
        publish_sensor_data(client)
    except KeyboardInterrupt:
        print("[Publisher] Stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
