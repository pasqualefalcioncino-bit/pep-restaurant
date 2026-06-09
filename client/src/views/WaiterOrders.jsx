import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import {
  compareMenuCategory,
  getOrderStatusLabel,
  menuCategories,
  sortByMenuCategory,
} from '../utils/menuCatalog';
import { getMenuImage } from '../utils/menuImages';
import { formatEuroPrice } from '../utils/priceFormatter';
import './WaiterOrders.css';

const formatTime = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
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

const getTableStatusLabel = (status) => {
  const labels = {
    libero: 'libero',
    occupato: 'occupato',
    prenotato: 'prenotato',
    in_pulizia: 'in pulizia',
  };

  return labels[status] || status;
};

const WaiterOrders = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingServedOrderId, setUpdatingServedOrderId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [ordersErrorMessage, setOrdersErrorMessage] = useState('');
  const [tablesErrorMessage, setTablesErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [menuResult, ordersResult, tablesResult] = await Promise.allSettled([
        apiRequest('/menu'),
        apiRequest('/orders'),
        apiRequest('/tables'),
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

      if (tablesResult.status === 'fulfilled') {
        setTables(tablesResult.value);
      } else {
        setTablesErrorMessage(tablesResult.reason.message);
      }

      setIsLoading(false);
    };

    loadData();

    const intervalId = window.setInterval(loadData, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];

    return [
      'Tutti',
      ...uniqueCategories.sort((currentCategory, nextCategory) => {
        return compareMenuCategory(currentCategory, nextCategory);
      }),
    ];
  }, [menuItems]);

  const visibleMenuItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems
      .filter((item) => {
        const matchesCategory = activeCategory === 'Tutti' || item.category === activeCategory;
        const matchesSearch =
          !normalizedSearch ||
          item.name.toLowerCase().includes(normalizedSearch) ||
          (item.description || '').toLowerCase().includes(normalizedSearch);

        return matchesCategory && matchesSearch;
      })
      .sort(sortByMenuCategory);
  }, [activeCategory, menuItems, searchTerm]);

  const groupedMenuItems = useMemo(() => {
    return menuCategories
      .map((category) => ({
        category,
        items: visibleMenuItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleMenuItems]);

  const cartTotal = cartItems.reduce((total, item) => {
    return total + Number(item.price) * item.quantity;
  }, 0);

  const sortedTables = useMemo(() => {
    return tables
      .filter((table) => table.status === 'occupato')
      .sort((firstTable, secondTable) => {
        return firstTable.table_number - secondTable.table_number;
      });
  }, [tables]);

  const recentOrders = useMemo(() => {
    return orders
      .filter((order) => !['servito', 'annullato'].includes(order.status))
      .slice(0, 6);
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const menuItemsById = useMemo(() => {
    return Object.fromEntries(menuItems.map((item) => [item.id, item]));
  }, [menuItems]);

  const unavailableCartItems = useMemo(() => {
    return cartItems.filter((item) => menuItemsById[item.menu_item_id]?.available === false);
  }, [cartItems, menuItemsById]);

  const selectedOrderTotal = useMemo(() => {
    if (!selectedOrder) {
      return 0;
    }

    return (selectedOrder.items || []).reduce((total, item) => {
      const menuItem = menuItemsById[item.menu_item_id];
      const itemPrice = Number(menuItem?.price) || 0;

      return total + itemPrice * Number(item.quantity || 0);
    }, 0);
  }, [menuItemsById, selectedOrder]);

  const addItem = (menuItem) => {
    if (menuItem.available === false) {
      return;
    }

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
          image: menuItem.image,
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

    if (unavailableCartItems.length > 0) {
      setErrorMessage('Rimuovi dal carrello i piatti non disponibili prima di inviare.');
      return;
    }

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
      setTables((currentTables) =>
        currentTables.map((table) =>
          table.table_number === createdOrder.table_number
            ? { ...table, status: 'occupato' }
            : table
        )
      );
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

  const markOrderServed = async (order) => {
    setUpdatingServedOrderId(order.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedOrder = await apiRequest(`/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'servito' }),
      });

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder
        )
      );
      setTables((currentTables) =>
        currentTables.map((table) =>
          table.table_number === updatedOrder.table_number ? { ...table, status: 'libero' } : table
        )
      );
      setSuccessMessage(`Ordine #${updatedOrder.id} segnato come servito.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingServedOrderId(null);
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
      {tablesErrorMessage && (
        <p className="waiter-orders-message warning">
          Menu caricato, ma non riesco a recuperare i tavoli: {tablesErrorMessage}
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

          <div className="waiter-menu-sections">
            {visibleMenuItems.length === 0 ? (
              <p className="waiter-orders-state">Nessun piatto trovato.</p>
            ) : (
              groupedMenuItems.map((group) => (
                <section className="waiter-menu-category-section" key={group.category}>
                  <div className="waiter-menu-category-heading">
                    <h2>{group.category}</h2>
                  </div>

                  <div className="waiter-menu-grid">
                    {group.items.map((item) => {
                      const menuImage = getMenuImage(item.image);

                      return (
                        <article
                          className={`waiter-menu-item ${
                            item.available === false ? 'unavailable' : ''
                          }`}
                          key={item.id}
                        >
                          <div className="waiter-menu-item-main">
                            <div className="waiter-menu-item-image">
                              {menuImage ? (
                                <img src={menuImage} alt={item.name} />
                              ) : (
                                <span aria-hidden="true">{item.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <span>{item.category}</span>
                              <h2>{item.name}</h2>
                              <p>{item.description}</p>
                            </div>
                          </div>
                          <div className="waiter-menu-item-footer">
                            <strong>{formatEuroPrice(item.price)}</strong>
                            <button
                              type="button"
                              onClick={() => addItem(item)}
                              disabled={item.available === false}
                            >
                              {item.available === false ? 'Non disponibile' : 'Aggiungi'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>

        <div className="waiter-sidebar">
          <form className="waiter-cart-panel" onSubmit={submitOrder}>
            <div className="waiter-cart-header">
              <h2>Nuovo ordine</h2>
              <label htmlFor="waiter-table-number">
                <span>Tavolo</span>
                <select
                  id="waiter-table-number"
                  value={tableNumber}
                  onChange={(event) => setTableNumber(event.target.value)}
                  required
                >
                  <option value="">Seleziona</option>
                  {sortedTables.map((table) => (
                    <option key={table.id} value={table.table_number}>
                      {`Tavolo ${table.table_number} - ${table.seats} posti - ${getTableStatusLabel(
                        table.status
                      )}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {sortedTables.length === 0 && (
              <p className="waiter-cart-warning">
                Nessun tavolo occupato: fai accomodare i clienti dalla pagina Walk-in prima di
                inviare un ordine.
              </p>
            )}

            {cartItems.length === 0 ? (
              <p className="waiter-cart-empty">Aggiungi almeno un piatto.</p>
            ) : (
              <div className="waiter-cart-items">
                {cartItems.map((item) => {
                  const cartImage = getMenuImage(item.image);
                  const isUnavailable = menuItemsById[item.menu_item_id]?.available === false;

                  return (
                    <div
                      className={`waiter-cart-item ${isUnavailable ? 'unavailable' : ''}`}
                      key={item.menu_item_id}
                    >
                      <div className="waiter-cart-item-top">
                        <div className="waiter-cart-dish">
                          <div className="waiter-cart-dish-image">
                            {cartImage ? (
                              <img src={cartImage} alt={item.item_name} />
                            ) : (
                              <span aria-hidden="true">{item.item_name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <strong>{item.item_name}</strong>
                            {isUnavailable && <span>Non disponibile</span>}
                          </div>
                        </div>
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
                  );
                })}
              </div>
            )}

            <div className="waiter-cart-footer">
              <span>Totale indicativo</span>
              <strong>{formatEuroPrice(cartTotal)}</strong>
            </div>

            {unavailableCartItems.length > 0 && (
              <p className="waiter-cart-warning">
                Rimuovi i piatti non disponibili per inviare l'ordine.
              </p>
            )}

            <button
              className="waiter-submit-order"
              type="submit"
              disabled={
                isSubmitting ||
                cartItems.length === 0 ||
                unavailableCartItems.length > 0 ||
                sortedTables.length === 0
              }
            >
              {isSubmitting ? 'Invio ordine...' : 'Invia ordine'}
            </button>
          </form>

          <section className="waiter-recent-orders" aria-labelledby="waiter-recent-title">
            <h2 id="waiter-recent-title">Ordini recenti</h2>
            {recentOrders.length === 0 ? (
              <p className="waiter-recent-empty">Nessun ordine presente.</p>
            ) : (
              <>
                <div className="waiter-recent-grid">
                  {recentOrders.map((order) => (
                    <button
                      className={`waiter-recent-card ${
                        selectedOrderId === order.id ? 'active' : ''
                      } status-${order.status}`}
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      aria-haspopup="dialog"
                    >
                      <div className="waiter-recent-main">
                        <strong>Tavolo {order.table_number}</strong>
                        <span>Ordine #{order.id}</span>
                        <small>{formatTime(order.created_at)}</small>
                      </div>
                      <span className={`waiter-order-status status-${order.status}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {selectedOrder && (
        <div className="confirm-delete-backdrop" role="presentation">
          <div
            className="waiter-receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="waiter-receipt-title"
          >
            <div className="waiter-receipt-header">
              <div>
                <span>Riepilogo ordine</span>
                <h2 id="waiter-receipt-title">Scontrino #{selectedOrder.id}</h2>
              </div>
              <button type="button" onClick={() => setSelectedOrderId(null)}>
                Chiudi
              </button>
            </div>

            <div className="waiter-receipt-meta">
              <div>
                <span>Tavolo</span>
                <strong>{selectedOrder.table_number || '-'}</strong>
              </div>
              <div>
                <span>Data</span>
                <strong>{formatDateTime(selectedOrder.created_at)}</strong>
              </div>
              <div>
                <span>Stato</span>
                <strong>
                  <span className={`waiter-order-status status-${selectedOrder.status}`}>
                    {getOrderStatusLabel(selectedOrder.status)}
                  </span>
                </strong>
              </div>
            </div>

            <div className="waiter-receipt-items">
              {(selectedOrder.items || []).length === 0 ? (
                <p>Nessun dettaglio piatto disponibile.</p>
              ) : (
                [...selectedOrder.items].sort(sortByMenuCategory).map((item) => {
                  const menuItem = menuItemsById[item.menu_item_id];
                  const itemImage = getMenuImage(menuItem?.image);
                  const itemPrice = Number(menuItem?.price) || 0;
                  const itemQuantity = Number(item.quantity) || 0;
                  const rowTotal = itemPrice * itemQuantity;

                  return (
                    <div
                      className={`waiter-receipt-item ${item.status === 'ready' ? 'ready' : ''}`}
                      key={item.id}
                    >
                      <div className="waiter-receipt-item-image">
                        {itemImage ? (
                          <img src={itemImage} alt={item.item_name} />
                        ) : (
                          <span aria-hidden="true">{item.item_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="waiter-receipt-item-body">
                        <strong>{item.item_name}</strong>
                        <span>{item.category || 'Senza categoria'}</span>
                        {item.notes && <small>Note: {item.notes}</small>}
                      </div>
                      <div className="waiter-receipt-item-price">
                        <span>
                          {itemQuantity} x {formatEuroPrice(itemPrice)}
                        </span>
                        <strong>{formatEuroPrice(rowTotal)}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="waiter-receipt-total">
              <span>Totale conto</span>
              <strong>{formatEuroPrice(selectedOrderTotal)}</strong>
            </div>

            {selectedOrder.status === 'pronto' && (
              <button
                className="waiter-receipt-served-btn"
                type="button"
                onClick={() => markOrderServed(selectedOrder)}
                disabled={updatingServedOrderId === selectedOrder.id}
              >
                {updatingServedOrderId === selectedOrder.id ? 'Aggiornamento...' : 'Segna servito'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default WaiterOrders;