import "../styles/HeroBanner.css"

const Welcome = ({ userName }) => {
  return (
    <div className="hero-banner">
      <div className="hero-content">
        <p className="hero-greeting">Hola! {userName}</p>
        <h2 className="hero-title">Revisa tus tareas y horarios diarios</h2>
      </div>
      <div className="hero-illustration">
        <img
          src=""
          alt="Logo SolarView"
        />
      </div>
    </div>
  )
}

export default Welcome;
