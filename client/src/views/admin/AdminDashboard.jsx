import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import { getOrderStatusLabel, sortByMenuCategory } from '../../utils/menuCatalog';
import { getMenuImage } from '../../utils/menuImages';
import './AdminDashboard.css';

const bookingStatusLabels = {
  in_attesa: 'In attesa',
  confermata: 'Confermata',
  annullata: 'Annullata',
};

const tableStatusLabels = {
  libero: 'Liberi',
  occupato: 'Occupati',
  prenotato: 'Prenotati',
  in_pulizia: 'In pulizia',
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

const AdminDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState({
    bookings: [],
    orders: [],
    customers: [],
    staff: [],
    menuItems: [],
    tables: [],
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
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
        ['tables', apiRequest('/tables')],
      ];

      const results = await Promise.allSettled(requests.map(([, request]) => request));
      const nextData = {
        bookings: [],
        orders: [],
        customers: [],
        staff: [],
        menuItems: [],
        tables: [],
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

    const intervalId = window.setInterval(loadDashboard, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const stats = useMemo(() => {
    const { bookings, orders, customers, staff, menuItems, tables } = dashboardData;

    return [
      {
        label: 'Prenotazioni',
        value: bookings.length,
        targetPage: 'admin-prenotazioni',
      },
      {
        label: 'Ordini attivi',
        value: buildCount(orders, (order) =>
          ['in_attesa', 'in_preparazione', 'pronto'].includes(order.status)
        ),
      },
      {
        label: 'Clienti',
        value: customers.length,
        targetPage: 'admin-clienti',
      },
      {
        label: 'Staff',
        value: staff.length,
        targetPage: 'admin-staff',
      },
      {
        label: 'Piatti',
        value: menuItems.length,
        targetPage: 'admin-menu',
      },
      {
        label: 'Tavoli liberi',
        value: buildCount(tables, (table) => table.status === 'libero'),
        targetPage: 'admin-tavoli',
      },
    ];
  }, [dashboardData]);

  const activeOrders = useMemo(() => {
    return dashboardData.orders.filter((order) => !['servito', 'annullato'].includes(order.status));
  }, [dashboardData.orders]);
  const menuItemsById = useMemo(() => {
    return Object.fromEntries(dashboardData.menuItems.map((item) => [item.id, item]));
  }, [dashboardData.menuItems]);
  const selectedOrder = useMemo(() => {
    return activeOrders.find((order) => order.id === selectedOrderId) || null;
  }, [activeOrders, selectedOrderId]);
  const recentBookings = dashboardData.bookings.slice(0, 5);
  const recentOrders = activeOrders.slice(0, 5);
  const tableStats = useMemo(() => {
    return Object.entries(tableStatusLabels).map(([status, label]) => ({
      status,
      label,
      count: buildCount(dashboardData.tables, (table) => table.status === status),
    }));
  }, [dashboardData.tables]);
  const busyTables = useMemo(() => {
    return dashboardData.tables
      .filter((table) => table.status !== 'libero')
      .sort((firstTable, secondTable) => firstTable.table_number - secondTable.table_number)
      .slice(0, 6);
  }, [dashboardData.tables]);

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
        <h1 id="admin-dashboard-title">Dashboard</h1>
        <p>Riepilogo operativo di prenotazioni, ordini, tavoli, utenti e menu.</p>
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
        {stats.map((stat) => {
          const content = (
            <>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </>
          );

          if (stat.targetPage && onNavigate) {
            return (
              <button
                className="admin-dashboard-stat clickable"
                key={stat.label}
                type="button"
                onClick={() => onNavigate(stat.targetPage)}
              >
                {content}
              </button>
            );
          }

          return (
            <article className="admin-dashboard-stat" key={stat.label}>
              {content}
            </article>
          );
        })}
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
            <span>{activeOrders.length} attivi</span>
          </div>

          {recentOrders.length === 0 ? (
            <p className="admin-dashboard-empty">Nessun ordine presente.</p>
          ) : (
            <div className="admin-dashboard-list">
              {recentOrders.map((order) => (
                <button
                  className={`admin-dashboard-row admin-dashboard-order-row status-${order.status}`}
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div>
                    <strong>Tavolo {order.table_number || '-'}</strong>
                    <small>
                      Ordine #{order.id} - {formatDateTime(order.created_at)}
                    </small>
                  </div>
                  <span className={`admin-dashboard-pill status-${order.status}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="admin-dashboard-panel admin-dashboard-tables-panel">
          <div className="admin-dashboard-panel-header">
            <h2>Stato sala</h2>
            <button type="button" onClick={() => onNavigate?.('admin-tavoli')}>
              Gestisci tavoli
            </button>
          </div>

          {dashboardData.tables.length === 0 ? (
            <p className="admin-dashboard-empty">Nessun tavolo configurato.</p>
          ) : (
            <>
              <div className="admin-dashboard-table-stats">
                {tableStats.map((tableStat) => (
                  <div className={`admin-dashboard-table-stat status-${tableStat.status}`} key={tableStat.status}>
                    <span>{tableStat.label}</span>
                    <strong>{tableStat.count}</strong>
                  </div>
                ))}
              </div>

              {busyTables.length > 0 && (
                <div className="admin-dashboard-busy-tables">
                  <span>Tavoli da seguire</span>
                  <div>
                    {busyTables.map((table) => (
                      <button
                        className={`admin-dashboard-table-chip status-${table.status}`}
                        key={table.id}
                        type="button"
                        onClick={() => onNavigate?.('admin-tavoli')}
                      >
                        Tavolo {table.table_number} · {tableStatusLabels[table.status] || table.status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </article>
      </div>

      {selectedOrder && (
        <div className="admin-dashboard-modal-backdrop" role="presentation">
          <div
            className="admin-dashboard-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-dashboard-order-title"
          >
            <div className="admin-dashboard-modal-header">
              <div>
                <span>Riepilogo ordine</span>
                <h2 id="admin-dashboard-order-title">Ordine #{selectedOrder.id}</h2>
              </div>
              <button type="button" onClick={() => setSelectedOrderId(null)}>
                Chiudi
              </button>
            </div>

            <div className="admin-dashboard-order-meta">
              <div>
                <span>Tavolo</span>
                <strong>{selectedOrder.table_number || '-'}</strong>
              </div>
              <div>
                <span>Creato</span>
                <strong>{formatDateTime(selectedOrder.created_at)}</strong>
              </div>
              <div>
                <span>Stato</span>
                <strong>
                  <span className={`admin-dashboard-pill status-${selectedOrder.status}`}>
                    {getOrderStatusLabel(selectedOrder.status)}
                  </span>
                </strong>
              </div>
            </div>

            <div className="admin-dashboard-order-items">
              {(selectedOrder.items || []).length === 0 ? (
                <p className="admin-dashboard-empty">Nessun dettaglio piatto disponibile.</p>
              ) : (
                [...selectedOrder.items].sort(sortByMenuCategory).map((item) => {
                  const menuItem = menuItemsById[item.menu_item_id];
                  const itemImage = getMenuImage(menuItem?.image);

                  return (
                    <div
                      className={`admin-dashboard-order-item ${
                        item.status === 'ready' ? 'ready' : ''
                      }`}
                      key={item.id}
                    >
                      <div className="admin-dashboard-order-item-image">
                        {itemImage ? (
                          <img src={itemImage} alt={item.item_name} />
                        ) : (
                          <span aria-hidden="true">{item.item_name.charAt(0)}</span>
                        )}
                      </div>
                      <strong>{item.quantity}x</strong>
                      <div>
                        <span>{item.item_name}</span>
                        <small>{item.category || 'Senza categoria'}</small>
                        {item.notes && <small>Note: {item.notes}</small>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
