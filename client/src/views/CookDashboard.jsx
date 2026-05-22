import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import './CookDashboard.css';

const orderStatuses = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'in_preparazione', label: 'In preparazione' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'servito', label: 'Servito' },
  { value: 'annullato', label: 'Annullato' },
];

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));
};

const CookDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await apiRequest('/orders');
        setOrders(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

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
        <span className="cook-dashboard-kicker">CUCINA</span>
        <h1 id="cook-dashboard-title">Area Cuoco</h1>
        <p>{orders.length} ordini presenti nel sistema.</p>
      </div>

      {errorMessage && <p className="cook-dashboard-state error">Errore: {errorMessage}</p>}

      {orders.length === 0 ? (
        <p className="cook-dashboard-state">Nessun ordine da gestire.</p>
      ) : (
        <div className="cook-orders-table-wrap">
          <table className="cook-orders-table">
            <thead>
              <tr>
                <th>Tavolo</th>
                <th>Creato il</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.table_number}</td>
                  <td>{formatDateTime(order.created_at)}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default CookDashboard;
