import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { openingHours } from '../../utils/openingHours';
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
              <strong>Via Hertz n.1</strong>
              <p>86090 Pesche (IS), Italia</p>
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
              <p>{openingHours.closedLabel}</p>
              <p>
                {openingHours.openDaysLabel} {openingHours.lunchLabel} · {openingHours.dinnerLabel}
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="contact-map-card">
        <iframe
          title="Mappa di Pep Restaurant a Pesche"
          className="contact-map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=14.2600%2C41.5900%2C14.3000%2C41.6200&layer=mapnik&marker=41.6050%2C14.2800"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          className="contact-map-link"
          href="https://www.openstreetmap.org/directions?to=Via%20Hertz%20n.1%2C%2086090%20Pesche%20IS%2C%20Italia"
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
