import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import './WaiterOrders.css';

const statusLabels = {
  in_attesa: 'In attesa',
  in_preparazione: 'In preparazione',
  pronto: 'Pronto',
  servito: 'Servito',
  annullato: 'Annullato',
};

const formatTime = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));
};

const WaiterOrders = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ordersErrorMessage, setOrdersErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [menuResult, ordersResult] = await Promise.allSettled([
        apiRequest('/menu'),
        apiRequest('/orders'),
      ]);

      if (menuResult.status === 'fulfilled') {
        setMenuItems(menuResult.value);
      } else {
        setErrorMessage(menuResult.reason.message);
      }

      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value);
      } else {
        setOrdersErrorMessage(ordersResult.reason.message);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];

    return ['Tutti', ...uniqueCategories];
  }, [menuItems]);

  const visibleMenuItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'Tutti' || item.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.description || '').toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, menuItems, searchTerm]);

  const cartTotal = cartItems.reduce((total, item) => {
    return total + Number(item.price) * item.quantity;
  }, 0);

  const addItem = (menuItem) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.menu_item_id === menuItem.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.menu_item_id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          menu_item_id: menuItem.id,
          item_name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
          quantity: 1,
          notes: '',
        },
      ];
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const updateCartItem = (menuItemId, changes) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.menu_item_id === menuItemId ? { ...item, ...changes } : item
      )
    );
    setSuccessMessage('');
  };

  const removeCartItem = (menuItemId) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.menu_item_id !== menuItemId)
    );
    setSuccessMessage('');
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const createdOrder = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          table_number: Number(tableNumber),
          items: cartItems.map((item) => ({
            menu_item_id: item.menu_item_id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            notes: item.notes,
          })),
        }),
      });

      setOrders((currentOrders) => [createdOrder, ...currentOrders]);
      setCartItems([]);
      setTableNumber('');
      setOrdersErrorMessage('');
      setSuccessMessage(`Ordine #${createdOrder.id} inviato in cucina.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="waiter-orders-page">
        <p className="waiter-orders-state">Caricamento ordini...</p>
      </section>
    );
  }

  return (
    <section className="waiter-orders-page" aria-labelledby="waiter-orders-title">
      <div className="waiter-orders-header">
        <span className="waiter-orders-kicker">SALA</span>
        <h1 id="waiter-orders-title">Ordini Tavoli</h1>
        <p>Seleziona i piatti, assegna il tavolo e invia l'ordine alla cucina.</p>
      </div>

      {errorMessage && <p className="waiter-orders-message error">Errore: {errorMessage}</p>}
      {ordersErrorMessage && (
        <p className="waiter-orders-message warning">
          Menu caricato, ma non riesco a recuperare gli ordini recenti: {ordersErrorMessage}
        </p>
      )}
      {successMessage && <p className="waiter-orders-message success">{successMessage}</p>}

      <div className="waiter-orders-layout">
        <div className="waiter-menu-panel">
          <div className="waiter-menu-toolbar">
            <label className="waiter-search-field" htmlFor="waiter-menu-search">
              <span>Cerca</span>
              <input
                id="waiter-menu-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome piatto"
              />
            </label>

            <div className="waiter-category-tabs" aria-label="Categorie menu">
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeCategory === category ? 'active' : ''}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="waiter-menu-grid">
            {visibleMenuItems.length === 0 ? (
              <p className="waiter-orders-state">Nessun piatto trovato.</p>
            ) : (
              visibleMenuItems.map((item) => (
                <article className="waiter-menu-item" key={item.id}>
                  <div>
                    <span>{item.category}</span>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                  </div>
                  <div className="waiter-menu-item-footer">
                    <strong>EUR {item.price}</strong>
                    <button type="button" onClick={() => addItem(item)}>
                      Aggiungi
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <form className="waiter-cart-panel" onSubmit={submitOrder}>
          <div className="waiter-cart-header">
            <h2>Nuovo ordine</h2>
            <label htmlFor="waiter-table-number">
              Tavolo
              <input
                id="waiter-table-number"
                type="number"
                min="1"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                required
              />
            </label>
          </div>

          {cartItems.length === 0 ? (
            <p className="waiter-cart-empty">Aggiungi almeno un piatto.</p>
          ) : (
            <div className="waiter-cart-items">
              {cartItems.map((item) => (
                <div className="waiter-cart-item" key={item.menu_item_id}>
                  <div className="waiter-cart-item-top">
                    <strong>{item.item_name}</strong>
                    <button type="button" onClick={() => removeCartItem(item.menu_item_id)}>
                      Rimuovi
                    </button>
                  </div>

                  <div className="waiter-cart-controls">
                    <label>
                      Qta
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateCartItem(item.menu_item_id, {
                            quantity: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                      />
                    </label>
                    <label>
                      Note
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(event) =>
                          updateCartItem(item.menu_item_id, { notes: event.target.value })
                        }
                        placeholder="Senza sale, allergie..."
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="waiter-cart-footer">
            <span>Totale indicativo</span>
            <strong>EUR {cartTotal.toFixed(2)}</strong>
          </div>

          <button
            className="waiter-submit-order"
            type="submit"
            disabled={isSubmitting || cartItems.length === 0}
          >
            {isSubmitting ? 'Invio ordine...' : 'Invia ordine'}
          </button>
        </form>
      </div>

      <div className="waiter-recent-orders">
        <h2>Ordini recenti</h2>
        {orders.length === 0 ? (
          <p className="waiter-orders-state">Nessun ordine presente.</p>
        ) : (
          <div className="waiter-recent-grid">
            {orders.slice(0, 6).map((order) => (
              <article className="waiter-recent-card" key={order.id}>
                <div>
                  <strong>Tavolo {order.table_number}</strong>
                  <span>Ordine #{order.id}</span>
                </div>
                <span className={`waiter-order-status status-${order.status}`}>
                  {statusLabels[order.status] || order.status}
                </span>
                <small>{formatTime(order.created_at)}</small>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WaiterOrders;
