import { AlertTriangle, Trash2 } from 'lucide-react';
import './ConfirmDeleteModal.css';

const normalizeSummaryItem = (item, index) => {
  if (typeof item === 'string') {
    return {
      id: `${item}-${index}`,
      title: item,
      details: [],
    };
  }

  return {
    id: item.id || `${item.title}-${index}`,
    title: item.title,
    details: Array.isArray(item.details) ? item.details : [item.details].filter(Boolean),
    imageSrc: item.imageSrc,
    imageAlt: item.imageAlt,
    icon: item.icon,
    fallbackText: item.fallbackText,
  };
};

const ConfirmDeleteModal = ({
  title,
  summaryItems,
  isDeleting,
  onCancel,
  onConfirm,
  confirmIcon = <Trash2 size={16} aria-hidden="true" />,
}) => {
  return (
    <div className="confirm-delete-backdrop" role="presentation">
      <div
        className="confirm-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div className="confirm-delete-header">
          <span className="confirm-delete-alert" aria-hidden="true">
            <AlertTriangle size={22} />
          </span>
          <div>
            <h2 id="confirm-delete-title">{title}</h2>
            <p>Questa operazione non puo essere annullata.</p>
          </div>
        </div>

        <div className="confirm-delete-summary">
          {summaryItems.map((item, index) => {
            const summaryItem = normalizeSummaryItem(item, index);

            return (
              <article className="confirm-delete-summary-item" key={summaryItem.id}>
                {(summaryItem.imageSrc || summaryItem.icon || summaryItem.fallbackText) && (
                  <div className="confirm-delete-summary-media">
                    {summaryItem.imageSrc ? (
                      <img src={summaryItem.imageSrc} alt={summaryItem.imageAlt || summaryItem.title} />
                    ) : summaryItem.icon ? (
                      summaryItem.icon
                    ) : (
                      <span aria-hidden="true">{summaryItem.fallbackText}</span>
                    )}
                  </div>
                )}

                <div>
                  <strong>{summaryItem.title}</strong>
                  {summaryItem.details.map((detail, detailIndex) => (
                    <span key={`${summaryItem.id}-${detail}-${detailIndex}`}>{detail}</span>
                  ))}
                </div>
              </article>
            );
          })}
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
            {!isDeleting && confirmIcon}
            {isDeleting ? 'Elimino...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
