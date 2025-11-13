import { useEffect, useState } from "react";
import "../styles/BatteryThermometer.css";

// Simula el fetch al endpoint battery
const fetchBatteryStatus = async () => {
  const response = await fetch("/api/analitica/bateria/?domicilio_id=1");
  const data = await response.json();
  return data.data ? data.data.temperatura : null;
};

export default function BatteryThermometer({ min = 0, max = 60 }) {
  const [temp, setTemp] = useState(25);

  useEffect(() => {
    fetchBatteryStatus().then(t => {console.log("Temperatura recibida:", t); // Verás en consola el valor que llega
    t && setTemp(t); });
    const timer = setInterval(() => fetchBatteryStatus().then(t => t && setTemp(t)), 10000);
    return () => clearInterval(timer);
  }, []);

  // Definición de percent aquí (que faltaba)
  const percent = Math.min(Math.max((temp - min) / (max - min), 0), 1);
  const color = temp > 40 ? "#ef4444" : temp > 35 ? "#f59e0b" : "#22d3ee";

  return (
    <div className="thermo-card">
      <div className="thermo-label">Temp batería</div>
      <div className="thermo-bar-outer">
        <div className="thermo-bar-inner" style={{
          height: `${percent * 100}%`,
          background: color
        }} />
      </div>
      <div className="thermo-temp" style={{ color }}>{temp.toFixed(1)}°C</div>
      {temp > 40 && <div className="thermo-alert">¡Alerta temperatura!</div>}
    </div>
  );
}
