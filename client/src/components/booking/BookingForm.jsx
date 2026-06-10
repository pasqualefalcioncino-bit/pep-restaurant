import { useEffect, useMemo, useState } from 'react';
import { Circle, Minus, Plus } from 'lucide-react';
import { apiRequest, getAuthUser, saveAuthSession, getAuthToken } from '../../api/client';
import BookingOccasion from './BookingOccasion';
import BookingSummary from './BookingSummary';
import bookingOptions from '../../data/bookingOptions.json';
import useAutoDismiss from '../../hooks/useAutoDismiss';
import './BookingForm.css';

const { availableTimes, countryPrefixes } = bookingOptions;

const getTodayValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;

  return new Date(today.getTime() - timezoneOffset).toISOString().split('T')[0];
};

const getPhoneParts = (phoneValue = '') => {
  const phone = phoneValue.trim();
  const matchingPrefix = countryPrefixes.find((countryPrefix) =>
    phone.startsWith(countryPrefix.value)
  )?.value;

  if (!matchingPrefix) {
    return {
      phonePrefix: '+39',
      phone: phone.replace(/\D/g, '').slice(0, 10),
    };
  }

  return {
    phonePrefix: matchingPrefix,
    phone: phone.slice(matchingPrefix.length).replace(/\D/g, '').slice(0, 10),
  };
};

const BookingForm = ({ onBookingSuccess }) => {
  const currentUser = useMemo(() => getAuthUser(), []);
  const currentUserPhone = useMemo(() => getPhoneParts(currentUser?.phone), [currentUser?.phone]);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: getTodayValue(),
    guests: 2,
    time: '20:00',
    occasion: 'lavoro',
    specialRequests: '',
    fullName: currentUser?.role === 'cliente' ? currentUser.name || '' : '',
    phonePrefix: currentUserPhone.phonePrefix,
    phone: currentUserPhone.phone,
    email: currentUser?.role === 'cliente' ? currentUser.email || '' : '',
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingErrorMessage, setBookingErrorMessage] = useState('');
  const todayValue = getTodayValue();
  const maxGuests = 12;

  useAutoDismiss(bookingErrorMessage, setBookingErrorMessage);
  useAutoDismiss(isConfirmed, setIsConfirmed, false);

  useEffect(() => {
    if (currentUser?.role !== 'cliente' || currentUser.email) {
      return;
    }

    const loadCurrentUser = async () => {
      try {
        const user = await apiRequest('/users/me');
        const token = getAuthToken();

        if (token) {
          saveAuthSession({ token, user });
        }

        setBookingData((currentData) => ({
          ...currentData,
          fullName: currentData.fullName || user.name || '',
          email: currentData.email || user.email || '',
          phonePrefix: currentData.phone ? currentData.phonePrefix : getPhoneParts(user.phone).phonePrefix,
          phone: currentData.phone || getPhoneParts(user.phone).phone,
        }));
      } catch {
        // Se il recupero fallisce, il cliente puo' comunque compilare i campi manualmente.
      }
    };

    loadCurrentUser();
  }, [currentUser]);

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
        }),
      });

      setIsConfirmed(true);
      if (onBookingSuccess) {
        onBookingSuccess();
      }
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
        <h1 className="booking-title" id="booking-title">
          Prenota un Tavolo
        </h1>
        <p>Scegli data, orario e dettagli della tua esperienza.</p>
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
            <div className="booking-form-row">
              <div className="booking-form-group">
                <label htmlFor="booking-date">Data</label>
                <input
                  id="booking-date"
                  type="date"
                  min={todayValue}
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
                    <Minus size={16} strokeWidth={2.4} aria-hidden="true" />
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
                    <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div className="booking-times-section">
              <span className="booking-field-label">Orario disponibile</span>
              <div className="booking-times-grid">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    className={`booking-time-btn${bookingData.time === time ? ' selected' : ''}`}
                    type="button"
                    onClick={() => updateField('time', time)}
                    aria-pressed={bookingData.time === time}
                  >
                    <Circle size={12} strokeWidth={2.4} aria-hidden="true" />
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
