import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiRequest, getAuthUser } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import useAutoDismiss from '../../hooks/useAutoDismiss';
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

  useAutoDismiss(errorMessage, setErrorMessage);

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

  const selectedCustomerIdSet = useMemo(
    () => new Set(selectedCustomerIds),
    [selectedCustomerIds]
  );
  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return customers.filter((customer) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [customers, searchTerm]);
  const selectableFilteredCustomers = useMemo(
    () => filteredCustomers.filter((customer) => currentUser?.id !== customer.id),
    [currentUser?.id, filteredCustomers]
  );
  const selectedCustomers = useMemo(
    () => customers.filter((customer) => selectedCustomerIdSet.has(customer.id)),
    [customers, selectedCustomerIdSet]
  );
  const areAllFilteredCustomersSelected =
    selectableFilteredCustomers.length > 0 &&
    selectableFilteredCustomers.every((customer) => selectedCustomerIdSet.has(customer.id));

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
        currentCustomers.filter((customer) => !selectedCustomerIdSet.has(customer.id))
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
        <div>
          <h1 id="admin-customers-title">Clienti</h1>
        </div>
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
            showResults={false}
            actions={(
              <div className="admin-customers-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={toggleAllFilteredCustomers}
                  disabled={selectableFilteredCustomers.length === 0}
                >
                  {areAllFilteredCustomersSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </button>
                <button
                  className="danger"
                  type="button"
                  onClick={() => setCustomerToDelete({ bulk: true })}
                  disabled={selectedCustomerIds.length === 0}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  Elimina selezionati
                </button>
              </div>
            )}
          />

          {filteredCustomers.length === 0 ? (
            <p className="admin-customers-state">Nessun cliente trovato.</p>
          ) : (
            <div className="admin-customers-table-wrap">
              <table className="admin-customers-table">
                <thead>
                  <tr>
                    <th>Sel.</th>
                    <th>Nome</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const avatar = getRoleAvatar(customer.role);

                    return (
                      <tr key={customer.id}>
                        <td data-label="Sel.">
                          <label className="admin-customers-select-box">
                            <input
                              type="checkbox"
                              checked={selectedCustomerIdSet.has(customer.id)}
                              onChange={() => toggleCustomerSelection(customer.id)}
                              disabled={currentUser?.id === customer.id}
                              aria-label={`Seleziona ${customer.name}`}
                            />
                            <span aria-hidden="true" />
                          </label>
                        </td>
                        <td data-label="Nome">
                          <div className="admin-customers-person">
                            {avatar && <img src={avatar} alt={`Avatar ${customer.role}`} />}
                            <strong>{customer.name}</strong>
                          </div>
                        </td>
                        <td data-label="Email">{customer.email}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {customerToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente i clienti selezionati?"
          summaryItems={selectedCustomers.map((customer) => {
            const avatar = customer.avatar_url || getRoleAvatar(customer.role);

            return {
              id: customer.id,
              title: customer.name,
              details: [customer.email],
              imageSrc: avatar,
              imageAlt: `Avatar ${customer.name}`,
              fallbackText: customer.name.charAt(0),
            };
          })}
          isDeleting={deletingCustomerId !== null}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={deleteSelectedCustomers}
        />
      )}
    </section>
  );
};

export default AdminCustomers;
