import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import ConfirmDeleteModal from '../components/admin/ConfirmDeleteModal';
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

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);

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

  const sortedTables = [...tables].sort((firstTable, secondTable) => {
    return firstTable.table_number - secondTable.table_number;
  });
  const todayKey = getDateKey(new Date());
  const todayBookings = bookings.filter((booking) => {
    return getDateKey(booking.booking_date) === todayKey;
  });

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
      setTables((currentTables) =>
        currentTables.map((table) => {
          if (booking.table_number && table.table_number === booking.table_number) {
            return { ...table, status: 'libero' };
          }

          if (updatedBooking.table_number && table.table_number === updatedBooking.table_number) {
            return { ...table, status: 'prenotato' };
          }

          return table;
        })
      );
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
      if (bookingToDelete.table_number) {
        setTables((currentTables) =>
          currentTables.map((table) =>
            table.table_number === bookingToDelete.table_number
              ? { ...table, status: 'libero' }
              : table
          )
        );
      }
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
        <p>{todayBookings.length} prenotazioni per oggi.</p>
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
                  <td>
                    <select
                      className="admin-bookings-table-select"
                      value={booking.table_number || ''}
                      onChange={(event) =>
                        updateBooking(booking, {
                          table_number: event.target.value,
                          status: event.target.value ? 'confermata' : booking.status,
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
                          ['occupato', 'in_pulizia'].includes(table.status);

                        return (
                          <option
                            key={table.id}
                            value={table.table_number}
                            disabled={isUnavailable}
                          >
                            {`Tavolo ${table.table_number} - ${table.seats} posti - ${
                              tableStatusLabels[table.status] || table.status
                            }`}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td>
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
                  <td>{booking.special_requests || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bookingToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare questa prenotazione?"
          summaryItems={[
            bookingToDelete.full_name,
            `${formatDate(bookingToDelete.booking_date)} alle ${formatTime(bookingToDelete.booking_time)}`,
            `${bookingToDelete.guests} ospiti`,
          ]}
          isDeleting={deletingBookingId === bookingToDelete.id}
          onCancel={() => setBookingToDelete(null)}
          onConfirm={deleteBooking}
        />
      )}
    </section>
  );
};

export default AdminBookings;