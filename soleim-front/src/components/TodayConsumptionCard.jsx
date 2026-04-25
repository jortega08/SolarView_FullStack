import { Zap, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import "../styles/TodayConsumption.css";

// Función para obtener el consumo de hoy
const fetchTodayConsumption = async () => {
  const response = await fetch("/api/analitica/actividades/?domicilio_id=1&periodo=week");
  const data = await response.json();
  const today = new Date().toISOString().slice(0, 10);
  const todayData = data.data.find(item => item.fecha && item.fecha.startsWith(today));
  return todayData || { solar: 0, electrica: 0, fecha: today };
}

export default function TodayConsumptionCard() {
  const [consumo, setConsumo] = useState({ solar: 0, electrica: 0, fecha: "" });

  useEffect(() => {
    fetchTodayConsumption().then(setConsumo);
    // Refresca cada 60s
    const timer = setInterval(() => fetchTodayConsumption().then(setConsumo), 60000);
    return () => clearInterval(timer);
  }, []);

  const total = consumo.solar + consumo.electrica;
  const solarPercent = total ? ((consumo.solar / total) * 100).toFixed(1) : 0;
  const electricaPercent = total ? ((consumo.electrica / total) * 100).toFixed(1) : 0;

  return (
    <div className="tc-card">
      <h3 className="tc-title">Consumo hoy ({consumo.fecha.slice(0, 10)})</h3>
      <div className="tc-content">
        <div className="tc-legend electrica">
          <Zap size={28} />
          <div className="tc-value">{consumo.electrica.toFixed(2)} kWh</div>
          <div className="tc-percent">{electricaPercent}% eléctrica</div>
        </div>
        <div className="tc-legend solar">
          <Sun size={28} />
          <div className="tc-value">{consumo.solar.toFixed(2)} kWh</div>
          <div className="tc-percent">{solarPercent}% solar</div>
        </div>
      </div>
      <div className="tc-state">
        {solarPercent > electricaPercent
          ? "¡Día eficiente solar!"
          : "Predomina eléctrica"}
      </div>
    </div>
  );
}
