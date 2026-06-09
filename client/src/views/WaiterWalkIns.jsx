import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import './WaiterWalkIns.css';

const TABLE_STATUSES = [
  { value: 'libero', label: 'Liberi' },
  { value: 'occupato', label: 'Occupati' },
  { value: 'prenotato', label: 'Prenotati' },
  { value: 'in_pulizia', label: 'In pulizia' },
];

const getTableStatusLabel = (status) => {
  const labels = {
    libero: 'Libero',
    occupato: 'Occupato',
    prenotato: 'Prenotato',
    in_pulizia: 'In pulizia',
  };

  return labels[status] || status;
};

const WaiterWalkIns = ({ onNavigate }) => {
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState('2');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [assignedTable, setAssignedTable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadTables = async () => {
    try {
      const data = await apiRequest('/tables');
      setTables(data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const guestCount = Math.max(1, Number(guests) || 1);

  const stats = useMemo(() => {
    return TABLE_STATUSES.map((status) => ({
      ...status,
      count: tables.filter((table) => table.status === status.value).length,
    }));
  }, [tables]);

  const availableTables = useMemo(() => {
    return tables
      .filter((table) => table.status === 'libero' && Number(table.seats) >= guestCount)
      .sort((firstTable, secondTable) => {
        if (firstTable.seats !== secondTable.seats) {
          return firstTable.seats - secondTable.seats;
        }

        return firstTable.table_number - secondTable.table_number;
      });
  }, [guestCount, tables]);

  const visibleTables = useMemo(() => {
    return [...tables].sort((firstTable, secondTable) => {
      return firstTable.table_number - secondTable.table_number;
    });
  }, [tables]);

  useEffect(() => {
    if (
      selectedTableId &&
      !availableTables.some((table) => String(table.id) === selectedTableId)
    ) {
      setSelectedTableId('');
    }
  }, [availableTables, selectedTableId]);

  const assignWalkIn = async (event) => {
    event.preventDefault();

    const table = availableTables.find((item) => String(item.id) === selectedTableId);

    if (!table) {
      setErrorMessage('Seleziona un tavolo libero con posti sufficienti.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const updatedTable = await apiRequest(`/tables/${table.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'occupato' }),
      });

      setTables((currentTables) =>
        currentTables.map((currentTable) =>
          currentTable.id === updatedTable.id ? updatedTable : currentTable
        )
      );
      setAssignedTable({ ...updatedTable, guests: guestCount });
      setSelectedTableId('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="waiter-walkins-page">
        <p className="waiter-walkins-state">Caricamento tavoli...</p>
      </section>
    );
  }

  return (
    <section className="waiter-walkins-page" aria-labelledby="waiter-walkins-title">
      <div className="waiter-walkins-header">
        <span className="waiter-walkins-kicker">SALA</span>
        <h1 id="waiter-walkins-title">Arrivi senza prenotazione</h1>
        <p>Inserisci i coperti, scegli un tavolo libero e fallo risultare occupato.</p>
      </div>

      <div className="waiter-walkins-stats" aria-label="Riepilogo stato tavoli">
        {stats.map((status) => (
          <article className={`waiter-walkins-stat status-${status.value}`} key={status.value}>
            <span>{status.label}</span>
            <strong>{status.count}</strong>
          </article>
        ))}
      </div>

      {errorMessage && <p className="waiter-walkins-message error">Errore: {errorMessage}</p>}

      {assignedTable && (
        <div className="waiter-walkins-message success">
          <strong>Tavolo {assignedTable.table_number} assegnato.</strong>
          <span>{assignedTable.guests} coperti possono ora ordinare dalla pagina Ordini.</span>
          <button type="button" onClick={() => onNavigate('ordini')}>
            Vai agli ordini
          </button>
        </div>
      )}

      <div className="waiter-walkins-layout">
        <form className="waiter-walkins-form" onSubmit={assignWalkIn}>
          <h2>Nuovo arrivo</h2>

          <label htmlFor="waiter-walkins-guests">
            <span>Coperti</span>
            <input
              id="waiter-walkins-guests"
              type="number"
              min="1"
              value={guests}
              onChange={(event) => {
                setGuests(event.target.value);
                setAssignedTable(null);
              }}
              required
            />
          </label>

          <label htmlFor="waiter-walkins-table">
            <span>Tavolo disponibile</span>
            <select
              id="waiter-walkins-table"
              value={selectedTableId}
              onChange={(event) => {
                setSelectedTableId(event.target.value);
                setAssignedTable(null);
              }}
              required
            >
              <option value="">Seleziona</option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {`Tavolo ${table.table_number} - ${table.seats} posti${
                    table.area ? ` - ${table.area}` : ''
                  }`}
                </option>
              ))}
            </select>
          </label>

          {availableTables.length === 0 && (
            <p className="waiter-walkins-hint">
              Nessun tavolo libero con almeno {guestCount} posti.
            </p>
          )}

          <button
            className="waiter-walkins-primary-btn"
            type="submit"
            disabled={isSaving || availableTables.length === 0}
          >
            {isSaving ? 'Assegnazione...' : 'Fai accomodare'}
          </button>
        </form>

        <div className="waiter-walkins-tables">
          <div className="waiter-walkins-table-header">
            <h2>Tavoli sala</h2>
            <button type="button" onClick={loadTables}>
              Aggiorna
            </button>
          </div>

          {visibleTables.length === 0 ? (
            <p className="waiter-walkins-state">Nessun tavolo configurato.</p>
          ) : (
            <div className="waiter-walkins-grid">
              {visibleTables.map((table) => {
                const canFitGuests = table.status === 'libero' && Number(table.seats) >= guestCount;

                return (
                  <article
                    className={`waiter-walkins-table status-${table.status}${
                      canFitGuests ? ' available' : ''
                    }`}
                    key={table.id}
                  >
                    <div>
                      <span>{table.area || 'Sala'}</span>
                      <h3>Tavolo {table.table_number}</h3>
                    </div>
                    <div className="waiter-walkins-table-meta">
                      <strong>{table.seats} posti</strong>
                      <span>{getTableStatusLabel(table.status)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WaiterWalkIns;