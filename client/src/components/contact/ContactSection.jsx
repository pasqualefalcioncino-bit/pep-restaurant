import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import './ContactSection.css';

const ContactSection = () => {
  return (
    <section className="contact-container" aria-labelledby="contact-title">
      <div className="contact-info">
        <div className="contact-heading">
          <h1 id="contact-title">Contatti</h1>
          <p>
            Per prenotazioni speciali, eventi privati o informazioni sul menu,
            il nostro staff è a disposizione.
          </p>
        </div>

        <div className="contact-details">
          <article className="contact-info-item">
            <span className="contact-info-icon" aria-hidden="true">
              <MapPin size={22} strokeWidth={1.9} />
            </span>
            <div>
              <strong>Via dei Sapori 12</strong>
              <p>20121 Milano, Italia</p>
            </div>
          </article>

          <article className="contact-info-item">
            <span className="contact-info-icon" aria-hidden="true">
              <Phone size={22} strokeWidth={1.9} />
            </span>
            <div>
              <strong>Telefono</strong>
              <p><a href="tel:+393887898697">+39 388 789 8697</a></p>
            </div>
          </article>

          <article className="contact-info-item">
            <span className="contact-info-icon" aria-hidden="true">
              <Mail size={21} strokeWidth={1.9} />
            </span>
            <div>
              <strong>Email</strong>
              <p><a href="mailto:info@ristorantedapeppeespike.it">info@ristorantedapeppeespike.it</a></p>
            </div>
          </article>

          <article className="contact-info-item">
            <span className="contact-info-icon" aria-hidden="true">
              <Clock3 size={22} strokeWidth={1.9} />
            </span>
            <div>
              <strong>Orari</strong>
              <p>Mar–Sab 12:30–14:30 · 19:30–23:00</p>
              <p>Domenica solo cena</p>
            </div>
          </article>
        </div>
      </div>

      <div className="contact-map-card">
        <iframe
          title="Mappa di Pep Restaurant a Milano"
          className="contact-map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=9.1790%2C45.4580%2C9.2010%2C45.4700&layer=mapnik&marker=45.4642%2C9.1900"
          loading="eager"
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
