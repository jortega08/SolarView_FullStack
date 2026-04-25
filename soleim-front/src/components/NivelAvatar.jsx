import basico from "../assets/basico.svg";
import intermedio from "../assets/intermedio.svg";
import experto from "../assets/experto.svg";
import maestro from "../assets/maestro.svg";
import { useEffect, useState } from "react";

const nivelImgs = { basico, intermedio, experto, maestro };

export default function NivelAvatar({ domicilioId, size = 48 }) {
  const [nivel, setNivel] = useState("basico");

  useEffect(() => {
    if (domicilioId) {
      fetch(`/api/usuarios/nivel/?domicilio_id=${domicilioId}`)
        .then((r) => r.json())
        .then((data) => setNivel(data.nivel || "basico"))
        .catch(() => setNivel("basico"));
    }
  }, [domicilioId]);

  return (
    <img
      src={nivelImgs[nivel] || basico}
      alt={nivel}
      width={size}
      height={size}
      style={{
        borderRadius: "50%",
        border: "2px solid #3b82f6",
        background: "#f3f4f6",
        objectFit: "contain",
        boxShadow: "0 1px 6px rgba(30,50,70,0.10)"
      }}
    />
  );
}
