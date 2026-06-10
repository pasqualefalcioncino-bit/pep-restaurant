import { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  CheckCircle2,
  Clock3,
  Send,
  Sparkles,
  Users,
  Utensils,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import useAutoDismiss from '../hooks/useAutoDismiss';
import './WaiterTables.css';

const TABLE_STATUSES = [
  { value: 'libero', label: 'Liberi', Icon: CheckCircle2 },
  { value: 'occupato', label: 'Occupati', Icon: Utensils },
  { value: 'prenotato', label: 'Prenotati', Icon: Clock3 },
  { value: 'in_pulizia', label: 'In pulizia', Icon: Sparkles },
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

const WaiterTables = ({ onNavigate }) => {
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState('2');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [assignedTable, setAssignedTable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useAutoDismiss(errorMessage, setErrorMessage);
  useAutoDismiss(assignedTable, setAssignedTable, null);

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

  const seatGuestTable = async (event) => {
    event.preventDefault();

    const table = availableTables.find((item) => String(item.id) === selectedTableId);

    if (!table) {
      setErrorMessage('Seleziona un tavolo libero con posti sufficienti.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const updatedTable = await apiRequest(`/tables/${table.id}/seat`, {
        method: 'PATCH',
        body: JSON.stringify({ guests: guestCount }),
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
      <section className="waiter-tables-page">
        <p className="waiter-tables-state">Caricamento tavoli...</p>
      </section>
    );
  }

  return (
    <section className="waiter-tables-page" aria-labelledby="waiter-tables-title">
      <div className="waiter-tables-header">
        <div>
          <span className="waiter-tables-kicker">SALA</span>
          <h1 id="waiter-tables-title">Tavoli</h1>
          <p>Gestisci i tavoli disponibili e fai accomodare i clienti senza prenotazione.</p>
        </div>
      </div>

      <div className="waiter-tables-stats" aria-label="Riepilogo stato tavoli">
        {stats.map((status) => {
          const StatusIcon = status.Icon;

          return (
            <article className={`waiter-tables-stat status-${status.value}`} key={status.value}>
              <span className="waiter-tables-stat-icon">
                <StatusIcon size={18} />
              </span>
              <span>{status.label}</span>
              <strong>{status.count}</strong>
            </article>
          );
        })}
      </div>

      {errorMessage && <p className="waiter-tables-message error">Errore: {errorMessage}</p>}

      {assignedTable && (
        <div className="waiter-tables-message success">
          <CheckCircle2 size={22} />
          <div>
            <strong>Tavolo {assignedTable.table_number} occupato.</strong>
            <span>
              {assignedTable.guests} coperti: tornera libero automaticamente tra 1 ora se non
              parte un ordine.
            </span>
          </div>
          <button type="button" onClick={() => onNavigate('ordini')}>
            Vai agli ordini
          </button>
        </div>
      )}

      <div className="waiter-tables-layout">
        <form className="waiter-tables-form" onSubmit={seatGuestTable}>
          <div className="waiter-tables-form-heading">
            <span>
              <Users size={19} />
            </span>
            <div>
              <h2>Accomoda cliente</h2>
              <p>Seleziona i coperti e il tavolo libero piu adatto.</p>
            </div>
          </div>

          <label htmlFor="waiter-tables-guests">
            <span>Coperti</span>
            <input
              id="waiter-tables-guests"
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

          <label htmlFor="waiter-tables-table">
            <span>Tavolo disponibile</span>
            <select
              id="waiter-tables-table"
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
            <p className="waiter-tables-hint">Nessun tavolo libero con almeno {guestCount} posti.</p>
          )}

          <button
            className="waiter-tables-primary-btn"
            type="submit"
            disabled={isSaving || availableTables.length === 0}
          >
            <Send size={17} />
            {isSaving ? 'Assegnazione...' : 'Fai accomodare'}
          </button>
        </form>

        <div className="waiter-tables-board">
          <div className="waiter-tables-board-header">
            <div>
              <h2>Tavoli sala</h2>
              <p>{visibleTables.length} tavoli configurati</p>
            </div>
          </div>

          {visibleTables.length === 0 ? (
            <p className="waiter-tables-state">Nessun tavolo configurato.</p>
          ) : (
            <div className="waiter-tables-grid">
              {visibleTables.map((table) => {
                const canFitGuests = table.status === 'libero' && Number(table.seats) >= guestCount;

                return (
                  <article
                    className={`waiter-tables-card status-${table.status}${
                      canFitGuests ? ' available' : ''
                    }`}
                    key={table.id}
                  >
                    <div className="waiter-tables-card-top">
                      <span className="waiter-tables-card-icon">
                        <Armchair size={21} />
                      </span>
                      <span className={`waiter-tables-badge status-${table.status}`}>
                        {getTableStatusLabel(table.status)}
                      </span>
                    </div>
                    <div className="waiter-tables-card-main">
                      <span>{table.area || 'Sala'}</span>
                      <h3>Tavolo {table.table_number}</h3>
                    </div>
                    <div className="waiter-tables-card-meta">
                      <strong>{table.seats} posti</strong>
                      {canFitGuests ? (
                        <span>Adatto a {guestCount}</span>
                      ) : (
                        <span>Non selezionabile</span>
                      )}
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

export default WaiterTables;
