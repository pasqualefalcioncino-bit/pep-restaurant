import { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  Brush,
  CheckCircle2,
  Pencil,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import AdminSearchToolbar from '../../components/admin/AdminSearchToolbar';
import AdminTableCard from '../../components/admin/AdminTableCard';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import useAutoDismiss from '../../hooks/useAutoDismiss';
import './AdminTables.css';

const TABLE_STATUSES = [
  { value: 'libero', label: 'Libero' },
  { value: 'occupato', label: 'Occupato' },
  { value: 'prenotato', label: 'Prenotato' },
  { value: 'in_pulizia', label: 'In pulizia' },
];

const MANUAL_TABLE_STATUSES = ['libero', 'in_pulizia'];

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
  notes: '',
};

const getStatusLabel = (status) => {
  return TABLE_STATUSES.find((item) => item.value === status)?.label || status;
};

const statusIcons = {
  libero: CheckCircle2,
  occupato: Users,
  prenotato: Armchair,
  in_pulizia: Brush,
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
  const [updatingTableStatusId, setUpdatingTableStatusId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useAutoDismiss(errorMessage, setErrorMessage);

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
      icon: statusIcons[status.value],
    }));
  }, [tables]);

  const nextTableNumber = useMemo(() => {
    return getNextAvailableTableNumber(tables);
  }, [tables]);

  const displayedTableNumber = editingTableId
    ? formData.table_number
    : String(nextTableNumber);

  const selectedTableIdSet = useMemo(() => new Set(selectedTableIds), [selectedTableIds]);
  const filteredTables = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tables.filter((table) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        String(table.table_number).includes(normalizedSearch) ||
        table.area?.toLowerCase().includes(normalizedSearch) ||
        table.status?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchTerm, tables]);
  const selectedTables = useMemo(
    () => tables.filter((table) => selectedTableIdSet.has(table.id)),
    [selectedTableIdSet, tables]
  );
  const areAllFilteredTablesSelected =
    filteredTables.length > 0 && filteredTables.every((table) => selectedTableIdSet.has(table.id));

  const updateFormField = (field, value) => {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingTableId(null);
    setSelectedTableIds([]);
  };

  const startEdit = (table) => {
    setEditingTableId(table.id);
    setFormData({
      table_number: String(table.table_number),
      seats: String(table.seats),
      area: table.area || '',
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

  const changeTableStatus = async (table, status) => {
    if (table.status === status || !MANUAL_TABLE_STATUSES.includes(status)) {
      return;
    }

    setUpdatingTableStatusId(table.id);
    setErrorMessage('');

    try {
      const updatedTable = await apiRequest(`/tables/${table.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setTables((currentTables) =>
        currentTables.map((currentTable) =>
          currentTable.id === updatedTable.id ? updatedTable : currentTable
        )
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setUpdatingTableStatusId(null);
    }
  };

  const toggleTableStatus = (table) => {
    if (!MANUAL_TABLE_STATUSES.includes(table.status)) {
      return;
    }

    changeTableStatus(table, table.status === 'libero' ? 'in_pulizia' : 'libero');
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
        currentTables.filter((table) => !selectedTableIdSet.has(table.id))
      );
      setSelectedTableIds([]);
      setTableToDelete(null);

      if (selectedTableIdSet.has(editingTableId)) {
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
        </div>
      </div>

      <div className="admin-tables-stats" aria-label="Riepilogo stato tavoli">
        {stats.map((status) => {
          const StatusIcon = status.icon;

          return (
            <article className={`admin-tables-stat status-${status.value}`} key={status.value}>
              <span>
                <StatusIcon size={17} aria-hidden="true" />
                {status.label}
              </span>
              <strong>{status.count}</strong>
            </article>
          );
        })}
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
                <X size={16} aria-hidden="true" />
                Annulla modifica
              </button>
            )}
            <button className="admin-tables-primary-btn" type="submit" disabled={isSaving}>
              <Save size={16} aria-hidden="true" />
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
            showResults={false}
          />

          <div className="admin-tables-bulk-actions">
            <button type="button" onClick={toggleAllFilteredTables} disabled={filteredTables.length === 0}>
              {areAllFilteredTablesSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </button>
            <button type="button" onClick={startSelectedTableEdit} disabled={selectedTableIds.length !== 1}>
              <Pencil size={15} aria-hidden="true" />
              Modifica selezionato
            </button>
            <button
              className="danger"
              type="button"
              onClick={() => setTableToDelete({ bulk: true })}
              disabled={selectedTableIds.length === 0}
            >
              <Trash2 size={15} aria-hidden="true" />
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
                  isSelected={selectedTableIdSet.has(table.id)}
                  isUpdating={updatingTableStatusId === table.id}
                  key={table.id}
                  onSelect={toggleTableSelection}
                  onStatusToggle={toggleTableStatus}
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
          summaryItems={selectedTables.map((table) => ({
            id: table.id,
            title: `Tavolo ${table.table_number}`,
            details: [`${table.seats} posti`, getStatusLabel(table.status)],
            icon: <Armchair size={18} aria-hidden="true" />,
            fallbackText: String(table.table_number),
          }))}
          isDeleting={deletingTableId !== null}
          onCancel={() => setTableToDelete(null)}
          onConfirm={deleteSelectedTables}
        />
      )}
    </section>
  );
};

export default AdminTables;
