import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import CancelBookingModal from '../components/booking/CancelBookingModal';
import bookingOptions from '../data/bookingOptions.json';
import './CustomerBookings.css';

const { availableTimes } = bookingOptions;

const bookingStatuses = {
  in_attesa: 'In attesa',
  confermata: 'Confermata',
  annullata: 'Annullata',
};

const getLocalDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const datePart =
    typeof dateValue === 'string' && !dateValue.includes('T') ? dateValue : null;

  if (datePart) {
    return new Date(`${datePart}T00:00:00`);
  }

  return new Date(dateValue);
};

const formatDate = (dateValue) => {
  const date = getLocalDate(dateValue);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatTime = (timeValue) => {
  return timeValue ? timeValue.slice(0, 5) : '-';
};

const getDateInputValue = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  if (typeof dateValue === 'string') {
    if (!dateValue.includes('T')) {
      return dateValue;
    }

    const date = new Date(dateValue);
    const timezoneOffset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
  }

  const timezoneOffset = dateValue.getTimezoneOffset() * 60000;
  return new Date(dateValue.getTime() - timezoneOffset).toISOString().split('T')[0];
};

const getTodayValue = () => getDateInputValue(new Date());

const getSelectableTimes = (dateValue, selectedTime = '') => {
  const todayValue = getTodayValue();
  const isToday = dateValue === todayValue;
  const futureTimes = availableTimes.filter((time) => {
    if (!isToday) {
      return true;
    }

    return new Date(`${dateValue}T${time}`) > new Date();
  });

  if (selectedTime && !futureTimes.includes(selectedTime)) {
    return availableTimes.filter((time) => time === selectedTime || futureTimes.includes(time));
  }

  return futureTimes;
};

const getBookingDateTime = (booking) => {
  const date = getDateInputValue(booking.booking_date);
  const time = formatTime(booking.booking_time);

  if (!date || time === '-') {
    return null;
  }

  return new Date(`${date}T${time}`);
};

const canManageBooking = (booking) => {
  const bookingDateTime = getBookingDateTime(booking);

  return booking.status === 'in_attesa' && bookingDateTime && bookingDateTime > new Date();
};

const getEditFormFromBooking = (booking) => ({
  full_name: booking.full_name || '',
  email: booking.email || '',
  phone: booking.phone || '',
  booking_date: getDateInputValue(booking.booking_date),
  booking_time: formatTime(booking.booking_time),
  guests: booking.guests || 1,
  occasion: booking.occasion || '',
  special_requests: booking.special_requests || '',
});

const CustomerBookingCard = ({
  booking,
  editForm,
  isEditing,
  isBusy,
  canManage,
  onCancelBooking,
  onChangeEditField,
  onEdit,
  onSave,
  onStopEditing,
}) => (
  <article className={`customer-booking-card status-${booking.status}`}>
    <div className="customer-booking-card-header">
      <div>
        <span className="customer-booking-label">Prenotazione #{booking.id}</span>
        <h2>{booking.full_name}</h2>
      </div>
      <span className={`customer-booking-status status-${booking.status}`}>
        {bookingStatuses[booking.status] || booking.status}
      </span>
    </div>

    {isEditing ? (
      <form className="customer-booking-edit-form" onSubmit={onSave}>
        <label>
          Nome
          <input
            type="text"
            value={editForm.full_name}
            onChange={(event) => onChangeEditField('full_name', event.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={editForm.email}
            onChange={(event) => onChangeEditField('email', event.target.value)}
            required
          />
        </label>
        <label>
          Telefono
          <input
            type="tel"
            value={editForm.phone}
            onChange={(event) => onChangeEditField('phone', event.target.value)}
            required
          />
        </label>
        <label>
          Data
          <input
            type="date"
            min={getTodayValue()}
            value={editForm.booking_date}
            onChange={(event) => onChangeEditField('booking_date', event.target.value)}
            required
          />
        </label>
        <label>
          Orario
          <select
            value={editForm.booking_time}
            onChange={(event) => onChangeEditField('booking_time', event.target.value)}
            required
          >
            {getSelectableTimes(editForm.booking_date, editForm.booking_time).map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ospiti
          <input
            type="number"
            min="1"
            max="12"
            value={editForm.guests}
            onChange={(event) => onChangeEditField('guests', event.target.value)}
            required
          />
        </label>
        <label>
          Occasione
          <input
            type="text"
            value={editForm.occasion}
            onChange={(event) => onChangeEditField('occasion', event.target.value)}
          />
        </label>
        <label className="customer-booking-edit-wide">
          Richieste
          <textarea
            rows="3"
            value={editForm.special_requests}
            onChange={(event) => onChangeEditField('special_requests', event.target.value)}
          />
        </label>

        <div className="customer-booking-actions customer-booking-edit-wide">
          <button className="customer-booking-primary-btn" type="submit" disabled={isBusy}>
            {isBusy ? 'Salvataggio...' : 'Salva'}
          </button>
          <button type="button" className="customer-booking-secondary-btn" onClick={onStopEditing}>
            Annulla modifica
          </button>
        </div>
      </form>
    ) : (
      <>
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
            <dt>Tavolo</dt>
            <dd>{booking.table_number || '-'}</dd>
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
            <dt>Richieste</dt>
            <dd>{booking.special_requests || '-'}</dd>
          </div>
        </dl>

        {canManage && (
          <div className="customer-booking-actions">
            <button className="customer-booking-secondary-btn" type="button" onClick={onEdit}>
              Modifica
            </button>
            <button
              className="customer-booking-danger-btn"
              type="button"
              onClick={onCancelBooking}
              disabled={isBusy}
            >
              {isBusy ? 'Annullamento...' : 'Annulla prenotazione'}
            </button>
          </div>
        )}
      </>
    )}
  </article>
);

const CustomerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [busyBookingId, setBusyBookingId] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);

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

  const updateBookingInList = (updatedBooking) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
  };

  const startEditing = (booking) => {
    setActionMessage('');
    setEditingBookingId(booking.id);
    setEditForm(getEditFormFromBooking(booking));
  };

  const stopEditing = () => {
    setEditingBookingId(null);
    setEditForm(null);
  };

  const changeEditField = (field, value) => {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setActionMessage('');
  };

  const saveBooking = async (event) => {
    event.preventDefault();

    if (!editingBookingId || !editForm) {
      return;
    }

    setBusyBookingId(editingBookingId);
    setActionMessage('');

    try {
      const updatedBooking = await apiRequest(`/bookings/${editingBookingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          guests: Number(editForm.guests),
        }),
      });

      updateBookingInList(updatedBooking);
      stopEditing();
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setBusyBookingId(null);
    }
  };

  const openCancelModal = (booking) => {
    setActionMessage('');
    setBookingToCancel(booking);
  };

  const closeCancelModal = () => {
    if (busyBookingId) {
      return;
    }

    setBookingToCancel(null);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) {
      return;
    }

    setBusyBookingId(bookingToCancel.id);
    setActionMessage('');

    try {
      const updatedBooking = await apiRequest(`/bookings/${bookingToCancel.id}/cancel`, {
        method: 'PATCH',
      });

      updateBookingInList(updatedBooking);
      if (editingBookingId === bookingToCancel.id) {
        stopEditing();
      }
      setBookingToCancel(null);
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setBusyBookingId(null);
    }
  };

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
      {actionMessage && <p className="customer-bookings-state error">Errore: {actionMessage}</p>}

      {!errorMessage && bookings.length === 0 ? (
        <p className="customer-bookings-state">Non hai ancora prenotazioni salvate.</p>
      ) : !errorMessage ? (
        <div className="customer-bookings-grid">
          {bookings.map((booking) => (
            <CustomerBookingCard
              booking={booking}
              canManage={canManageBooking(booking)}
              editForm={editForm}
              isBusy={busyBookingId === booking.id}
              isEditing={editingBookingId === booking.id}
              key={booking.id}
              onCancelBooking={() => openCancelModal(booking)}
              onChangeEditField={changeEditField}
              onEdit={() => startEditing(booking)}
              onSave={saveBooking}
              onStopEditing={stopEditing}
            />
          ))}
        </div>
      ) : null}

      <CancelBookingModal
        booking={bookingToCancel}
        formatDate={formatDate}
        formatTime={formatTime}
        isBusy={bookingToCancel ? busyBookingId === bookingToCancel.id : false}
        onClose={closeCancelModal}
        onConfirm={confirmCancelBooking}
      />
    </section>
  );
};

export default CustomerBookings;
