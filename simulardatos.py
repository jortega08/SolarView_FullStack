import requests, random, json, time

URL = "http://127.0.0.1:8000/api/telemetria/registrar_datos/"
DOMICILIO_ID = 1

while True:
    data = {

        "domicilio_id": DOMICILIO_ID,
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
        "energia_generada": round(random.uniform(0.3, 1.5), 2)
    }

    try:
        response = requests.post(URL, json=data)
        print(f"✓ Data sent successfully: {response.json()}")
    except Exception as e:
        print(f"✗ Error sending data: {e}")
    
    time.sleep(30)