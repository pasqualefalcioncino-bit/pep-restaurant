import { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  CalendarDays,
  ClipboardList,
  CookingPot,
  PackageSearch,
  TableProperties,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { getStockStatus, stockStatusLabels } from '../../utils/inventoryUtils';
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

const tableStatusSingularLabels = {
  libero: 'Libero',
  occupato: 'Occupato',
  prenotato: 'Prenotato',
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
    inventoryItems: [],
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedTableStatus, setSelectedTableStatus] = useState(null);
  const [selectedInventoryStatus, setSelectedInventoryStatus] = useState(null);
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
        ['inventoryItems', apiRequest('/inventory')],
      ];

      const results = await Promise.allSettled(requests.map(([, request]) => request));
      const nextData = {
        bookings: [],
        orders: [],
        customers: [],
        staff: [],
        menuItems: [],
        tables: [],
        inventoryItems: [],
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

  const todayBookings = useMemo(() => {
    const todayKey = getDateKey(new Date());

    return dashboardData.bookings.filter((booking) => {
      return getDateKey(booking.booking_date) === todayKey;
    });
  }, [dashboardData.bookings]);

  const stats = useMemo(() => {
    const { orders, customers, staff, menuItems, tables } = dashboardData;

    return [
      {
        label: 'Prenotazioni',
        value: todayBookings.length,
        targetPage: 'admin-prenotazioni',
        icon: CalendarDays,
      },
      {
        label: 'Ordini attivi',
        value: buildCount(orders, (order) =>
          ['in_attesa', 'in_preparazione', 'pronto'].includes(order.status)
        ),
        icon: ClipboardList,
      },
      {
        label: 'Clienti',
        value: customers.length,
        targetPage: 'admin-clienti',
        icon: Users,
      },
      {
        label: 'Staff',
        value: staff.length,
        targetPage: 'admin-staff',
        icon: CookingPot,
      },
      {
        label: 'Piatti',
        value: menuItems.length,
        targetPage: 'admin-menu',
        icon: UtensilsCrossed,
      },
      {
        label: 'Tavoli liberi',
        value: buildCount(tables, (table) => table.status === 'libero'),
        targetPage: 'admin-tavoli',
        icon: Armchair,
      },
    ];
  }, [dashboardData, todayBookings.length]);

  const activeOrders = useMemo(() => {
    return dashboardData.orders.filter((order) => !['servito', 'annullato'].includes(order.status));
  }, [dashboardData.orders]);
  const menuItemsById = useMemo(() => {
    return Object.fromEntries(dashboardData.menuItems.map((item) => [item.id, item]));
  }, [dashboardData.menuItems]);
  const selectedOrder = useMemo(() => {
    return activeOrders.find((order) => order.id === selectedOrderId) || null;
  }, [activeOrders, selectedOrderId]);
  const recentBookings = todayBookings;
  const recentOrders = activeOrders.slice(0, 5);
  const tableStats = useMemo(() => {
    return Object.entries(tableStatusLabels).map(([status, label]) => ({
      status,
      label,
      count: buildCount(dashboardData.tables, (table) => table.status === status),
    }));
  }, [dashboardData.tables]);
  const inventoryStats = useMemo(() => {
    return Object.entries(stockStatusLabels).map(([status, label]) => ({
      status,
      label,
      count: buildCount(dashboardData.inventoryItems, (item) => getStockStatus(item) === status),
    }));
  }, [dashboardData.inventoryItems]);
  const selectedTableStatusLabel = selectedTableStatus
    ? tableStatusLabels[selectedTableStatus]
    : '';
  const selectedTables = useMemo(() => {
    return dashboardData.tables
      .filter((table) => table.status === selectedTableStatus)
      .sort((firstTable, secondTable) => firstTable.table_number - secondTable.table_number);
  }, [dashboardData.tables, selectedTableStatus]);
  const selectedInventoryStatusLabel = selectedInventoryStatus
    ? stockStatusLabels[selectedInventoryStatus]
    : '';
  const selectedInventoryItems = useMemo(() => {
    return dashboardData.inventoryItems
      .filter((item) => getStockStatus(item) === selectedInventoryStatus)
      .sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name, 'it'));
  }, [dashboardData.inventoryItems, selectedInventoryStatus]);

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
        <p>Riepilogo operativo di prenotazioni, ordini, tavoli, inventario, utenti e menu.</p>
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
          const StatIcon = stat.icon;
          const content = (
            <>
              <span>
                <StatIcon size={17} aria-hidden="true" />
                {stat.label}
              </span>
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
            <h2>
              <CalendarDays size={18} aria-hidden="true" />
              Prenotazioni di oggi
            </h2>
            <span>{todayBookings.length} oggi</span>
          </div>

          {recentBookings.length === 0 ? (
            <p className="admin-dashboard-empty">Nessuna prenotazione per oggi.</p>
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
            <h2>
              <ClipboardList size={18} aria-hidden="true" />
              Ordini recenti
            </h2>
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
            <h2>
              <TableProperties size={18} aria-hidden="true" />
              Stato sala
            </h2>
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
                  <button
                    className={`admin-dashboard-table-stat status-${tableStat.status}`}
                    key={tableStat.status}
                    type="button"
                    onClick={() => setSelectedTableStatus(tableStat.status)}
                  >
                    <span>{tableStat.label}</span>
                    <strong>{tableStat.count}</strong>
                  </button>
                ))}
              </div>
            </>
          )}
        </article>

        <article className="admin-dashboard-panel admin-dashboard-inventory-panel">
          <div className="admin-dashboard-panel-header">
            <h2>
              <PackageSearch size={18} aria-hidden="true" />
              Scorte inventario
            </h2>
            <button type="button" onClick={() => onNavigate?.('admin-inventario')}>
              Gestisci inventario
            </button>
          </div>

          {dashboardData.inventoryItems.length === 0 ? (
            <p className="admin-dashboard-empty">Nessun ingrediente configurato.</p>
          ) : (
            <>
              <div className="admin-dashboard-inventory-stats">
                {inventoryStats.map((inventoryStat) => (
                  <button
                    className={`admin-dashboard-inventory-stat status-${inventoryStat.status}`}
                    key={inventoryStat.status}
                    type="button"
                    onClick={() => setSelectedInventoryStatus(inventoryStat.status)}
                  >
                    <span>{inventoryStat.label}</span>
                    <strong>{inventoryStat.count}</strong>
                  </button>
                ))}
              </div>
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
              <button type="button" onClick={() => setSelectedOrderId(null)} aria-label="Chiudi">
                <X size={17} aria-hidden="true" />
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

      {selectedTableStatus && (
        <div className="admin-dashboard-modal-backdrop" role="presentation">
          <div
            className="admin-dashboard-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-dashboard-tables-title"
          >
            <div className="admin-dashboard-modal-header">
              <div>
                <span>Stato sala</span>
                <h2 id="admin-dashboard-tables-title">Tavoli {selectedTableStatusLabel}</h2>
              </div>
              <button type="button" onClick={() => setSelectedTableStatus(null)} aria-label="Chiudi">
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            {selectedTables.length === 0 ? (
              <p className="admin-dashboard-empty">Nessun tavolo in questo stato.</p>
            ) : (
              <div className="admin-dashboard-detail-list">
                {selectedTables.map((table) => (
                  <div className={`admin-dashboard-detail-row status-${table.status}`} key={table.id}>
                    <div>
                      <strong>Tavolo {table.table_number}</strong>
                      <small>
                        {table.seats} posti{table.area ? ` - ${table.area}` : ''}
                      </small>
                    </div>
                    <span className={`admin-dashboard-table-chip status-${table.status}`}>
                      {tableStatusSingularLabels[table.status] || table.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedInventoryStatus && (
        <div className="admin-dashboard-modal-backdrop" role="presentation">
          <div
            className="admin-dashboard-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-dashboard-inventory-title"
          >
            <div className="admin-dashboard-modal-header">
              <div>
                <span>Scorte inventario</span>
                <h2 id="admin-dashboard-inventory-title">{selectedInventoryStatusLabel}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInventoryStatus(null)}
                aria-label="Chiudi"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            {selectedInventoryItems.length === 0 ? (
              <p className="admin-dashboard-empty">Nessun ingrediente in questa sezione.</p>
            ) : (
              <div className="admin-dashboard-detail-list">
                {selectedInventoryItems.map((item) => (
                  <div
                    className={`admin-dashboard-detail-row status-${getStockStatus(item)}`}
                    key={item.id}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.category}</small>
                    </div>
                    <div className="admin-dashboard-detail-quantity">
                      <span>
                        {item.quantity} / {item.total_quantity} {item.unit}
                      </span>
                      <small>Scorta attuale / totale</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
