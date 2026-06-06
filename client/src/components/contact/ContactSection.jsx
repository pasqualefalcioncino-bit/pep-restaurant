import './ContactSection.css';

const ContactSection = () => {

  return (
    <section className="contact-container">
      <div className="contact-info">
        <span className="label-scrivici">SCRIVICI</span>
        <h1 className="title-contatti">Contatti</h1>
        
        <div className="info-details">
          <div className="info-item">
            <span className="info-icon">📍</span>
            <div>
              <strong>Via dei Sapori 12</strong>
              <p>20121 Milano, Italia</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📞</span>
            <p>+39 02 1234 5678</p>
          </div>
          <div className="info-item">
            <span className="info-icon">✉️</span>
            <p>info@trattoriastorica.it</p>
          </div>
          <div className="info-item">
            <span className="info-icon">🕒</span>
            <div>
              <p>Mar–Sab 12:30–14:30 · 19:30–23:00</p>
              <p>Domenica solo cena</p>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-map-card">
        <iframe
          title="Mappa di Pep Restaurant a Milano"
          className="contact-map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=9.1790%2C45.4580%2C9.2010%2C45.4700&layer=mapnik&marker=45.4642%2C9.1900"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          className="contact-map-link"
          href="https://www.openstreetmap.org/directions?to=Via%20dei%20Sapori%2012%2C%20Milano%2C%20Italia"
          target="_blank"
          rel="noreferrer"
        >
          Apri indicazioni
        </a>
      </div>
    </section>
  );
};

export default ContactSection;
