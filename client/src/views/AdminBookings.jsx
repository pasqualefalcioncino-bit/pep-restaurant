import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import './AdminBookings.css';

const formatDate = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateValue));
};

const formatTime = (timeValue) => {
  return timeValue ? timeValue.slice(0, 5) : '-';
};

const bookingStatuses = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'confermata', label: 'Confermata' },
  { value: 'annullata', label: 'Annullata' },
];

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await apiRequest('/bookings');
        setBookings(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  const updateStatus = async (bookingId, status) => {
    setUpdatingBookingId(bookingId);
    setErrorMessage('');

    try {
      const updatedBooking = await apiRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-bookings-page">
        <p className="admin-bookings-state">Caricamento prenotazioni...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="admin-bookings-page">
        <p className="admin-bookings-state error">Errore: {errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="admin-bookings-page" aria-labelledby="admin-bookings-title">
      <div className="admin-bookings-header">
        <span className="admin-bookings-kicker">ADMIN</span>
        <h1 id="admin-bookings-title">Prenotazioni Ricevute</h1>
        <p>{bookings.length} prenotazioni presenti nel database.</p>
      </div>

      {bookings.length === 0 ? (
        <p className="admin-bookings-state">Nessuna prenotazione salvata.</p>
      ) : (
        <div className="admin-bookings-table-wrap">
          <table className="admin-bookings-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contatti</th>
                <th>Data</th>
                <th>Ospiti</th>
                <th>Occasione</th>
                <th>Evento</th>
                <th>Stato</th>
                <th>Richieste</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <strong>{booking.full_name}</strong>
                  </td>
                  <td>
                    <span>{booking.email}</span>
                    <small>{booking.phone}</small>
                  </td>
                  <td>
                    <span>{formatDate(booking.booking_date)}</span>
                    <small>{formatTime(booking.booking_time)}</small>
                  </td>
                  <td>{booking.guests}</td>
                  <td>{booking.occasion || '-'}</td>
                  <td>{booking.event_title || '-'}</td>
                  <td>
                    <select
                      className="admin-bookings-status-select"
                      value={booking.status}
                      onChange={(event) => updateStatus(booking.id, event.target.value)}
                      disabled={updatingBookingId === booking.id}
                      aria-label={`Stato prenotazione ${booking.full_name}`}
                    >
                      {bookingStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{booking.special_requests || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminBookings;
