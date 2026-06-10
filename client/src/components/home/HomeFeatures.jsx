import { CalendarCheck, ClipboardList, Utensils } from 'lucide-react';
import './HomeFeatures.css';

const featureIcons = {
  1: CalendarCheck,
  2: Utensils,
  3: ClipboardList,
};

const HomeFeatures = ({ features }) => {
  return (
    <>
      <section className="home-intro">
        <span className="home-section-label">COSA OFFRIAMO</span>
        <h2>Un'esperienza, mille dettagli</h2>
      </section>

      <section className="home-features-grid" aria-label="Servizi principali">
        {features.map((feature) => {
          const FeatureIcon = featureIcons[feature.id] || ClipboardList;

          return (
            <article key={feature.id} className="home-feature-card">
              <div className="home-feature-icon" aria-hidden="true">
                <FeatureIcon size={24} strokeWidth={1.9} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </section>
    </>
  );
};

export default HomeFeatures;
