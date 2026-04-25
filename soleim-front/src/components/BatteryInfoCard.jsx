import "../styles/BatteryInfoCard.css";
import { BatteryFull, Zap, Gauge, Timer } from "lucide-react";

export default function BatteryInfoCard({ data }) {
  if (!data) return null; // No hay datos

  return (
    <div className="battery-card">
      <div className="battery-title">
        <BatteryFull size={20} />
        <span>Estado actual de la batería</span>
      </div>

      <div className="battery-grid">
        <div className="battery-item">
          <Gauge size={17} className="icon" />
          <span>Voltaje:</span>
          <b>{data.voltaje} V</b>
        </div>
        <div className="battery-item">
          <Zap size={17} className="icon" />
          <span>Corriente:</span>
          <b>{data.corriente} A</b>
        </div>
        <div className="battery-item">
          <span className="icon" role="img" aria-label="Temp"></span>
          <span>Temperatura:</span>
          <b>{data.temperatura} °C</b>
        </div>
        <div className="battery-item">
          <span className="icon" role="img" aria-label="Capacity"></span>
          <span>Capacidad:</span>
          <b>{data.capacidad} kWh</b>
        </div>
        <div className="battery-item">
          <span className="icon" role="img" aria-label="Charge"></span>
          <span>Porcentaje carga:</span>
          <b>{data.porcentaje_carga}%</b>
        </div>
        <div className="battery-item">
          <Timer size={17} className="icon" />
          <span>Tiempo restante:</span>
          <b>{data.tiempo_restante} h</b>
        </div>
      </div>

      <div className="battery-date">
        Última actualización: {data.fecha && data.fecha.slice(0, 19).replace('T', ' ')}
      </div>
    </div>
  );
}
