import { getBrandImage } from '../../utils/brandImages';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const logo = getBrandImage('logo.png');

  return (
    <footer className="footer">
      <div className="footer-content">
        <section className="footer-section footer-brand" aria-label="Informazioni ristorante">
          <div className="footer-logo">
            {logo && <img src={logo} alt="" className="footer-logo-img" />}
            <div>
              <h3>Ristorante</h3>
              <span>DA PEPPE E SPIKE</span>
            </div>
          </div>
          <p>
            Cucina italiana d'autore dal 2026. Tradizione, materie prime selezionate,
            eccellenza al tavolo.
          </p>
        </section>

        <section className="footer-section">
          <h4>VISITA</h4>
          <ul>
            <li>Via Hertz n.1, 86090, Pesche (IS)</li>
            <li><a href="tel:+393887898697">+39 388 789 8697</a></li>
            <li><a href="mailto:info@ristorantedapeppeespike.it">info@ristorantedapeppeespike.it</a></li>
          </ul>
        </section>

        <section className="footer-section">
          <h4>ORARI</h4>
          <ul className="footer-hours-list">
            <li className="footer-hours-days">Lunedi - Domenica</li>
            <li className="footer-hours-times">
              <span>12:30 - 14:30</span>
              <span>19:30 - 23:00</span>
            </li>
          </ul>
        </section>
      </div>

      <div className="footer-bottom-wrap">
        <div className="footer-bottom">
          <p>&copy; 2026-{currentYear} Ristorante Da Peppe e Spike &middot; Progetto universitario</p>
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
