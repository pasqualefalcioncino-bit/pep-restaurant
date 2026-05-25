import { useEffect, useState } from 'react';
import { apiRequest, getAuthUser } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import './AdminCustomers.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
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

  const deleteCustomer = async () => {
    if (!customerToDelete) {
      return;
    }

    setDeletingCustomerId(customerToDelete.id);
    setErrorMessage('');

    try {
      await apiRequest(`/users/${customerToDelete.id}`, {
        method: 'DELETE',
      });

      setCustomers((currentCustomers) =>
        currentCustomers.filter((customer) => customer.id !== customerToDelete.id)
      );
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
        <span className="admin-customers-kicker">ADMIN</span>
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

          {filteredCustomers.length === 0 ? (
            <p className="admin-customers-state">Nessun cliente trovato.</p>
          ) : (
            <div className="admin-customers-table-wrap">
              <table className="admin-customers-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.name}</strong>
                      </td>
                      <td>{customer.email}</td>
                      <td>
                        <span className="admin-customers-role">{customer.role}</span>
                      </td>
                      <td>
                        <button
                          className="admin-customers-delete-btn"
                          type="button"
                          onClick={() => setCustomerToDelete(customer)}
                          disabled={
                            deletingCustomerId === customer.id ||
                            currentUser?.id === customer.id
                          }
                        >
                          {deletingCustomerId === customer.id ? 'Elimino...' : 'Elimina'}
                        </button>
                      </td>
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
          title="Vuoi eliminare definitivamente questa utenza?"
          summaryItems={[
            customerToDelete.name,
            customerToDelete.email,
            customerToDelete.role,
          ]}
          isDeleting={deletingCustomerId === customerToDelete.id}
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={deleteCustomer}
        />
      )}
    </section>
  );
};

export default AdminCustomers;
