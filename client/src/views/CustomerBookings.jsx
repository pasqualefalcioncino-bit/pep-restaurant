import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import './CustomerBookings.css';

const bookingStatuses = {
  in_attesa: 'In attesa',
  confermata: 'Confermata',
  annullata: 'Annullata',
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateValue));
};

const formatTime = (timeValue) => {
  return timeValue ? timeValue.slice(0, 5) : '-';
};

const CustomerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await apiRequest('/bookings/my');
        setBookings(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  if (isLoading) {
    return (
      <section className="customer-bookings-page">
        <p className="customer-bookings-state">Caricamento prenotazioni...</p>
      </section>
    );
  }

  return (
    <section className="customer-bookings-page" aria-labelledby="customer-bookings-title">
      <div className="customer-bookings-header">
        <span className="customer-bookings-kicker">AREA CLIENTE</span>
        <h1 id="customer-bookings-title">Le Tue Prenotazioni</h1>
        <p>{bookings.length} prenotazioni collegate al tuo account.</p>
      </div>

      {errorMessage && <p className="customer-bookings-state error">Errore: {errorMessage}</p>}

      {!errorMessage && bookings.length === 0 ? (
        <p className="customer-bookings-state">Non hai ancora prenotazioni salvate.</p>
      ) : (
        <div className="customer-bookings-grid">
          {bookings.map((booking) => (
            <article className={`customer-booking-card status-${booking.status}`} key={booking.id}>
              <div className="customer-booking-card-header">
                <div>
                  <span className="customer-booking-label">Prenotazione #{booking.id}</span>
                  <h2>{booking.full_name}</h2>
                </div>
                <span className={`customer-booking-status status-${booking.status}`}>
                  {bookingStatuses[booking.status] || booking.status}
                </span>
              </div>

              <dl className="customer-booking-details">
                <div>
                  <dt>Data</dt>
                  <dd>{formatDate(booking.booking_date)}</dd>
                </div>
                <div>
                  <dt>Orario</dt>
                  <dd>{formatTime(booking.booking_time)}</dd>
                </div>
                <div>
                  <dt>Ospiti</dt>
                  <dd>{booking.guests}</dd>
                </div>
                <div>
                  <dt>Telefono</dt>
                  <dd>{booking.phone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{booking.email}</dd>
                </div>
                <div>
                  <dt>Occasione</dt>
                  <dd>{booking.occasion || '-'}</dd>
                </div>
                <div>
                  <dt>Evento</dt>
                  <dd>{booking.event_title || '-'}</dd>
                </div>
                <div>
                  <dt>Richieste</dt>
                  <dd>{booking.special_requests || '-'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default CustomerBookings;
