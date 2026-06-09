const AdminTableCard = ({
  table,
  getStatusLabel,
  isSelected,
  onSelect,
}) => {
  return (
    <article className={`admin-table-card status-${table.status}`}>
      <div className="admin-table-card-top">
        <div>
          <span>Tavolo</span>
          <strong>{table.table_number}</strong>
        </div>
        <div className="admin-table-card-controls">
          <span className={`admin-table-status ${table.status}`}>
            {getStatusLabel(table.status)}
          </span>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(table.id)}
            aria-label={`Seleziona tavolo ${table.table_number}`}
          />
        </div>
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
    </article>
  );
};

export default AdminTableCard;