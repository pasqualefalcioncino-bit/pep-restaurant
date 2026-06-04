import { formatQuantity, getStockStatus, stockStatusLabels } from '../../utils/inventoryUtils';

const AdminInventoryRow = ({
  item,
  deletingItemId,
  editLabel = 'Modifica',
  onEdit,
  onDelete,
  showDelete = true,
  updatingItemId,
}) => {
  const stockStatus = getStockStatus(item);
  const isUpdating = updatingItemId === item.id;

  return (
    <tr className={`status-${stockStatus}`}>
      <td>
        <strong>{item.name}</strong>
        {item.notes && <small>{item.notes}</small>}
      </td>
      <td>{item.category}</td>
      <td>
        {formatQuantity(item.total_quantity)} {item.unit}
      </td>
      <td>
        {formatQuantity(item.quantity)} {item.unit}
      </td>
      <td>
        <span className={`admin-inventory-status status-${stockStatus}`}>
          {stockStatusLabels[stockStatus]}
        </span>
      </td>
      <td>
        <div className="admin-inventory-actions">
          <button type="button" onClick={() => onEdit(item)} disabled={isUpdating}>
            {isUpdating ? 'Aggiorno...' : editLabel}
          </button>
          {showDelete && (
            <button
              className="danger"
              type="button"
              onClick={() => onDelete(item)}
              disabled={deletingItemId === item.id}
            >
              {deletingItemId === item.id ? 'Elimino...' : 'Elimina'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default AdminInventoryRow;
