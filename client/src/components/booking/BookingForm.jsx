import { useState } from 'react';
import { apiRequest } from '../../api/client';
import BookingOccasion from './BookingOccasion';
import BookingSummary from './BookingSummary';
import bookingOptions from '../../data/bookingOptions.json';
import './BookingForm.css';

const { availableTimes } = bookingOptions;

const getTodayValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;

  return new Date(today.getTime() - timezoneOffset).toISOString().split('T')[0];
};

const getEventDateValue = (eventDate) => {
  return eventDate?.split(' · ')[0] || getTodayValue();
};

const getEventTimeValue = (eventDate) => {
  return eventDate?.split(' · ')[1] || '20:00';
};

const BookingForm = ({ eventBookingDraft }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: getEventDateValue(eventBookingDraft?.date),
    guests: eventBookingDraft?.guests || 2,
    time: getEventTimeValue(eventBookingDraft?.date),
    eventTitle: eventBookingDraft?.title || '',
    eventSeatsRemaining: eventBookingDraft?.seatsRemaining || null,
    occasion: 'lavoro',
    specialRequests: '',
    fullName: '',
    phonePrefix: '+39',
    phone: '',
    email: '',
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingErrorMessage, setBookingErrorMessage] = useState('');
  const todayValue = getTodayValue();
  const dateMin = bookingData.eventTitle && bookingData.date < todayValue ? bookingData.date : todayValue;
  const timesToShow = bookingData.eventTitle ? [bookingData.time] : availableTimes;
  const maxGuests = bookingData.eventSeatsRemaining || 12;

  const updateField = (field, value) => {
    setBookingData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
    setIsConfirmed(false);
    setBookingErrorMessage('');
  };

  const updateGuests = (nextGuests) => {
    const safeGuests = Math.min(maxGuests, Math.max(1, Number(nextGuests) || 1));
    updateField('guests', safeGuests);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setCurrentStep(2);
  };

  const confirmBooking = async () => {
    setIsSubmittingBooking(true);
    setBookingErrorMessage('');

    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          full_name: bookingData.fullName,
          email: bookingData.email,
          phone: `${bookingData.phonePrefix} ${bookingData.phone}`,
          booking_date: bookingData.date,
          booking_time: bookingData.time,
          guests: bookingData.guests,
          occasion: bookingData.occasion,
          special_requests: bookingData.specialRequests,
          event_title: bookingData.eventTitle,
        }),
      });

      setIsConfirmed(true);
    } catch (error) {
      setBookingErrorMessage(error.message);
      setIsConfirmed(false);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <section className="booking-page" aria-labelledby="booking-title">
      <div className="booking-header">
        <span className="booking-kicker">RISERVA</span>
        <h1 className="booking-title" id="booking-title">
          Prenota un Tavolo
        </h1>
        <div className="booking-divider" />
      </div>

      {currentStep === 1 && (
        <>
          <div className="booking-stepper" aria-label="Passaggi prenotazione">
            <div className="booking-step booking-step-active">1</div>
            <div className="booking-step-line" />
            <div className="booking-step">2</div>
            <div className="booking-step-line" />
            <div className="booking-step">3</div>
          </div>

          <form className="booking-card" onSubmit={handleSubmit}>
            <h2 className="booking-card-title">Quando?</h2>

            <div className="booking-form-row">
              <div className="booking-form-group">
                <label htmlFor="booking-date">Data</label>
                <input
                  id="booking-date"
                  type="date"
                  min={dateMin}
                  value={bookingData.date}
                  onChange={(event) => updateField('date', event.target.value)}
                  required
                />
              </div>

              <div className="booking-form-group">
                <label htmlFor="booking-guests">Ospiti</label>
                <div className="booking-guest-picker" aria-label="Numero ospiti">
                  <button
                    className="booking-picker-btn"
                    type="button"
                    onClick={() => updateGuests(bookingData.guests - 1)}
                    aria-label="Diminuisci ospiti"
                  >
                    -
                  </button>
                  <input
                    id="booking-guests"
                    className="booking-guest-input"
                    type="number"
                    min="1"
                    max={maxGuests}
                    value={bookingData.guests}
                    onChange={(event) => updateGuests(event.target.value)}
                    required
                  />
                  <button
                    className="booking-picker-btn"
                    type="button"
                    onClick={() => updateGuests(bookingData.guests + 1)}
                    aria-label="Aumenta ospiti"
                  >
                    +
                  </button>
                </div>
                {bookingData.eventSeatsRemaining && (
                  <span className="booking-guest-limit">
                    Massimo {bookingData.eventSeatsRemaining} posti disponibili per questo evento.
                  </span>
                )}
              </div>
            </div>

            <div className="booking-form-group booking-event-field">
              <label htmlFor="booking-event">Evento</label>
              <input
                id="booking-event"
                type="text"
                value={bookingData.eventTitle || 'Nessun evento'}
                readOnly
              />
            </div>

            <div className="booking-times-section">
              <span className="booking-field-label">Orario disponibile</span>
              <div className="booking-times-grid">
                {timesToShow.map((time) => (
                  <button
                    key={time}
                    className={`booking-time-btn${bookingData.time === time ? ' selected' : ''}`}
                    type="button"
                    onClick={() => updateField('time', time)}
                    aria-pressed={bookingData.time === time}
                  >
                    <span aria-hidden="true">○</span>
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-actions">
              <button className="booking-continue-btn" type="submit">
                Continua
              </button>
            </div>
          </form>
        </>
      )}

      {currentStep === 2 && (
        <BookingOccasion
          selectedOccasion={bookingData.occasion}
          specialRequests={bookingData.specialRequests}
          onOccasionChange={(occasion) => updateField('occasion', occasion)}
          onRequestsChange={(requests) => updateField('specialRequests', requests)}
          onBack={() => setCurrentStep(1)}
          onContinue={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 3 && (
        <BookingSummary
          bookingData={bookingData}
          onFieldChange={updateField}
          onBack={() => setCurrentStep(2)}
          onConfirm={confirmBooking}
          isConfirmed={isConfirmed}
          isSubmitting={isSubmittingBooking}
          errorMessage={bookingErrorMessage}
        />
      )}
    </section>
  );
};

export default BookingForm;
