import './ConfirmDeleteModal.css';

const ConfirmDeleteModal = ({
  title,
  summaryItems,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="confirm-delete-backdrop" role="presentation">
      <div
        className="confirm-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <h2 id="confirm-delete-title">{title}</h2>

        <div className="confirm-delete-summary">
          {summaryItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <div className="confirm-delete-actions">
          <button
            className="confirm-delete-cancel"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Annulla
          </button>
          <button
            className="confirm-delete-submit"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Elimino...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
