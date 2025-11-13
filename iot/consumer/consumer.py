import paho.mqtt.client as mqtt
import json
import requests
import os

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
DJANGO_API = os.getenv("DJANGO_API", "http://localhost:8000")

def on_connect(client, userdata, flags, rc):
    print(f"[Consumer] Conectado MQTT: {rc}")
    client.subscribe("solarview/battery/#", qos=1)

def on_disconnect(client, userdata, rc):
    print(f"[Consumer] Desconectado MQTT: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"[Consumer] Recibido: {payload}")

        # Reenvía al API Django
        response = requests.post(
            f"{DJANGO_API}/api/telemetria/registrar_datos/",
            json=payload,
            timeout=5
        )
        print(f"[Consumer] Django Status: {response.status_code} | Resp: {response.text}")

    except Exception as e:
        print(f"[Consumer] Error: {e}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    print(f"[Consumer] MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_forever()

if __name__ == "__main__":
    main()