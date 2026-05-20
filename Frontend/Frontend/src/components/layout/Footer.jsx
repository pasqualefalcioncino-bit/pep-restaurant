import logo from '../../assets/images/brand/logo.png';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <section className="footer-section footer-brand" aria-label="Informazioni ristorante">
          <div className="footer-logo">
            <img src={logo} alt="" className="footer-logo-img" />
            <div>
              <h3>Ristorante</h3>
              <span>DA PEPPE E SPIKE</span>
            </div>
          </div>
          <p>
            Cucina italiana d'autore dal 2003. Tradizione, materie prime selezionate,
            eccellenza al tavolo.
          </p>
          <div className="social-icons" aria-label="Social">
            <a className="icon-circle" href="#instagram" aria-label="Instagram">
              <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="5" />
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="17" cy="7" r="1" />
              </svg>
            </a>
            <a className="icon-circle" href="#facebook" aria-label="Facebook">
              <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 8.2h2V5h-2.6C10.8 5 9.5 6.5 9.5 9v2H7v3.2h2.5V20H13v-5.8h2.5L16 11h-3V9.4c0-.8.3-1.2 1-1.2Z" />
              </svg>
            </a>
          </div>
        </section>

        <section className="footer-section">
          <h4>VISITA</h4>
          <ul className="contact-list">
            <li>Via dei Sapori 12, 20121 Milano</li>
            <li><a href="tel:+390212345678">+39 3887898697</a></li>
            <li><a href="mailto:info@ristorantedapeppeespike.it">info@: ristorantedapeppeespike.it</a></li>
          </ul>
        </section>

        <section className="footer-section">
          <h4>ORARI</h4>
          <ul className="hours-list">
            <li>Mar-Sab &middot; 12:30 - 14:30</li>
            <li>Mar-Sab &middot; 19:30 - 23:00</li>
            <li>Domenica &middot; solo cena</li>
            <li className="closed">Lunedi chiuso</li>
          </ul>
        </section>
      </div>

      <div className="footer-bottom-wrap">
        <div className="footer-bottom">
          <p>&copy; 2003-{currentYear} Ristorante Da Peppe e Spike &middot; P.IVA 01234567890</p>
          <div className="legal-links" aria-label="Link legali">
            <a href="#privacy">Privacy</a>
            <a href="#cookie">Cookie</a>
            <a href="#termini">Termini</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
