const AdminTableCard = ({
  table,
  statuses,
  deletingTableId,
  getStatusLabel,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  return (
    <article className={`admin-table-card status-${table.status}`}>
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
        <select value={table.status} onChange={(event) => onStatusChange(table.id, event.target.value)}>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <div className="admin-table-actions">
        <button type="button" onClick={() => onEdit(table)}>
          Modifica
        </button>
        <button
          className="danger"
          type="button"
          onClick={() => onDelete(table)}
          disabled={deletingTableId === table.id}
        >
          {deletingTableId === table.id ? 'Elimino...' : 'Elimina'}
        </button>
      </div>
    </article>
  );
};

export default AdminTableCard;
