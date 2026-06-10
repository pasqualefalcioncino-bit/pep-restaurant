import './HomeFinalCta.css';

const HomeFinalCta = ({ onNavigate }) => {
  return (
    <section className="home-final-cta">
      <div className="home-cta-box">
        <span className="home-section-label">PRENOTAZIONE</span>
        <h2>Riserva il tuo tavolo stasera</h2>
        <p>Disponibilità limitata. Conferma immediata. Cancellazione gratuita fino a 4 ore prima.</p>
        <button className="home-dark-btn" type="button" onClick={() => onNavigate('prenota')}>
          Prenota Ora <span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  );
};

export default HomeFinalCta;
