import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import './AdminTables.css';

const TABLE_STATUSES = [
  { value: 'libero', label: 'Libero' },
  { value: 'occupato', label: 'Occupato' },
  { value: 'prenotato', label: 'Prenotato' },
  { value: 'in_pulizia', label: 'In pulizia' },
];

const emptyForm = {
  table_number: '',
  seats: '',
  area: '',
  status: 'libero',
  notes: '',
};

const getStatusLabel = (status) => {
  return TABLE_STATUSES.find((item) => item.value === status)?.label || status;
};

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editingTableId, setEditingTableId] = useState(null);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadTables = async () => {
    try {
      const data = await apiRequest('/tables');
      setTables(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const stats = useMemo(() => {
    return TABLE_STATUSES.map((status) => ({
      ...status,
      count: tables.filter((table) => table.status === status.value).length,
    }));
  }, [tables]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTables = tables.filter((table) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      String(table.table_number).includes(normalizedSearch) ||
      table.area?.toLowerCase().includes(normalizedSearch) ||
      table.status?.toLowerCase().includes(normalizedSearch)
    );
  });

  const updateFormField = (field, value) => {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingTableId(null);
  };

  const startEdit = (table) => {
    setEditingTableId(table.id);
    setFormData({
      table_number: String(table.table_number),
      seats: String(table.seats),
      area: table.area || '',
      status: table.status,
      notes: table.notes || '',
    });
  };

  const saveTable = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    const payload = {
      table_number: Number(formData.table_number),
      seats: Number(formData.seats),
      area: formData.area,
      status: formData.status,
      notes: formData.notes,
    };

    try {
      const savedTable = await apiRequest(
        editingTableId ? `/tables/${editingTableId}` : '/tables',
        {
          method: editingTableId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setTables((currentTables) => {
        if (editingTableId) {
          return currentTables.map((table) =>
            table.id === savedTable.id ? savedTable : table
          );
        }

        return [...currentTables, savedTable].sort(
          (firstTable, secondTable) => firstTable.table_number - secondTable.table_number
        );
      });
      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const changeTableStatus = async (tableId, status) => {
    setErrorMessage('');

    try {
      const updatedTable = await apiRequest(`/tables/${tableId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === updatedTable.id ? updatedTable : table
        )
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const deleteTable = async () => {
    if (!tableToDelete) {
      return;
    }

    setDeletingTableId(tableToDelete.id);
    setErrorMessage('');

    try {
      await apiRequest(`/tables/${tableToDelete.id}`, {
        method: 'DELETE',
      });

      setTables((currentTables) =>
        currentTables.filter((table) => table.id !== tableToDelete.id)
      );
      setTableToDelete(null);

      if (editingTableId === tableToDelete.id) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDeletingTableId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-tables-page">
        <p className="admin-tables-state">Caricamento tavoli...</p>
      </section>
    );
  }

  return (
    <section className="admin-tables-page" aria-labelledby="admin-tables-title">
      <div className="admin-tables-header">
        <div>
          <h1 id="admin-tables-title">Tavoli</h1>
          <p>{tables.length} tavoli configurati per la sala.</p>
        </div>
      </div>

      <div className="admin-tables-stats" aria-label="Riepilogo stato tavoli">
        {stats.map((status) => (
          <article className="admin-tables-stat" key={status.value}>
            <span>{status.label}</span>
            <strong>{status.count}</strong>
          </article>
        ))}
      </div>

      {errorMessage && <p className="admin-tables-state error">Errore: {errorMessage}</p>}

      <div className="admin-tables-layout">
        <form className="admin-tables-form" onSubmit={saveTable}>
          <h2>{editingTableId ? 'Modifica tavolo' : 'Nuovo tavolo'}</h2>

          <div className="admin-tables-form-grid">
            <label>
              <span>Numero tavolo</span>
              <input
                type="number"
                min="1"
                value={formData.table_number}
                onChange={(event) => updateFormField('table_number', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Posti</span>
              <input
                type="number"
                min="1"
                value={formData.seats}
                onChange={(event) => updateFormField('seats', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Zona</span>
              <input
                type="text"
                value={formData.area}
                onChange={(event) => updateFormField('area', event.target.value)}
                placeholder="Sala principale"
              />
            </label>

            <label>
              <span>Stato</span>
              <select
                value={formData.status}
                onChange={(event) => updateFormField('status', event.target.value)}
              >
                {TABLE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Note</span>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(event) => updateFormField('notes', event.target.value)}
              placeholder="Indicazioni interne, posizione, preferenze..."
            />
          </label>

          <div className="admin-tables-form-actions">
            {editingTableId && (
              <button className="admin-tables-secondary-btn" type="button" onClick={resetForm}>
                Annulla modifica
              </button>
            )}
            <button className="admin-tables-primary-btn" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvataggio...' : editingTableId ? 'Salva tavolo' : 'Crea tavolo'}
            </button>
          </div>
        </form>

        <div className="admin-tables-list">
          <AdminSearchToolbar
            id="admin-tables-search"
            placeholder="Numero, zona o stato"
            value={searchTerm}
            onChange={setSearchTerm}
            resultsCount={filteredTables.length}
          />

          {filteredTables.length === 0 ? (
            <p className="admin-tables-state">Nessun tavolo trovato.</p>
          ) : (
            <div className="admin-tables-grid">
              {filteredTables.map((table) => (
                <article className="admin-table-card" key={table.id}>
                  <div className="admin-table-card-top">
                    <div>
                      <span>Tavolo</span>
                      <strong>{table.table_number}</strong>
                    </div>
                    <span className={`admin-table-status ${table.status}`}>
                      {getStatusLabel(table.status)}
                    </span>
                  </div>

                  <dl className="admin-table-details">
                    <div>
                      <dt>Posti</dt>
                      <dd>{table.seats}</dd>
                    </div>
                    <div>
                      <dt>Zona</dt>
                      <dd>{table.area || 'Non indicata'}</dd>
                    </div>
                  </dl>

                  {table.notes && <p className="admin-table-notes">{table.notes}</p>}

                  <label className="admin-table-status-select">
                    <span>Cambia stato</span>
                    <select
                      value={table.status}
                      onChange={(event) => changeTableStatus(table.id, event.target.value)}
                    >
                      {TABLE_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="admin-table-actions">
                    <button type="button" onClick={() => startEdit(table)}>
                      Modifica
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => setTableToDelete(table)}
                      disabled={deletingTableId === table.id}
                    >
                      {deletingTableId === table.id ? 'Elimino...' : 'Elimina'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {tableToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente questo tavolo?"
          summaryItems={[
            `Tavolo ${tableToDelete.table_number}`,
            `${tableToDelete.seats} posti`,
            getStatusLabel(tableToDelete.status),
          ]}
          isDeleting={deletingTableId === tableToDelete.id}
          onCancel={() => setTableToDelete(null)}
          onConfirm={deleteTable}
        />
      )}
    </section>
  );
};

export default AdminTables;
