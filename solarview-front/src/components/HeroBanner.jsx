import logoName from "../assets/logoname.svg";
import "../styles/HeroBanner.css"

const Welcome = ({ userName }) => {
  return (
    <div className="hero-banner">
      <div className="hero-content">
        <p className="hero-greeting">Hola! {userName}</p>
        <h2 className="hero-title">Gestiona tu consumo energético, completa logros. SolarView es una herramienta para que tomes control de lo que estás consumiendo y así tener un consumo inteligente y eficiente.</h2>
      </div>
      <div className="hero-illustration">
        <img
          src={logoName}
          alt="Logo SolarView"
        />
      </div>
    </div>
  )
}

export default Welcome;
