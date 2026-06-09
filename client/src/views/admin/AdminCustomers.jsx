import { useEffect, useState } from 'react';
import { apiRequest, getAuthUser } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { getRoleAvatar } from '../../utils/roleAvatars';
import './AdminCustomers.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const currentUser = getAuthUser();

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await apiRequest('/users/customers');
        setCustomers(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      customer.name.toLowerCase().includes(normalizedSearch) ||
      customer.email.toLowerCase().includes(normalizedSearch)
    );
  });

  const selectableFilteredCustomers = filteredCustomers.filter((customer) => {
    return currentUser?.id !== customer.id;
  });
  const selectedCustomers = customers.filter((customer) =>
    selectedCustomerIds.includes(customer.id)
  );
  const areAllFilteredCustomersSelected =
    selectableFilteredCustomers.length > 0 &&
    selectableFilteredCustomers.every((customer) => selectedCustomerIds.includes(customer.id));

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomerIds((currentIds) =>
      currentIds.includes(customerId)
        ? currentIds.filter((id) => id !== customerId)
        : [...currentIds, customerId]
    );
  };

  const toggleAllFilteredCustomers = () => {
    setSelectedCustomerIds((currentIds) => {
      if (areAllFilteredCustomersSelected) {
        return currentIds.filter(
          (id) => !selectableFilteredCustomers.some((customer) => customer.id === id)
        );
      }

      return [...new Set([...currentIds, ...selectableFilteredCustomers.map((customer) => customer.id)])];
    });
  };

  const deleteSelectedCustomers = async () => {
    if (selectedCustomers.length === 0) {
      return;
    }

    setDeletingCustomerId(selectedCustomers[0].id);
    setErrorMessage('');

    try {
      await Promise.all(
        selectedCustomers.map((customer) =>
          apiRequest(`/users/${customer.id}`, {
            method: 'DELETE',
          })
        )
      );

      setCustomers((currentCustomers) =>
        currentCustomers.filter((customer) => !selectedCustomerIds.includes(customer.id))
      );
      setSelectedCustomerIds([]);
      setCustomerToDelete(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingCustomerId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-customers-page">
        <p className="admin-customers-state">Caricamento clienti...</p>
      </section>
    );
  }

  return (
    <section className="admin-customers-page" aria-labelledby="admin-customers-title">
      <div className="admin-customers-header">
        <h1 id="admin-customers-title">Clienti</h1>
        <p>{customers.length} clienti presenti nel database.</p>
      </div>

      {errorMessage && <p className="admin-customers-state error">Errore: {errorMessage}</p>}

      {customers.length === 0 ? (
        <p className="admin-customers-state">Nessun cliente salvato.</p>
      ) : (
        <>
          <AdminSearchToolbar
            id="admin-customers-search"
            placeholder="Nome o email"
            value={searchTerm}
            onChange={setSearchTerm}
            resultsCount={filteredCustomers.length}
          />

          <div className="admin-customers-actions">
            <span>{selectedCustomerIds.length} selezionati</span>
            <button
              type="button"
              onClick={() => setCustomerToDelete({ bulk: true })}
              disabled={selectedCustomerIds.length === 0}
            >
              Elimina selezionati
            </button>
          </div>

          {filteredCustomers.length === 0 ? (
            <p className="admin-customers-state">Nessun cliente trovato.</p>
          ) : (
            <div className="admin-customers-table-wrap">
              <table className="admin-customers-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={areAllFilteredCustomersSelected}
                        onChange={toggleAllFilteredCustomers}
                        aria-label="Seleziona tutti i clienti filtrati"
                      />
                    </th>
                    <th>Nome</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          disabled={currentUser?.id === customer.id}
                          aria-label={`Seleziona ${customer.name}`}
                        />
                      </td>
                      <td>
                        <div className="admin-customers-person">
                          {getRoleAvatar(customer.role) && (
                            <img src={getRoleAvatar(customer.role)} alt={`Avatar ${customer.role}`} />
                          )}
                          <strong>{customer.name}</strong>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {customerToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente i clienti selezionati?"
          summaryItems={selectedCustomers.map((customer) => `${customer.name} - ${customer.email}`)}
          isDeleting={deletingCustomerId !== null}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={deleteSelectedCustomers}
        />
      )}
    </section>
  );
};

export default AdminCustomers;