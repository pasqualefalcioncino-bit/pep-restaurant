import { MapPin, StickyNote, Users } from 'lucide-react';

const AdminTableCard = ({
  table,
  getStatusLabel,
  isSelected,
  isUpdating,
  onSelect,
  onStatusToggle,
}) => {
  const isStatusLocked = ['occupato', 'prenotato'].includes(table.status);

  return (
    <article className={`admin-table-card status-${table.status}`}>
      <div className="admin-table-card-top">
        <div>
          <span>Tavolo</span>
          <strong>{table.table_number}</strong>
        </div>
        <div className="admin-table-card-controls">
          <button
            className={`admin-table-status ${table.status}`}
            type="button"
            onClick={() => onStatusToggle(table)}
            disabled={isStatusLocked || isUpdating}
            aria-label={
              isStatusLocked
                ? `Stato tavolo ${table.table_number} gestito automaticamente`
                : `Cambia stato tavolo ${table.table_number}`
            }
            title={
              isStatusLocked
                ? 'Stato gestito da prenotazioni e sincronizzazione automatica'
                : 'Cambia stato'
            }
          >
            {getStatusLabel(table.status)}
          </button>
          <label className="admin-table-select-box">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(table.id)}
              aria-label={`Seleziona tavolo ${table.table_number}`}
            />
            <span aria-hidden="true" />
          </label>
        </div>
      </div>

      <dl className="admin-table-details">
        <div>
          <Users size={16} aria-hidden="true" />
          <dt>Posti</dt>
          <dd>{table.seats}</dd>
        </div>
        <div>
          <MapPin size={16} aria-hidden="true" />
          <dt>Zona</dt>
          <dd>{table.area || 'Non indicata'}</dd>
        </div>
      </dl>

      {table.notes && (
        <p className="admin-table-notes">
          <StickyNote size={15} aria-hidden="true" />
          {table.notes}
        </p>
      )}
    </article>
  );
};

export default AdminTableCard;
