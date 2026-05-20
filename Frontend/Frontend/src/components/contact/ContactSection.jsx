import './ContactSection.css';

const ContactSection = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

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

        <div className="map-placeholder">
          <div className="map-placeholder-content" aria-label="Mappa indicativa di Milano">
            <span>Milano</span>
            <strong>Via dei Sapori 12</strong>
          </div>
          <div className="map-controls">
            <button type="button">+</button>
            <button type="button">-</button>
          </div>
        </div>
      </div>

      <div className="contact-card">
        <h2>Inviaci un messaggio</h2>
        <form className="message-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nome</label>
            <input type="text" required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required />
          </div>
          <div className="input-group">
            <label>Oggetto</label>
            <input type="text" required />
          </div>
          <div className="input-group">
            <label>Messaggio</label>
            <textarea required></textarea>
          </div>
          <button type="submit" className="btn-send">Invia messaggio</button>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;
