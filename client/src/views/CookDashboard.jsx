import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import './CookDashboard.css';

const orderStatuses = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'in_preparazione', label: 'In preparazione' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'servito', label: 'Servito' },
  { value: 'annullato', label: 'Annullato' },
];

const categoryLabels = {
  Antipasti: 'Antipasti',
  Primi: 'Pasta',
  Secondi: 'Griglia',
  Dolci: 'Dolci',
  Vini: 'Bar',
};

const activeStatuses = ['in_attesa', 'in_preparazione'];

const formatElapsedTime = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  const createdAt = new Date(dateValue).getTime();
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - createdAt) / 60000));

  return `${elapsedMinutes} min`;
};

const getElapsedMinutes = (dateValue) => {
  if (!dateValue) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - new Date(dateValue).getTime()) / 60000));
};

const getOrderTone = (order) => {
  if (order.status === 'pronto') {
    return 'ready';
  }

  if (getElapsedMinutes(order.created_at) >= 30) {
    return 'rush';
  }

  if (order.status === 'in_preparazione') {
    return 'preparing';
  }

  return 'waiting';
};

const getNextStatus = (status) => {
  if (status === 'in_attesa') {
    return 'in_preparazione';
  }

  if (status === 'in_preparazione') {
    return 'pronto';
  }

  if (status === 'pronto') {
    return 'servito';
  }

  return status;
};

const getStatusLabel = (status) => {
  return orderStatuses.find((item) => item.value === status)?.label || status;
};

const CookDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [activeCategory, setActiveCategory] = useState('Tutte');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = async () => {
    setErrorMessage('');

    try {
      const data = await apiRequest('/orders');
      setOrders(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const categories = useMemo(() => {
    const itemCategories = orders.flatMap((order) =>
      (order.items || []).map((item) => item.category).filter(Boolean)
    );
    const uniqueCategories = [...new Set(itemCategories)];

    return ['Tutte', ...uniqueCategories];
  }, [orders]);

  const activeOrders = orders.filter((order) => activeStatuses.includes(order.status));
  const readyOrders = orders.filter((order) => order.status === 'pronto');
  const waitingOrders = orders.filter((order) => order.status === 'in_attesa');
  const preparingOrders = orders.filter((order) => order.status === 'in_preparazione');
  const averageTime = activeOrders.length
    ? Math.round(
        activeOrders.reduce((total, order) => total + getElapsedMinutes(order.created_at), 0) /
          activeOrders.length
      )
    : null;

  const visibleOrders = orders
    .filter((order) => order.status !== 'servito' && order.status !== 'annullato')
    .filter((order) => {
      if (activeCategory === 'Tutte') {
        return true;
      }

      return (order.items || []).some((item) => item.category === activeCategory);
    });

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setErrorMessage('');

    try {
      const updatedOrder = await apiRequest(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === orderId ? updatedOrder : order))
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingOrderId(null);
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
        <h1 id="cook-dashboard-title">Kitchen Display System</h1>
      </div>

      <div className="cook-metrics" aria-label="Riepilogo cucina">
        <div className="cook-metric-card">
          <span className="cook-metric-icon hot">01</span>
          <strong>{activeOrders.length}</strong>
          <small>Ordini attivi</small>
        </div>
        <div className="cook-metric-card">
          <span className="cook-metric-icon wait">02</span>
          <strong>{waitingOrders.length}</strong>
          <small>In attesa</small>
        </div>
        <div className="cook-metric-card">
          <span className="cook-metric-icon prep">03</span>
          <strong>{preparingOrders.length}</strong>
          <small>In preparazione</small>
        </div>
        <div className="cook-metric-card">
          <span className="cook-metric-icon ready">04</span>
          <strong>{readyOrders.length}</strong>
          <small>Pronti</small>
        </div>
        <div className="cook-metric-card">
          <span className="cook-metric-icon time">05</span>
          <strong>{averageTime === null ? '-' : averageTime}</strong>
          <small>Tempo medio</small>
        </div>
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
          Lista 86'd
        </button>
        <button
          className={activeTab === 'inventory' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('inventory')}
        >
          Inventario
          <span>{readyOrders.length}</span>
        </button>
      </div>

      {errorMessage && <p className="cook-dashboard-state error">Errore: {errorMessage}</p>}

      {activeTab === 'orders' && (
        <>
          <div className="cook-filters" aria-label="Filtri categoria">
            {categories.map((category) => (
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
              {visibleOrders.map((order) => {
                const tone = getOrderTone(order);
                const nextStatus = getNextStatus(order.status);
                const canAdvance = nextStatus !== order.status;

                return (
                  <article className={`cook-order-card ${tone}`} key={order.id}>
                    <div className="cook-order-card-header">
                      <div>
                        <h2>Tavolo {order.table_number || '-'}</h2>
                        <small>Ordine #{order.id}</small>
                      </div>
                      <div className="cook-order-time">
                        <strong>{formatElapsedTime(order.created_at)}</strong>
                        <span>{getStatusLabel(order.status)}</span>
                      </div>
                    </div>

                    <div className="cook-order-items">
                      {(order.items || []).length === 0 ? (
                        <p className="cook-order-empty">Dettaglio piatti non disponibile.</p>
                      ) : (
                        order.items.map((item) => (
                          <div className="cook-order-item" key={item.id}>
                            <strong>{item.quantity}x</strong>
                            <div>
                              <span>{item.item_name}</span>
                              {item.notes && <small>{item.notes}</small>}
                            </div>
                            <em>{item.status}</em>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="cook-order-actions">
                      <select
                        className="cook-order-status"
                        value={order.status}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                        disabled={updatingOrderId === order.id}
                        aria-label={`Stato ordine tavolo ${order.table_number}`}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>

                      {canAdvance && (
                        <button
                          className="cook-order-next"
                          type="button"
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                          disabled={updatingOrderId === order.id}
                        >
                          {updatingOrderId === order.id ? 'Aggiorno...' : getStatusLabel(nextStatus)}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'eightySix' && (
        <div className="cook-placeholder-panel">
          <h2>Lista 86'd</h2>
          <p>Qui potrai segnare piatti non disponibili e bloccarli dal menu operativo.</p>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="cook-placeholder-panel">
          <h2>Inventario</h2>
          <p>Qui potrai controllare scorte, ingredienti critici e prodotti da riordinare.</p>
        </div>
      )}
    </section>
  );
};

export default CookDashboard;
