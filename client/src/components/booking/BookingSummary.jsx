import bookingOptions from '../../data/bookingOptions.json';
import './BookingSummary.css';

const { countryPrefixes, occasions } = bookingOptions;

const getOccasionLabel = (occasionId) => {
  return occasions.find((occasion) => occasion.id === occasionId)?.label || 'Non specificata';
};

const formatSummaryDate = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${dateValue}T12:00:00`));
};

const BookingSummary = ({
  bookingData,
  onFieldChange,
  onBack,
  onConfirm,
  isConfirmed,
  isSubmitting,
  errorMessage,
}) => {
  const isPhoneComplete = bookingData.phone.length === 10;
  const shouldShowPhoneError = bookingData.phone.length > 0 && !isPhoneComplete;

  const handlePhoneChange = (value) => {
    const onlyDigits = value.replace(/\D/g, '').slice(0, 10);
    onFieldChange('phone', onlyDigits);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isPhoneComplete) {
      return;
    }

    await onConfirm();
  };

  return (
    <div className="booking-step-container">
      <div className="booking-stepper" aria-label="Passaggi prenotazione">
        <div className="booking-step booking-step-completed" aria-label="Passaggio 1 completato">
          ✓
        </div>
        <div className="booking-step-line booking-step-line-completed" />
        <div className="booking-step booking-step-completed" aria-label="Passaggio 2 completato">
          ✓
        </div>
        <div className="booking-step-line booking-step-line-completed" />
        <div className="booking-step booking-step-active">3</div>
      </div>

      <form className="booking-card" onSubmit={handleSubmit}>
        <div className="booking-form-row">
          <div className="booking-form-group">
            <label htmlFor="booking-full-name">Nome e cognome</label>
            <input
              id="booking-full-name"
              type="text"
              value={bookingData.fullName}
              onChange={(event) => onFieldChange('fullName', event.target.value)}
              placeholder="Inserisci nome e cognome"
              autoComplete="name"
              required
            />
          </div>

          <div className="booking-form-group">
            <label htmlFor="booking-phone">Telefono</label>
            <div className="booking-phone-field">
              <div className="booking-phone-prefix-wrap">
                <select
                  className="booking-phone-prefix"
                  value={bookingData.phonePrefix}
                  onChange={(event) => onFieldChange('phonePrefix', event.target.value)}
                  aria-label="Prefisso internazionale"
                >
                  {countryPrefixes.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                id="booking-phone"
                type="tel"
                value={bookingData.phone}
                onChange={(event) => handlePhoneChange(event.target.value)}
                placeholder="3331234567"
                autoComplete="tel-national"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength="10"
                aria-invalid={shouldShowPhoneError}
                required
              />
            </div>
          </div>
        </div>

        <div className="booking-form-group booking-email-group">
          <label htmlFor="booking-email">Email</label>
          <input
            id="booking-email"
            type="email"
            value={bookingData.email}
            onChange={(event) => onFieldChange('email', event.target.value)}
            placeholder="esempio@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="booking-summary-box">
          <span className="booking-summary-label">Riepilogo</span>
          <div className="booking-summary-details" aria-label="Riepilogo dati prenotazione">
            <div className="booking-summary-row">
              <span aria-hidden="true">📅</span>
              <div>
                <small>Data e orario</small>
                <strong>
                  {formatSummaryDate(bookingData.date)} alle {bookingData.time}
                </strong>
              </div>
            </div>

            <div className="booking-summary-row">
              <span aria-hidden="true">👥</span>
              <div>
                <small>Ospiti</small>
                <strong>{bookingData.guests} ospiti</strong>
              </div>
            </div>

            <div className="booking-summary-row">
              <span aria-hidden="true">▣</span>
              <div>
                <small>Occasione</small>
                <strong>{getOccasionLabel(bookingData.occasion)}</strong>
              </div>
            </div>

            <div className="booking-summary-row">
              <span aria-hidden="true">✦</span>
              <div>
                <small>Richieste speciali</small>
                <strong>{bookingData.specialRequests || 'Nessuna richiesta inserita'}</strong>
              </div>
            </div>

            <div className="booking-summary-row">
              <span aria-hidden="true">☎</span>
              <div>
                <small>Telefono</small>
                <strong>
                  {bookingData.phonePrefix} {bookingData.phone || 'Da completare'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {isConfirmed && (
          <p className="booking-confirmation-message" role="status">
            Prenotazione inviata. Ti ricontatteremo per la conferma.
          </p>
        )}

        {errorMessage && (
          <p className="booking-error-message" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="booking-actions">
          <button className="booking-back-btn" type="button" onClick={onBack} disabled={isSubmitting}>
            Indietro
          </button>
          <button className="booking-confirm-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Invio in corso...' : 'Conferma Prenotazione'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingSummary;
