import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Mail, Phone, Trash2, Users } from 'lucide-react';
import { apiRequest } from '../api/client';
import ConfirmDeleteModal from '../components/admin/ConfirmDeleteModal';
import useAutoDismiss from '../hooks/useAutoDismiss';
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

const getDateKey = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.slice(0, 10);
  }

  const date = new Date(dateValue);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const bookingStatuses = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'confermata', label: 'Confermata' },
  { value: 'annullata', label: 'Annullata' },
];

const tableStatusLabels = {
  libero: 'libero',
  occupato: 'occupato',
  prenotato: 'prenotato',
  in_pulizia: 'in pulizia',
};

const bookingTurnoverMinutes = 30;

const formatTableOption = (table) => {
  const statusLabel = tableStatusLabels[table.status] || table.status;

  return `Tav. ${table.table_number} - ${table.seats} posti - ${statusLabel}`;
};

const getBookingDateTime = (booking) => {
  const dateKey = getDateKey(booking.booking_date);
  const timeValue = formatTime(booking.booking_time);

  if (!dateKey || timeValue === '-') {
    return null;
  }

  return new Date(`${dateKey}T${timeValue}`);
};

const hasSlotConflict = (table, targetBooking, bookings) => {
  const targetDateTime = getBookingDateTime(targetBooking);

  if (!targetDateTime) {
    return true;
  }

  return bookings.some((booking) => {
    if (
      booking.id === targetBooking.id ||
      booking.status === 'annullata' ||
      booking.table_number !== table.table_number
    ) {
      return false;
    }

    const bookingDateTime = getBookingDateTime(booking);

    if (!bookingDateTime) {
      return false;
    }

    return Math.abs(bookingDateTime.getTime() - targetDateTime.getTime()) <
      bookingTurnoverMinutes * 60 * 1000;
  });
};

const isTableUnavailableForBooking = (table, booking, bookings) => {
  return (
    table.status === 'in_pulizia' ||
    Number(table.seats) < Number(booking.guests || 0) ||
    hasSlotConflict(table, booking, bookings)
  );
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  useAutoDismiss(errorMessage, setErrorMessage);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const [bookingsData, tablesData] = await Promise.all([
          apiRequest('/bookings'),
          apiRequest('/tables'),
        ]);

        setBookings(bookingsData);
        setTables(tablesData);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  const sortedTables = useMemo(() => [...tables].sort((firstTable, secondTable) => {
    return firstTable.table_number - secondTable.table_number;
  }), [tables]);
  const todayKey = getDateKey(new Date());
  const todayBookings = useMemo(() => bookings.filter((booking) => {
    return getDateKey(booking.booking_date) === todayKey;
  }), [bookings, todayKey]);
  const bookingSummary = useMemo(() => ({
    waiting: todayBookings.filter((booking) => booking.status === 'in_attesa').length,
    confirmed: todayBookings.filter((booking) => booking.status === 'confermata').length,
    guests: todayBookings.reduce(
      (totalGuests, booking) => totalGuests + Number(booking.guests || 0),
      0
    ),
  }), [todayBookings]);

  const updateBooking = async (booking, changes) => {
    const bookingId = booking.id;
    const nextStatus = changes.status || booking.status;
    const nextTableNumber =
      changes.table_number !== undefined ? changes.table_number : booking.table_number;

    setUpdatingBookingId(bookingId);
    setErrorMessage('');

    try {
      const updatedBooking = await apiRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: nextStatus,
          table_number: nextTableNumber ? Number(nextTableNumber) : null,
        }),
      });

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
      setTables(await apiRequest('/tables'));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const deleteBooking = async () => {
    if (!bookingToDelete) {
      return;
    }

    setDeletingBookingId(bookingToDelete.id);
    setErrorMessage('');

    try {
      await apiRequest(`/bookings/${bookingToDelete.id}`, {
        method: 'DELETE',
      });

      setBookings((currentBookings) =>
        currentBookings.filter((currentBooking) => currentBooking.id !== bookingToDelete.id)
      );
      setTables(await apiRequest('/tables'));
      setBookingToDelete(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingBookingId(null);
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
        <h1 id="admin-bookings-title">Prenotazioni Ricevute</h1>
      </div>

      <div className="admin-bookings-stats" aria-label="Riepilogo prenotazioni">
        <article>
          <span>
            <CalendarDays size={17} aria-hidden="true" />
            Oggi
          </span>
          <strong>{todayBookings.length}</strong>
        </article>
        <article>
          <span>
            <Clock3 size={17} aria-hidden="true" />
            In attesa
          </span>
          <strong>{bookingSummary.waiting}</strong>
        </article>
        <article>
          <span>
            <CheckCircle2 size={17} aria-hidden="true" />
            Confermate
          </span>
          <strong>{bookingSummary.confirmed}</strong>
        </article>
        <article>
          <span>
            <Users size={17} aria-hidden="true" />
            Ospiti
          </span>
          <strong>{bookingSummary.guests}</strong>
        </article>
      </div>

      {todayBookings.length === 0 ? (
        <p className="admin-bookings-state">Nessuna prenotazione per oggi.</p>
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
                <th>Tavolo</th>
                <th>Stato</th>
                <th>Richieste</th>
              </tr>
            </thead>
            <tbody>
              {todayBookings.map((booking) => (
                <tr className={`status-${booking.status}`} key={booking.id}>
                  <td data-label="Cliente">
                    <strong>{booking.full_name}</strong>
                  </td>
                  <td data-label="Contatti">
                    <span className="admin-bookings-contact-line">
                      <Mail size={14} aria-hidden="true" />
                      {booking.email}
                    </span>
                    <small className="admin-bookings-contact-line">
                      <Phone size={14} aria-hidden="true" />
                      {booking.phone}
                    </small>
                  </td>
                  <td data-label="Data">
                    <span>{formatDate(booking.booking_date)}</span>
                    <small>{formatTime(booking.booking_time)}</small>
                  </td>
                  <td data-label="Ospiti">{booking.guests}</td>
                  <td data-label="Occasione">{booking.occasion || '-'}</td>
                  <td data-label="Tavolo">
                    <select
                      className="admin-bookings-table-select"
                      value={booking.table_number || ''}
                      onChange={(event) =>
                        updateBooking(booking, {
                          table_number: event.target.value,
                          status: event.target.value ? 'confermata' : 'in_attesa',
                        })
                      }
                      disabled={updatingBookingId === booking.id}
                      aria-label={`Tavolo prenotazione ${booking.full_name}`}
                    >
                      <option value="">Non assegnato</option>
                      {sortedTables.map((table) => {
                        const isCurrentTable = table.table_number === booking.table_number;
                        const isUnavailable =
                          !isCurrentTable &&
                          isTableUnavailableForBooking(table, booking, bookings);

                        return (
                          <option
                            key={table.id}
                            value={table.table_number}
                            disabled={isUnavailable}
                          >
                            {formatTableOption(table)}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td data-label="Stato">
                    <select
                      className={`admin-bookings-status-select status-${booking.status}`}
                      value={booking.status}
                      onChange={(event) => {
                        const nextStatus = event.target.value;

                        if (nextStatus === 'annullata') {
                          setBookingToDelete(booking);
                          return;
                        }

                        updateBooking(booking, {
                          status: nextStatus,
                        });
                      }}
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
                  <td data-label="Richieste">
                    <span className="admin-bookings-requests">
                      {booking.special_requests || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bookingToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare questa prenotazione?"
          summaryItems={[{
            id: bookingToDelete.id,
            title: bookingToDelete.full_name,
            details: [
              `${formatDate(bookingToDelete.booking_date)} alle ${formatTime(bookingToDelete.booking_time)}`,
              `${bookingToDelete.guests} ospiti`,
            ],
            icon: <Users size={18} aria-hidden="true" />,
            fallbackText: bookingToDelete.full_name.charAt(0),
          }]}
          isDeleting={deletingBookingId === bookingToDelete.id}
          onCancel={() => setBookingToDelete(null)}
          onConfirm={deleteBooking}
          confirmIcon={<Trash2 size={16} aria-hidden="true" />}
        />
      )}
    </section>
  );
};

export default AdminBookings;
