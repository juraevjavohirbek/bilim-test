import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-container container">
        <div className="hero-content">
          <p className="subtitle">Bilim Test Platformasi</p>
          <h1>Bilimingizni <span>sinab</span> ko‘ring</h1>
          <p className="info">
            Ona tili, matematika va boshqa fanlardan testlar yechib,
            bilimingizni mustahkamlang.
          </p>
          <Link to="/subjects" className="hero-button">
            Fanlarni ko‘rish <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
    
  );
}

export default HeroSection;
