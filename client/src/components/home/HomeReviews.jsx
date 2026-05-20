import './HomeReviews.css';

const HomeReviews = ({ recensioni }) => {
  return (
    <section className="home-reviews">
      <span className="home-section-label">LE VOCI DEI NOSTRI OSPITI</span>
      <h2>Recensioni</h2>

      <div className="home-reviews-grid">
        {recensioni.map((review) => (
          <article key={review.id} className="home-review-card">
            <span className="home-quote-icon" aria-hidden="true">"</span>
            <div className="home-stars" aria-label="Cinque stelle">★★★★★</div>
            <p>"{review.testo}"</p>
            <div className="home-review-footer">
              <strong>{review.autore}</strong>
              <span>{review.data}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HomeReviews;
