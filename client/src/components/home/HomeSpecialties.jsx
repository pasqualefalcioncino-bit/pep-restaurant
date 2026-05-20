import { getMenuImage } from '../../utils/menuImages';
import './HomeSpecialties.css';

const HomeSpecialties = ({ specialita, onNavigate }) => {
  return (
    <section className="home-specialties">
      <div className="home-specialties-header">
        <div className="home-specialties-heading">
          <span className="home-section-label">SPECIALITA</span>
          <h2>I Piatti dello Chef</h2>
        </div>
        <button className="home-view-all-btn" type="button" onClick={() => onNavigate('menu')}>
          Vedi tutto il menu <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="home-specialties-grid">
        {specialita.map((piatto) => {
          const image = getMenuImage(piatto.immagine);

          return (
            <article key={piatto.id} className="home-dish-card">
              <div className="home-dish-image">
                {image && <img src={image} alt={piatto.nome} />}
              </div>
              <div className="home-dish-info">
                <div className="home-dish-meta">
                  <span>{piatto.categoria}</span>
                  <span>★ {piatto.rating}</span>
                </div>
                <h3>{piatto.nome}</h3>
                <p>{piatto.descrizione}</p>
                <div className="home-dish-footer">
                  <span className="home-dish-price">€{piatto.prezzo}</span>
                  <button className="home-discover-btn" type="button" onClick={() => onNavigate('menu')}>
                    Scopri <span aria-hidden="true">›</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default HomeSpecialties;
