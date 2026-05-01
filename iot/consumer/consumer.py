import paho.mqtt.client as mqtt
import json
import requests
import os

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_USER = os.getenv("MQTT_USER", "")
MQTT_PASS = os.getenv("MQTT_PASS", "")
DJANGO_API = os.getenv("DJANGO_API", "http://localhost:8000")
# Clave compartida con el backend Django para autenticar la ingesta IoT
IOT_SHARED_SECRET = os.getenv("IOT_SHARED_SECRET", "")
DJANGO_REQUEST_TIMEOUT_SECONDS = float(os.getenv("DJANGO_REQUEST_TIMEOUT_SECONDS", "10"))
HTTP = requests.Session()

def on_connect(client, userdata, flags, rc):
    print(f"[Consumer] Conectado MQTT: {rc}")
    client.subscribe("soleim/battery/#", qos=1)

def on_disconnect(client, userdata, rc):
    print(f"[Consumer] Desconectado MQTT: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"[Consumer] Recibido: {payload}")

        # Reenvía al API Django con clave IoT compartida
        headers = {}
        if IOT_SHARED_SECRET:
            headers["X-IoT-Key"] = IOT_SHARED_SECRET
        response = HTTP.post(
            f"{DJANGO_API}/api/telemetria/registrar_datos/",
            json=payload,
            headers=headers,
            timeout=DJANGO_REQUEST_TIMEOUT_SECONDS,
        )
        print(f"[Consumer] Django Status: {response.status_code} | Resp: {response.text}")

    except Exception as e:
        print(f"[Consumer] Error: {e}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASS)

    print(f"[Consumer] MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_forever()

if __name__ == "__main__":
    main()
