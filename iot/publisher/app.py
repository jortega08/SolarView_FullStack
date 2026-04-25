import paho.mqtt.client as mqtt
import json
import time
import os
import random
from datetime import datetime

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_USER = os.getenv("MQTT_USER", "")
MQTT_PASS = os.getenv("MQTT_PASS", "")
DOMICILIO_ID = int(os.getenv("DOMICILIO_ID", 0)) or None
INSTALACION_ID = int(os.getenv("INSTALACION_ID", 0)) or None

def on_connect(client, userdata, flags, rc):
    print(f"[Publisher] Conectado al broker MQTT: {rc}")

def on_disconnect(client, userdata, rc):
    print(f"[Publisher] Desconectado del broker MQTT: {rc}")

def publish_sensor_data(client):
    if INSTALACION_ID is None and DOMICILIO_ID is None:
        print("[Publisher] ERROR: se requiere INSTALACION_ID o DOMICILIO_ID en env. Abortando.")
        return

    context_key = INSTALACION_ID if INSTALACION_ID else DOMICILIO_ID
    topic = f"soleim/battery/{context_key}"

    while True:
        data = {
            "energia_consumida": round(random.uniform(0.5, 2.5), 2),
            "potencia": round(random.uniform(0.1, 1.0), 2),
            "fuente": random.choice(["solar", "electrica"]),
            "costo": round(random.uniform(200, 600), 2),
            "voltaje": round(random.uniform(3.6, 4.2), 2),
            "corriente": round(random.uniform(0.5, 2.0), 2),
            "temperatura": round(random.uniform(25, 45), 2),
            "capacidad_bateria": 2.2,
            "porcentaje_carga": round(random.uniform(1, 100), 2),
            "tiempo_restante": round(random.uniform(2, 10), 2),
            "energia_generada": round(random.uniform(0.3, 1.5), 2),
            "timestamp": datetime.now().isoformat()
        }
        if INSTALACION_ID:
            data["instalacion_id"] = INSTALACION_ID
        else:
            data["domicilio_id"] = DOMICILIO_ID

        client.publish(topic, json.dumps(data), qos=1)
        print(f"[Publisher] Publicado en {topic}: {data}")

        time.sleep(10)

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
