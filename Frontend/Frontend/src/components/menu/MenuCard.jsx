import './MenuCard.css';

const MenuCard = ({ piatto }) => {
  return (
    <article className="menu-card">
      <div className="menu-card-image-container">
        {piatto.immagine ? (
          <img src={piatto.immagine} alt={piatto.nome} />
        ) : (
          <div className="menu-card-image-placeholder" aria-hidden="true">
            <span>Non disponibile</span>
          </div>
        )}
        <div className="menu-card-badges">
          {piatto.veg && <span className="menu-badge menu-badge-veg">🌿 Veg</span>}
        </div>
      </div>

      <div className="menu-card-content">
        <div className="menu-card-header">
          <span className="menu-category-label">{piatto.categoria}</span>
        </div>

        <h3>{piatto.nome}</h3>
        <p className="menu-description">{piatto.descrizione}</p>
        <p className="menu-prep-time">🕒 {piatto.tempo} min</p>

        <div className="menu-card-footer">
          <span className="menu-price">€{piatto.prezzo}</span>
        </div>
      </div>
    </article>
  );
};

export default MenuCard;
