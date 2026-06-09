import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import AdminTableCard from '../../components/admin/AdminTableCard';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import './AdminTables.css';

const TABLE_STATUSES = [
  { value: 'libero', label: 'Libero' },
  { value: 'occupato', label: 'Occupato' },
  { value: 'prenotato', label: 'Prenotato' },
  { value: 'in_pulizia', label: 'In pulizia' },
];

const TABLE_AREAS = [
  'Sala principale',
  'Veranda',
  'Terrazza',
  'Giardino',
  'Sala privata',
];

const emptyForm = {
  table_number: '',
  seats: '',
  area: TABLE_AREAS[0],
  status: 'libero',
  notes: '',
};

const getStatusLabel = (status) => {
  return TABLE_STATUSES.find((item) => item.value === status)?.label || status;
};

const getNextAvailableTableNumber = (tables) => {
  const usedTableNumbers = new Set(
    tables
      .map((table) => Number(table.table_number))
      .filter((tableNumber) => Number.isInteger(tableNumber) && tableNumber > 0)
  );
  let nextTableNumber = 1;

  while (usedTableNumbers.has(nextTableNumber)) {
    nextTableNumber += 1;
  }

  return nextTableNumber;
};

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editingTableId, setEditingTableId] = useState(null);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('libero');
  const [isBulkStatusSaving, setIsBulkStatusSaving] = useState(false);
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

  const nextTableNumber = useMemo(() => {
    return getNextAvailableTableNumber(tables);
  }, [tables]);

  const displayedTableNumber = editingTableId
    ? formData.table_number
    : String(nextTableNumber);

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
  const selectedTables = tables.filter((table) => selectedTableIds.includes(table.id));
  const areAllFilteredTablesSelected =
    filteredTables.length > 0 && filteredTables.every((table) => selectedTableIds.includes(table.id));

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

  const toggleTableSelection = (tableId) => {
    setSelectedTableIds((currentIds) =>
      currentIds.includes(tableId)
        ? currentIds.filter((id) => id !== tableId)
        : [...currentIds, tableId]
    );
  };

  const toggleAllFilteredTables = () => {
    setSelectedTableIds((currentIds) => {
      if (areAllFilteredTablesSelected) {
        return currentIds.filter((id) => !filteredTables.some((table) => table.id === id));
      }

      return [...new Set([...currentIds, ...filteredTables.map((table) => table.id)])];
    });
  };

  const startSelectedTableEdit = () => {
    if (selectedTables.length !== 1) {
      return;
    }

    startEdit(selectedTables[0]);
  };

  const saveTable = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    const payload = {
      seats: Number(formData.seats),
      area: formData.area,
      status: formData.status,
      notes: formData.notes,
    };

    if (editingTableId) {
      payload.table_number = Number(displayedTableNumber);
    }

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

  const changeSelectedTablesStatus = async () => {
    if (selectedTables.length === 0) {
      return;
    }

    setIsBulkStatusSaving(true);
    setErrorMessage('');

    try {
      const updatedTables = await Promise.all(
        selectedTables.map((table) =>
          apiRequest(`/tables/${table.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      );
      const updatedTablesById = Object.fromEntries(updatedTables.map((table) => [table.id, table]));

      setTables((currentTables) =>
        currentTables.map((table) => updatedTablesById[table.id] || table)
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsBulkStatusSaving(false);
    }
  };

  const deleteSelectedTables = async () => {
    if (selectedTables.length === 0) {
      return;
    }

    setDeletingTableId(selectedTables[0].id);
    setErrorMessage('');

    try {
      await Promise.all(
        selectedTables.map((table) =>
          apiRequest(`/tables/${table.id}`, {
            method: 'DELETE',
          })
        )
      );

      setTables((currentTables) =>
        currentTables.filter((table) => !selectedTableIds.includes(table.id))
      );
      setSelectedTableIds([]);
      setTableToDelete(null);

      if (selectedTableIds.includes(editingTableId)) {
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
          <article className={`admin-tables-stat status-${status.value}`} key={status.value}>
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
                value={displayedTableNumber}
                readOnly
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
              <select
                value={formData.area}
                onChange={(event) => updateFormField('area', event.target.value)}
              >
                {TABLE_AREAS.includes(formData.area) ? null : (
                  <option value={formData.area}>{formData.area}</option>
                )}
                {TABLE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
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

          <div className="admin-tables-bulk-actions">
            <label>
              <input
                type="checkbox"
                checked={areAllFilteredTablesSelected}
                onChange={toggleAllFilteredTables}
              />
              Seleziona filtrati
            </label>
            <span>{selectedTableIds.length} selezionati</span>
            <button type="button" onClick={startSelectedTableEdit} disabled={selectedTableIds.length !== 1}>
              Modifica selezionato
            </button>
            <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
              {TABLE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={changeSelectedTablesStatus}
              disabled={selectedTableIds.length === 0 || isBulkStatusSaving}
            >
              {isBulkStatusSaving ? 'Aggiorno...' : 'Cambia stato'}
            </button>
            <button
              className="danger"
              type="button"
              onClick={() => setTableToDelete({ bulk: true })}
              disabled={selectedTableIds.length === 0}
            >
              Elimina selezionati
            </button>
          </div>

          {filteredTables.length === 0 ? (
            <p className="admin-tables-state">Nessun tavolo trovato.</p>
          ) : (
            <div className="admin-tables-grid">
              {filteredTables.map((table) => (
                <AdminTableCard
                  getStatusLabel={getStatusLabel}
                  isSelected={selectedTableIds.includes(table.id)}
                  key={table.id}
                  onSelect={toggleTableSelection}
                  table={table}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {tableToDelete && (
        <ConfirmDeleteModal
          title="Vuoi eliminare definitivamente i tavoli selezionati?"
          summaryItems={selectedTables.map(
            (table) => `Tavolo ${table.table_number} - ${table.seats} posti - ${getStatusLabel(table.status)}`
          )}
          isDeleting={deletingTableId !== null}
          onCancel={() => setTableToDelete(null)}
          onConfirm={deleteSelectedTables}
        />
      )}
    </section>
  );
};

export default AdminTables;