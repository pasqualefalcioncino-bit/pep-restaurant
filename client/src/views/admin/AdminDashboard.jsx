import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import './AdminDashboard.css';

const bookingStatusLabels = {
  in_attesa: 'In attesa',
  confermata: 'Confermata',
  annullata: 'Annullata',
};

const orderStatusLabels = {
  in_attesa: 'In attesa',
  in_preparazione: 'In preparazione',
  pronto: 'Pronto',
  servito: 'Servito',
  annullato: 'Annullato',
};

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

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));
};

const buildCount = (items, predicate) => {
  return items.filter(predicate).length;
};

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    bookings: [],
    orders: [],
    customers: [],
    staff: [],
    menuItems: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const requests = [
        ['bookings', apiRequest('/bookings')],
        ['orders', apiRequest('/orders')],
        ['customers', apiRequest('/users/customers')],
        ['staff', apiRequest('/users/staff')],
        ['menuItems', apiRequest('/menu')],
      ];

      const results = await Promise.allSettled(requests.map(([, request]) => request));
      const nextData = {
        bookings: [],
        orders: [],
        customers: [],
        staff: [],
        menuItems: [],
      };
      const nextErrors = [];

      results.forEach((result, index) => {
        const key = requests[index][0];

        if (result.status === 'fulfilled') {
          nextData[key] = result.value;
          return;
        }

        nextErrors.push(`${key}: ${result.reason.message}`);
      });

      setDashboardData(nextData);
      setLoadErrors(nextErrors);
      setIsLoading(false);
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const { bookings, orders, customers, staff, menuItems } = dashboardData;

    return [
      {
        label: 'Prenotazioni',
        value: bookings.length,
        detail: `${buildCount(bookings, (booking) => booking.status === 'in_attesa')} in attesa`,
      },
      {
        label: 'Ordini attivi',
        value: buildCount(orders, (order) =>
          ['in_attesa', 'in_preparazione', 'pronto'].includes(order.status)
        ),
        detail: `${buildCount(orders, (order) => order.status === 'pronto')} pronti`,
      },
      {
        label: 'Clienti',
        value: customers.length,
        detail: 'utenti registrati',
      },
      {
        label: 'Staff',
        value: staff.length,
        detail: 'utenze operative',
      },
      {
        label: 'Piatti',
        value: menuItems.length,
        detail: 'voci menu',
      },
    ];
  }, [dashboardData]);

  const recentBookings = dashboardData.bookings.slice(0, 5);
  const recentOrders = dashboardData.orders.slice(0, 5);

  if (isLoading) {
    return (
      <section className="admin-dashboard-page">
        <p className="admin-dashboard-state">Caricamento dashboard...</p>
      </section>
    );
  }

  return (
    <section className="admin-dashboard-page" aria-labelledby="admin-dashboard-title">
      <div className="admin-dashboard-header">
        <span className="admin-dashboard-kicker">ADMIN</span>
        <h1 id="admin-dashboard-title">Dashboard</h1>
        <p>Riepilogo operativo di prenotazioni, ordini, utenti e menu.</p>
      </div>

      {loadErrors.length > 0 && (
        <div className="admin-dashboard-warning" role="alert">
          <strong>Alcuni dati non sono stati caricati.</strong>
          {loadErrors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}

      <div className="admin-dashboard-stats" aria-label="Statistiche principali">
        {stats.map((stat) => (
          <article className="admin-dashboard-stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </div>

      <div className="admin-dashboard-panels">
        <article className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h2>Prenotazioni recenti</h2>
            <span>{dashboardData.bookings.length} totali</span>
          </div>

          {recentBookings.length === 0 ? (
            <p className="admin-dashboard-empty">Nessuna prenotazione presente.</p>
          ) : (
            <div className="admin-dashboard-list">
              {recentBookings.map((booking) => (
                <div className="admin-dashboard-row" key={booking.id}>
                  <div>
                    <strong>{booking.full_name}</strong>
                    <small>
                      {formatDate(booking.booking_date)} alle {booking.booking_time?.slice(0, 5) || '-'}
                    </small>
                  </div>
                  <span className={`admin-dashboard-pill status-${booking.status}`}>
                    {bookingStatusLabels[booking.status] || booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-header">
            <h2>Ordini recenti</h2>
            <span>{dashboardData.orders.length} totali</span>
          </div>

          {recentOrders.length === 0 ? (
            <p className="admin-dashboard-empty">Nessun ordine presente.</p>
          ) : (
            <div className="admin-dashboard-list">
              {recentOrders.map((order) => (
                <div className="admin-dashboard-row" key={order.id}>
                  <div>
                    <strong>Tavolo {order.table_number || '-'}</strong>
                    <small>
                      Ordine #{order.id} - {formatDateTime(order.created_at)}
                    </small>
                  </div>
                  <span className={`admin-dashboard-pill status-${order.status}`}>
                    {orderStatusLabels[order.status] || order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
};

export default AdminDashboard;
