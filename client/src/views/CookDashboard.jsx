import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import AdminSearchToolbar from '../components/admin/AdminSearchToolbar';
import {
  filterInventoryItems,
  formatQuantity,
  getStockStatus,
  getInventoryCategories,
  getInventoryStats,
  stockFilterOptions,
  stockStatusLabels,
} from '../utils/inventoryUtils';
import {
  categoryLabels,
  getOrderStatusLabel,
  menuCategories,
  sortByMenuCategory,
} from '../utils/menuCatalog';
import { getMenuImage } from '../utils/menuImages';
import { formatEuroPrice } from '../utils/priceFormatter';
import './admin/AdminInventory.css';
import './CookDashboard.css';

const kitchenCategories = ['Tutte', ...menuCategories];
const itemReadyStatuses = ['in_attesa', 'in_preparazione'];
const cookOrderStatuses = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'in_preparazione', label: 'In preparazione' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'annullato', label: 'Annullato' },
];

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
          {cookOrderStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
};

const KitchenMenuRow = ({
  item,
  isEditingAvailability,
  availabilityDraft,
  onAvailabilityDraftChange,
}) => {
  const menuImage = getMenuImage(item.image);
  const isAvailable = item.available !== false;
  const draftAvailable = availabilityDraft ?? isAvailable;

  return (
    <tr className={draftAvailable ? '' : 'unavailable'}>
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
      <td>{formatEuroPrice(item.price)}</td>
      <td>{item.prep_time || 0} min</td>
      <td>
        <span className={`cook-menu-status ${draftAvailable ? 'available' : 'unavailable'}`}>
          {draftAvailable ? 'Disponibile' : 'Non disponibile'}
        </span>
      </td>
      {isEditingAvailability && (
        <td>
          <label className="cook-menu-availability-toggle">
            <input
              type="checkbox"
              checked={draftAvailable}
              onChange={(event) => onAvailabilityDraftChange(item.id, event.target.checked)}
            />
            <span>{draftAvailable ? 'Disponibile' : 'Non disponibile'}</span>
          </label>
        </td>
      )}
    </tr>
  );
};

const KitchenInventoryRow = ({
  item,
  isEditingQuantities,
  quantityDraft,
  onQuantityDraftChange,
}) => {
  const stockStatus = getStockStatus(item);

  return (
    <tr className={`status-${stockStatus}`}>
      <td>
        <strong>{item.name}</strong>
        {item.notes && <small>{item.notes}</small>}
      </td>
      <td>{item.category}</td>
      <td>
        {formatQuantity(item.total_quantity)} {item.unit}
      </td>
      <td>
        {isEditingQuantities ? (
          <input
            className="cook-inventory-quantity-input"
            type="number"
            min="0"
            max={item.total_quantity}
            step="0.01"
            value={quantityDraft ?? item.quantity ?? ''}
            onChange={(event) => onQuantityDraftChange(item.id, event.target.value)}
          />
        ) : (
          `${formatQuantity(item.quantity)} ${item.unit}`
        )}
      </td>
      <td>
        <span className={`admin-inventory-status status-${stockStatus}`}>
          {stockStatusLabels[stockStatus]}
        </span>
      </td>
    </tr>
  );
};

const CookDashboard = ({ mode = 'orders' }) => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [activeTab, setActiveTab] = useState(mode === 'management' ? 'eightySix' : 'orders');
  const [activeCategory, setActiveCategory] = useState('Tutte');
  const [activeInventoryCategory, setActiveInventoryCategory] = useState('Tutti');
  const [activeInventoryStockFilter, setActiveInventoryStockFilter] = useState('Tutti');
  const [selectedMetricKey, setSelectedMetricKey] = useState(null);
  const [selectedMetricDate, setSelectedMetricDate] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [isEditingMenuAvailability, setIsEditingMenuAvailability] = useState(false);
  const [menuAvailabilityDrafts, setMenuAvailabilityDrafts] = useState({});
  const [isEditingInventoryQuantities, setIsEditingInventoryQuantities] = useState(false);
  const [inventoryQuantityDrafts, setInventoryQuantityDrafts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingOrders, setIsDeletingOrders] = useState(false);
  const [isSavingMenuAvailability, setIsSavingMenuAvailability] = useState(false);
  const [isSavingInventoryQuantities, setIsSavingInventoryQuantities] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingOrderItemId, setUpdatingOrderItemId] = useState(null);
  const isManagementMode = mode === 'management';

  const loadKitchenData = async () => {
    setErrorMessage('');

    try {
      const [ordersData, menuData, inventoryData] = await Promise.all([
        apiRequest('/orders'),
        apiRequest('/menu'),
        apiRequest('/inventory'),
      ]);
      setOrders(ordersData);
      setMenuItems(menuData);
      setInventoryItems(inventoryData);
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

  useEffect(() => {
    setActiveTab(mode === 'management' ? 'eightySix' : 'orders');
  }, [mode]);

  const menuItemsById = useMemo(() => {
    return Object.fromEntries(menuItems.map((item) => [item.id, item]));
  }, [menuItems]);

  const readyOrders = orders.filter((order) => order.status === 'pronto');
  const waitingOrders = orders.filter((order) => order.status === 'in_attesa');
  const preparingOrders = orders.filter((order) => order.status === 'in_preparazione');
  const servedOrders = orders.filter((order) => order.status === 'servito');
  const cancelledOrders = orders.filter((order) => order.status === 'annullato');

  const metricCards = [
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

  const inventoryStats = useMemo(() => getInventoryStats(inventoryItems), [inventoryItems]);

  const inventoryCategories = useMemo(() => getInventoryCategories(inventoryItems), [inventoryItems]);

  const visibleInventoryItems = useMemo(() => {
    return filterInventoryItems({
      activeCategory: activeInventoryCategory,
      activeStockFilter: activeInventoryStockFilter,
      items: inventoryItems,
      searchTerm: inventorySearchTerm,
    });
  }, [activeInventoryCategory, activeInventoryStockFilter, inventoryItems, inventorySearchTerm]);

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

  const startMenuAvailabilityEdit = () => {
    setMenuAvailabilityDrafts(
      Object.fromEntries(menuItems.map((item) => [item.id, item.available !== false]))
    );
    setIsEditingMenuAvailability(true);
    setErrorMessage('');
  };

  const cancelMenuAvailabilityEdit = () => {
    setIsEditingMenuAvailability(false);
    setMenuAvailabilityDrafts({});
  };

  const updateMenuAvailabilityDraft = (menuItemId, available) => {
    setMenuAvailabilityDrafts((currentDrafts) => ({
      ...currentDrafts,
      [menuItemId]: available,
    }));
  };

  const saveMenuAvailability = async () => {
    const changedItems = menuItems.filter((item) => {
      const currentAvailable = item.available !== false;
      return menuAvailabilityDrafts[item.id] !== undefined && menuAvailabilityDrafts[item.id] !== currentAvailable;
    });

    setIsSavingMenuAvailability(true);
    setErrorMessage('');

    try {
      const updatedItems = await Promise.all(
        changedItems.map((item) =>
          apiRequest(`/menu/${item.id}/availability`, {
            method: 'PATCH',
            body: JSON.stringify({ available: menuAvailabilityDrafts[item.id] }),
          })
        )
      );

      const updatedItemsById = Object.fromEntries(updatedItems.map((item) => [item.id, item]));

      setMenuItems((currentItems) =>
        currentItems.map((item) => updatedItemsById[item.id] || item)
      );
      cancelMenuAvailabilityEdit();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSavingMenuAvailability(false);
    }
  };

  const startInventoryQuantitiesEdit = () => {
    setInventoryQuantityDrafts(
      Object.fromEntries(inventoryItems.map((item) => [item.id, String(item.quantity ?? '')]))
    );
    setIsEditingInventoryQuantities(true);
    setErrorMessage('');
  };

  const cancelInventoryQuantitiesEdit = () => {
    setIsEditingInventoryQuantities(false);
    setInventoryQuantityDrafts({});
  };

  const updateInventoryQuantityDraft = (itemId, quantity) => {
    setInventoryQuantityDrafts((currentDrafts) => ({
      ...currentDrafts,
      [itemId]: quantity,
    }));
  };

  const saveInventoryQuantities = async () => {
    const changedItems = inventoryItems.filter((item) => {
      const draftQuantity = inventoryQuantityDrafts[item.id];
      return draftQuantity !== undefined && Number(draftQuantity) !== Number(item.quantity);
    });

    setIsSavingInventoryQuantities(true);
    setErrorMessage('');

    try {
      const updatedItems = await Promise.all(
        changedItems.map((item) =>
          apiRequest(`/inventory/${item.id}/quantity`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: Number(inventoryQuantityDrafts[item.id]) }),
          })
        )
      );

      const updatedItemsById = Object.fromEntries(updatedItems.map((item) => [item.id, item]));

      setInventoryItems((currentItems) =>
        currentItems.map((item) => updatedItemsById[item.id] || item)
      );
      cancelInventoryQuantitiesEdit();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSavingInventoryQuantities(false);
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
        <p className="cook-dashboard-state">
          {isManagementMode ? 'Caricamento gestione cucina...' : 'Caricamento ordini...'}
        </p>
      </section>
    );
  }

  return (
    <section className="cook-dashboard-page" aria-labelledby="cook-dashboard-title">
      <div className="cook-dashboard-header">
        <h1 id="cook-dashboard-title">
          {isManagementMode ? 'Gestione Cucina' : 'Pannello Cucina'}
        </h1>
      </div>

      {!isManagementMode && (
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
      )}

      {isManagementMode && (
        <div className="cook-tabs" aria-label="Viste gestione cucina">
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
      )}

      {errorMessage && <p className="cook-dashboard-state error">Errore: {errorMessage}</p>}

      {!isManagementMode && (
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

      {isManagementMode && activeTab === 'eightySix' && (
        <section className="cook-menu-management" aria-labelledby="cook-menu-management-title">
          <div className="cook-menu-management-header">
            <div>
              <h2 id="cook-menu-management-title">Gestione menu</h2>
              <p>{menuItems.length} piatti presenti nel menu.</p>
            </div>
            <strong>{menuItems.filter((item) => item.available === false).length}</strong>
          </div>

          <div className="cook-management-actions">
            {isEditingMenuAvailability ? (
              <>
                <button type="button" onClick={cancelMenuAvailabilityEdit}>
                  Annulla
                </button>
                <button
                  className="primary"
                  type="button"
                  onClick={saveMenuAvailability}
                  disabled={isSavingMenuAvailability}
                >
                  {isSavingMenuAvailability ? 'Salvataggio...' : 'Salva disponibilita'}
                </button>
              </>
            ) : (
              <button className="primary" type="button" onClick={startMenuAvailabilityEdit}>
                Modifica disponibilita
              </button>
            )}
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
                    {isEditingMenuAvailability && <th>Disponibilita</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleMenuItems.map((item) => (
                    <KitchenMenuRow
                      availabilityDraft={menuAvailabilityDrafts[item.id]}
                      isEditingAvailability={isEditingMenuAvailability}
                      item={item}
                      key={item.id}
                      onAvailabilityDraftChange={updateMenuAvailabilityDraft}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {isManagementMode && activeTab === 'inventory' && (
        <section className="cook-inventory-management" aria-labelledby="cook-inventory-title">
          <div className="admin-inventory-header">
            <div>
              <h2 id="cook-inventory-title">Inventario</h2>
              <p>Ingredienti e materie prime collegati al menu del ristorante.</p>
            </div>
          </div>

          <div className="cook-management-actions">
            {isEditingInventoryQuantities ? (
              <>
                <button type="button" onClick={cancelInventoryQuantitiesEdit}>
                  Annulla
                </button>
                <button
                  className="primary"
                  type="button"
                  onClick={saveInventoryQuantities}
                  disabled={isSavingInventoryQuantities}
                >
                  {isSavingInventoryQuantities ? 'Salvataggio...' : 'Salva scorte'}
                </button>
              </>
            ) : (
              <button className="primary" type="button" onClick={startInventoryQuantitiesEdit}>
                Modifica scorte
              </button>
            )}
          </div>

          <div className="admin-inventory-stats" aria-label="Riepilogo inventario">
            {inventoryStats.map((stat) => (
              <article className={`admin-inventory-stat tone-${stat.tone}`} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>

          <div className="admin-inventory-list">
            <AdminSearchToolbar
              id="cook-inventory-search"
              placeholder="Ingrediente, categoria o piatto"
              value={inventorySearchTerm}
              onChange={setInventorySearchTerm}
              resultsCount={visibleInventoryItems.length}
              showResults={false}
            />

            <div className="admin-inventory-filters">
              <div className="admin-inventory-category-filters" aria-label="Categorie inventario">
                {inventoryCategories.map((category) => (
                  <button
                    key={category}
                    className={activeInventoryCategory === category ? 'active' : ''}
                    type="button"
                    onClick={() => setActiveInventoryCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="admin-inventory-status-filters" aria-label="Stato scorte">
                {stockFilterOptions.map((option) => (
                  <button
                    key={option}
                    className={activeInventoryStockFilter === option ? 'active' : ''}
                    type="button"
                    onClick={() => setActiveInventoryStockFilter(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {visibleInventoryItems.length === 0 ? (
              <p className="admin-inventory-state">Nessun ingrediente trovato.</p>
            ) : (
              <div className="admin-inventory-table-wrap">
                <table className="admin-inventory-table">
                  <thead>
                    <tr>
                      <th>Ingrediente</th>
                      <th>Categoria</th>
                      <th>Totale</th>
                      <th>Scorta</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInventoryItems.map((item) => (
                      <KitchenInventoryRow
                        isEditingQuantities={isEditingInventoryQuantities}
                        item={item}
                        key={item.id}
                        onQuantityDraftChange={updateInventoryQuantityDraft}
                        quantityDraft={inventoryQuantityDrafts[item.id]}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {!isManagementMode && selectedMetric && (
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