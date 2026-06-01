import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import {
  categoryLabels,
  getOrderStatusLabel,
  menuCategories,
  orderStatuses,
  sortByMenuCategory,
} from '../utils/menuCatalog';
import { getMenuImage } from '../utils/menuImages';
import './CookDashboard.css';

const kitchenCategories = ['Tutte', ...menuCategories];
const activeStatuses = ['in_attesa', 'in_preparazione'];
const itemReadyStatuses = ['in_attesa', 'in_preparazione'];

const formatTime = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));
};

const getOrderTone = (order) => {
  return `status-${order.status}`;
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

const formatDateKey = (dateValue) => {
  const date = new Date(dateValue);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const formatDateOnly = (dateKey) => {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`));
};

const OrderDishRow = ({
  item,
  menuItemsById,
  variant = 'card',
  canMarkReady = false,
  forcePending = false,
  isUpdating = false,
  onMarkReady,
}) => {
  const menuImage = getMenuImage(menuItemsById[item.menu_item_id]?.image);
  const rowClassName = variant === 'modal' ? 'cook-metric-modal-item' : 'cook-order-item';
  const isReady = item.status === 'ready' && !forcePending;

  return (
    <div className={`${rowClassName} ${isReady ? 'ready' : ''}`}>
      <div className="cook-order-item-image">
        {menuImage ? (
          <img src={menuImage} alt={item.item_name} />
        ) : (
          <span aria-hidden="true">{item.item_name.charAt(0)}</span>
        )}
      </div>
      <strong>{item.quantity}x</strong>
      <div>
        <span>{item.item_name}</span>
        {item.notes && <small>{item.notes}</small>}
      </div>
      {canMarkReady && !isReady && (
        <button
          className="cook-order-item-ready"
          type="button"
          onClick={() => onMarkReady(item.id)}
          disabled={isUpdating}
        >
          {isUpdating ? '...' : 'Pronto'}
        </button>
      )}
    </div>
  );
};

const KitchenOrderCard = ({
  order,
  activeCategory,
  menuItemsById,
  updatingOrderId,
  updatingOrderItemId,
  onStatusChange,
  onItemReady,
}) => {
  const tone = getOrderTone(order);
  const visibleItems =
    activeCategory === 'Tutte'
      ? order.items || []
      : (order.items || []).filter((item) => item.category === activeCategory);
  const shouldResetReadyView =
    itemReadyStatuses.includes(order.status) &&
    (order.items || []).length > 0 &&
    (order.items || []).every((item) => item.status === 'ready');

  return (
    <article className={`cook-order-card ${tone}`}>
      <div className="cook-order-card-header">
        <div>
          <h2>
            Tavolo {order.table_number || '-'}
            <small>Ordine #{order.id}</small>
          </h2>
        </div>
        <div className="cook-order-time">
          <span>Arrivo</span>
          <strong>{formatTime(order.created_at)}</strong>
        </div>
      </div>

      <div className="cook-order-items">
        {visibleItems.length === 0 ? (
          <p className="cook-order-empty">Dettaglio piatti non disponibile.</p>
        ) : (
          [...visibleItems].sort(sortByMenuCategory).map((item) => (
            <OrderDishRow
              item={item}
              key={item.id}
              menuItemsById={menuItemsById}
              canMarkReady={itemReadyStatuses.includes(order.status)}
              forcePending={shouldResetReadyView}
              isUpdating={updatingOrderItemId === item.id}
              onMarkReady={(itemId) => onItemReady(order.id, itemId)}
            />
          ))
        )}
      </div>

      <div className="cook-order-actions">
        <select
          className="cook-order-status"
          value={order.status}
          onChange={(event) => onStatusChange(order.id, event.target.value)}
          disabled={updatingOrderId === order.id}
          aria-label={`Stato ordine tavolo ${order.table_number}`}
        >
          {orderStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
};

const KitchenMenuRow = ({ item, isUpdating, onAvailabilityChange }) => {
  const menuImage = getMenuImage(item.image);
  const isAvailable = item.available !== false;

  return (
    <tr className={isAvailable ? '' : 'unavailable'}>
      <td>
        <div className="cook-menu-dish">
          <div className="cook-menu-dish-image">
            {menuImage ? (
              <img src={menuImage} alt={item.name} />
            ) : (
              <span aria-hidden="true">{item.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <strong>{item.name}</strong>
            <small>{item.description || 'Descrizione non disponibile.'}</small>
          </div>
        </div>
      </td>
      <td>{categoryLabels[item.category] || item.category}</td>
      <td>EUR {Number(item.price).toFixed(2)}</td>
      <td>{item.prep_time || 0} min</td>
      <td>
        <span className={`cook-menu-status ${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? 'Disponibile' : 'Non disponibile'}
        </span>
      </td>
      <td>
        <button
          className="cook-menu-availability"
          type="button"
          onClick={() => onAvailabilityChange(item.id, !isAvailable)}
          disabled={isUpdating}
        >
          {isUpdating ? 'Aggiorno...' : isAvailable ? 'Rendi non disponibile' : 'Rendi disponibile'}
        </button>
      </td>
    </tr>
  );
};

const CookDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [activeCategory, setActiveCategory] = useState('Tutte');
  const [selectedMetricKey, setSelectedMetricKey] = useState(null);
  const [selectedMetricDate, setSelectedMetricDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingOrders, setIsDeletingOrders] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingOrderItemId, setUpdatingOrderItemId] = useState(null);
  const [updatingMenuItemId, setUpdatingMenuItemId] = useState(null);

  const loadKitchenData = async () => {
    setErrorMessage('');

    try {
      const [ordersData, menuData] = await Promise.all([
        apiRequest('/orders'),
        apiRequest('/menu'),
      ]);
      setOrders(ordersData);
      setMenuItems(menuData);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKitchenData();

    const intervalId = window.setInterval(loadKitchenData, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setSelectedMetricDate('');
  }, [selectedMetricKey]);

  const menuItemsById = useMemo(() => {
    return Object.fromEntries(menuItems.map((item) => [item.id, item]));
  }, [menuItems]);

  const activeOrders = orders.filter((order) => activeStatuses.includes(order.status));
  const readyOrders = orders.filter((order) => order.status === 'pronto');
  const waitingOrders = orders.filter((order) => order.status === 'in_attesa');
  const preparingOrders = orders.filter((order) => order.status === 'in_preparazione');
  const servedOrders = orders.filter((order) => order.status === 'servito');
  const cancelledOrders = orders.filter((order) => order.status === 'annullato');

  const metricCards = [
    {
      key: 'active',
      tone: 'active',
      label: 'Attivi',
      value: activeOrders.length,
      orders: activeOrders,
    },
    {
      key: 'waiting',
      tone: 'wait',
      label: 'In attesa',
      value: waitingOrders.length,
      orders: waitingOrders,
    },
    {
      key: 'preparing',
      tone: 'prep',
      label: 'Preparazione',
      value: preparingOrders.length,
      orders: preparingOrders,
    },
    {
      key: 'ready',
      tone: 'ready',
      label: 'Pronti',
      value: readyOrders.length,
      orders: readyOrders,
    },
    {
      key: 'served',
      tone: 'served',
      label: 'Serviti',
      value: servedOrders.length,
      orders: servedOrders,
    },
    {
      key: 'cancelled',
      tone: 'cancelled',
      label: 'Annullati',
      value: cancelledOrders.length,
      orders: cancelledOrders,
    },
  ];

  const selectedMetric = metricCards.find((metric) => metric.key === selectedMetricKey);
  const canCleanSelectedMetric = ['served', 'cancelled'].includes(selectedMetricKey);
  const selectedMetricDateOptions = selectedMetric
    ? [...new Set(selectedMetric.orders.map((order) => formatDateKey(order.created_at)))].sort(
        (currentDate, nextDate) => nextDate.localeCompare(currentDate)
      )
    : [];
  const selectedMetricOrders = selectedMetric
    ? selectedMetric.orders.filter((order) => {
        return !selectedMetricDate || formatDateKey(order.created_at) === selectedMetricDate;
      })
    : [];

  const visibleOrders = orders
    .filter((order) => order.status !== 'servito' && order.status !== 'annullato')
    .filter((order) => {
      if (activeCategory === 'Tutte') {
        return true;
      }

      return (order.items || []).some((item) => item.category === activeCategory);
    });

  const visibleMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => activeCategory === 'Tutte' || item.category === activeCategory)
      .sort(sortByMenuCategory);
  }, [activeCategory, menuItems]);

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setErrorMessage('');

    try {
      const updatedOrder = await apiRequest(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      const normalizedOrder =
        status === 'in_attesa'
          ? {
              ...updatedOrder,
              items: (updatedOrder.items || []).map((item) => ({
                ...item,
                status: 'pending',
              })),
            }
          : updatedOrder;

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === orderId ? normalizedOrder : order))
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const markOrderItemReady = async (orderId, itemId) => {
    setUpdatingOrderItemId(itemId);
    setErrorMessage('');

    try {
      const updatedOrder = await apiRequest(`/orders/${orderId}/items/${itemId}/ready`, {
        method: 'PATCH',
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === orderId ? updatedOrder : order))
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingOrderItemId(null);
    }
  };

  const updateMenuAvailability = async (menuItemId, available) => {
    setUpdatingMenuItemId(menuItemId);
    setErrorMessage('');

    try {
      const updatedMenuItem = await apiRequest(`/menu/${menuItemId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ available }),
      });

      setMenuItems((currentItems) =>
        currentItems.map((item) => (item.id === menuItemId ? updatedMenuItem : item))
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingMenuItemId(null);
    }
  };

  const deleteSelectedMetricOrders = async () => {
    if (!selectedMetric || !canCleanSelectedMetric || selectedMetricOrders.length === 0) {
      return;
    }

    setIsDeletingOrders(true);
    setErrorMessage('');

    try {
      const status = selectedMetric.key === 'served' ? 'servito' : 'annullato';
      const queryParams = new URLSearchParams({ status });

      if (selectedMetricDate) {
        queryParams.set('date', selectedMetricDate);
      }

      await apiRequest(`/orders?${queryParams.toString()}`, {
        method: 'DELETE',
      });

      setOrders((currentOrders) =>
        currentOrders.filter((order) => {
          if (order.status !== status) {
            return true;
          }

          if (!selectedMetricDate) {
            return false;
          }

          return formatDateKey(order.created_at) !== selectedMetricDate;
        })
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsDeletingOrders(false);
    }
  };

  if (isLoading) {
    return (
      <section className="cook-dashboard-page">
        <p className="cook-dashboard-state">Caricamento ordini...</p>
      </section>
    );
  }

  return (
    <section className="cook-dashboard-page" aria-labelledby="cook-dashboard-title">
      <div className="cook-dashboard-header">
        <h1 id="cook-dashboard-title">Pannello Cucina</h1>
      </div>

      <div className="cook-metrics" aria-label="Riepilogo cucina">
        {metricCards.map((metric) => (
          <button
            className={`cook-metric-card ${metric.tone}`}
            key={metric.key}
            type="button"
            onClick={() => setSelectedMetricKey(metric.key)}
            aria-haspopup="dialog"
          >
            <span className={`cook-metric-icon ${metric.tone}`}>{metric.label}</span>
            <strong>{metric.value}</strong>
          </button>
        ))}
      </div>

      <div className="cook-tabs" aria-label="Viste cucina">
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('orders')}
        >
          Ordini
        </button>
        <button
          className={activeTab === 'eightySix' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('eightySix')}
        >
          Gestione menu
        </button>
        <button
          className={activeTab === 'inventory' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('inventory')}
        >
          Inventario
        </button>
      </div>

      {errorMessage && <p className="cook-dashboard-state error">Errore: {errorMessage}</p>}

      {activeTab === 'orders' && (
        <>
          <div className="cook-filters" aria-label="Filtri categoria">
            {kitchenCategories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>

          {visibleOrders.length === 0 ? (
            <p className="cook-dashboard-state">Nessun ordine da gestire.</p>
          ) : (
            <div className="cook-orders-grid">
              {visibleOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  activeCategory={activeCategory}
                  menuItemsById={menuItemsById}
                  updatingOrderId={updatingOrderId}
                  updatingOrderItemId={updatingOrderItemId}
                  onStatusChange={updateOrderStatus}
                  onItemReady={markOrderItemReady}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'eightySix' && (
        <section className="cook-menu-management" aria-labelledby="cook-menu-management-title">
          <div className="cook-menu-management-header">
            <div>
              <h2 id="cook-menu-management-title">Gestione menu</h2>
              <p>{menuItems.length} piatti presenti nel menu.</p>
            </div>
            <strong>{menuItems.filter((item) => item.available === false).length}</strong>
          </div>

          <div className="cook-filters" aria-label="Filtri categoria menu">
            {kitchenCategories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>

          {visibleMenuItems.length === 0 ? (
            <p className="cook-dashboard-state">Nessun piatto trovato.</p>
          ) : (
            <div className="cook-menu-table-wrap">
              <table className="cook-menu-table">
                <thead>
                  <tr>
                    <th>Piatto</th>
                    <th>Categoria</th>
                    <th>Prezzo</th>
                    <th>Tempo</th>
                    <th>Stato</th>
                    <th>Disponibilita'</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMenuItems.map((item) => (
                    <KitchenMenuRow
                      item={item}
                      key={item.id}
                      isUpdating={updatingMenuItemId === item.id}
                      onAvailabilityChange={updateMenuAvailability}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'inventory' && (
        <div className="cook-placeholder-panel">
          <h2>Inventario</h2>
          <p>Qui potrai controllare scorte, ingredienti critici e prodotti da riordinare.</p>
        </div>
      )}

      {selectedMetric && (
        <div className="cook-metric-backdrop" role="presentation">
          <div
            className="cook-metric-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cook-metric-modal-title"
          >
            <div className="cook-metric-modal-header">
              <div>
                <h2 id="cook-metric-modal-title">{selectedMetric.label}</h2>
              </div>
              <button type="button" onClick={() => setSelectedMetricKey(null)}>
                Chiudi
              </button>
            </div>

            <div className="cook-metric-modal-total">
              <div className="cook-metric-modal-total-copy">
                <strong>{selectedMetricOrders.length}</strong>
                <span>
                  {selectedMetricDate
                    ? `ordini del ${formatDateOnly(selectedMetricDate)}`
                    : 'ordini in questa sezione'}
                </span>
              </div>

              {canCleanSelectedMetric && selectedMetric.orders.length > 0 && (
                <div className="cook-metric-modal-tools">
                  <label>
                    Data
                    <select
                      value={selectedMetricDate}
                      onChange={(event) => setSelectedMetricDate(event.target.value)}
                    >
                      <option value="">Tutte le date</option>
                      {selectedMetricDateOptions.map((dateKey) => (
                        <option key={dateKey} value={dateKey}>
                          {formatDateOnly(dateKey)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={deleteSelectedMetricOrders}
                    disabled={isDeletingOrders || selectedMetricOrders.length === 0}
                  >
                    {isDeletingOrders ? 'Cancello...' : 'Cancella ordini'}
                  </button>
                </div>
              )}
            </div>

            {selectedMetricOrders.length === 0 ? (
              <p className="cook-metric-modal-empty">Nessun ordine presente.</p>
            ) : (
              <div className="cook-metric-modal-list">
                {selectedMetricOrders.map((order) => (
                  <article className="cook-metric-modal-order" key={order.id}>
                    <div className="cook-metric-modal-order-head">
                      <div>
                        <h3>
                          Tavolo {order.table_number || '-'}
                          <span>Ordine #{order.id}</span>
                          <span>Creato {formatDateTime(order.created_at)}</span>
                        </h3>
                      </div>
                      <div>
                        <span>{getOrderStatusLabel(order.status)}</span>
                      </div>
                    </div>

                    <div className="cook-metric-modal-items">
                      {[...(order.items || [])].sort(sortByMenuCategory).map((item) => (
                        <OrderDishRow
                          item={item}
                          key={item.id}
                          menuItemsById={menuItemsById}
                          variant="modal"
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CookDashboard;
