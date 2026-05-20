import bookingOptions from '../../data/bookingOptions.json';
import './BookingOccasion.css';

const { occasions } = bookingOptions;

const BookingOccasion = ({
  selectedOccasion,
  specialRequests,
  onOccasionChange,
  onRequestsChange,
  onBack,
  onContinue,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onContinue();
  };

  return (
    <div className="booking-step-container">
      <div className="booking-stepper" aria-label="Passaggi prenotazione">
        <div className="booking-step booking-step-completed" aria-label="Passaggio 1 completato">
          ✓
        </div>
        <div className="booking-step-line booking-step-line-completed" />
        <div className="booking-step booking-step-active">2</div>
        <div className="booking-step-line" />
        <div className="booking-step">3</div>
      </div>

      <form className="booking-card" onSubmit={handleSubmit}>
        <h2 className="booking-card-title booking-occasion-title">Occasione</h2>

        <div className="booking-occasion-grid">
          {occasions.map((occasion) => (
            <button
              key={occasion.id}
              className={`booking-occasion-card${
                selectedOccasion === occasion.id ? ' selected' : ''
              }`}
              type="button"
              onClick={() => onOccasionChange(occasion.id)}
              aria-pressed={selectedOccasion === occasion.id}
            >
              <span className="booking-occasion-icon" aria-hidden="true">
                {occasion.icon}
              </span>
              <span className="booking-occasion-label">{occasion.label}</span>
            </button>
          ))}
        </div>

        <div className="booking-special-requests">
          <label htmlFor="booking-special-requests">
            Richieste speciali (allergie, sedia bimbo, ecc.)
          </label>
          <textarea
            id="booking-special-requests"
            value={specialRequests}
            onChange={(event) => onRequestsChange(event.target.value)}
            placeholder="Scrivi qui le tue richieste..."
          />
        </div>

        <div className="booking-actions">
          <button className="booking-back-btn" type="button" onClick={onBack}>
            Indietro
          </button>
          <button className="booking-continue-btn" type="submit">
            Continua
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingOccasion;
