import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchFacturaMensual } from "../services/api";
import "../styles/FacturaMensual.css";

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function FacturaMensual({ domicilioId = 1 }) {
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [ano, setAno] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // 👈 Estado de error

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFacturaMensual({ domicilioId, mes, ano })
      .then(res => {
        console.log("RESPUESTA FACTURA:", res); // Debug seguro
        setData(res);
      })
      .catch(err => {
        setError(
          err.message ||
          "No se pudo cargar la factura. Intenta de nuevo."
        );
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [domicilioId, mes, ano]);

  const descargaPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text("Soleim - Factura de Consumo Mensual", 18, 21);
    autoTable(doc, {
      startY: 32,
      head: [['Item', 'Valor']],
      body: [
        ["Mes", `${meses[mes - 1]} ${ano}`],
        ["Usuario", data.usuario || "-"],
        ["Domicilio", data.domicilio || "-"],
        ["Ciudad", data.ciudad || "-"],
        ["Fecha de emisión", data.fecha_emision || "-"],
        ["Consumo eléctrica", `${(data.electrica ?? 0).toFixed(2)} kWh`],
        ["Consumo solar", `${(data.solar ?? 0).toFixed(2)} kWh`],
        ["Total", `$${(data.costo ?? 0).toLocaleString()} COP`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59,130,246], textColor: 255 }
    });
    doc.save(`Factura_${meses[mes - 1]}_${ano}_Soleim.pdf`);
  };

  return (
    <section className="factura-section">
      <div className="factura-card">
        <div className="factura-header">
          <div>
            <h2>
              Factura mensual -
              <select value={mes} onChange={e => setMes(Number(e.target.value))}>
                {meses.map((name, idx) => (
                  <option value={idx + 1} key={idx}>{name}</option>
                ))}
              </select>
              <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ marginLeft: 7 }}>
                {[today.getFullYear() - 1, today.getFullYear()].map(y =>
                  <option value={y} key={y}>{y}</option>
                )}
              </select>
            </h2>
            <small>Fecha emisión: {data?.fecha_emision || "-"}</small>
          </div>
          <button
            className="btn-descargar"
            onClick={descargaPDF}
            disabled={loading || !data}
          >
            Descargar PDF
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "22px", color: "#64748b" }}>Cargando factura...</div>
        ) : error ? (
          <div style={{ padding: "22px", color: "#b91c1c" }}>{error}</div>
        ) : (
          <>
            <div className="factura-info">
              <div><b>Usuario:</b> {data.usuario || "-"}</div>
              <div><b>Domicilio:</b> {data.domicilio || "-"}</div>
              <div><b>Ciudad:</b> {data.ciudad || "-"}</div>
            </div>
            <table className="factura-table">
              <tbody>
                <tr>
                  <td>Consumo eléctrica</td>
                  <td><b>{(data.electrica ?? 0).toFixed(2)} kWh</b></td>
                </tr>
                <tr>
                  <td>Consumo solar</td>
                  <td><b>{(data.solar ?? 0).toFixed(2)} kWh</b></td>
                </tr>
                <tr>
                  <td>Total</td>
                  <td><b>${(data.costo ?? 0).toLocaleString()} COP</b></td>
                </tr>
              </tbody>
            </table>
            <div className="factura-total">
              <span><b>Total mes:</b></span>
              <span className="factura-total-num">
                ${(data.costo ?? 0).toLocaleString()} COP
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
