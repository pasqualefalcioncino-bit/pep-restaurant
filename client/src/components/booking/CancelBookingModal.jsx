const CancelBookingModal = ({ booking, formatDate, formatTime, isBusy, onClose, onConfirm }) => {
  if (!booking) {
    return null;
  }

  return (
    <div className="customer-booking-modal-backdrop" role="presentation">
      <div
        aria-labelledby="cancel-booking-title"
        aria-modal="true"
        className="customer-booking-modal"
        role="dialog"
      >
        <span className="customer-booking-modal-kicker">Conferma annullamento</span>
        <h2 id="cancel-booking-title">Annullare la prenotazione?</h2>
        <p>
          La prenotazione #{booking.id} per il {formatDate(booking.booking_date)} alle{' '}
          {formatTime(booking.booking_time)} verra annullata.
        </p>
        <div className="customer-booking-modal-actions">
          <button
            className="customer-booking-danger-btn"
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? 'Annullamento...' : 'Annulla prenotazione'}
          </button>
          <button
            className="customer-booking-secondary-btn"
            type="button"
            onClick={onClose}
            disabled={isBusy}
          >
            Mantieni
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
