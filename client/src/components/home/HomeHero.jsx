import { getBrandImage } from '../../utils/brandImages';
import './HomeHero.css';

const HomeHero = ({ hero, onNavigate }) => {
  const heroImage = getBrandImage(hero.image);

  return (
    <section className="home-hero">
      <div className="home-hero-text">
        <span className="home-section-label">{hero.label}</span>
        <h1>{hero.title}</h1>
        <p>{hero.description}</p>

        <div className="home-hero-actions">
          <button className="home-primary-btn" type="button" onClick={() => onNavigate('prenota')}>
            Prenota un Tavolo <span aria-hidden="true">›</span>
          </button>
          <button className="home-secondary-btn" type="button" onClick={() => onNavigate('menu')}>
            Scopri il Menu
          </button>
        </div>

        <div className="home-hero-stats">
          {hero.stats.map((stat) => (
            <div key={stat.label} className="home-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="home-hero-image-wrap">
        {heroImage && <img src={heroImage} alt="Sala del ristorante" />}
        <div className="home-award-badge">
          <span className="home-award-icon" aria-hidden="true">🏅</span>
          <div>
            <strong>{hero.awardTitle}</strong>
            <p>{hero.awardText}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
