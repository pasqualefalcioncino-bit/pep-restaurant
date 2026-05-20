import './HomeFeatures.css';

const HomeFeatures = ({ features }) => {
  return (
    <>
      <section className="home-intro">
        <span className="home-section-label">COSA OFFRIAMO</span>
        <h2>Un'esperienza, mille dettagli</h2>
      </section>

      <section className="home-features-grid" aria-label="Servizi principali">
        {features.map((feature) => (
          <article key={feature.id} className="home-feature-card">
            <div className="home-feature-icon" aria-hidden="true">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </>
  );
};

export default HomeFeatures;
