import BookingForm from '../components/booking/BookingForm';

const Prenota = ({ eventBookingDraft, onBookingSuccess }) => {
  return (
    <div className="prenota-page">
      <BookingForm eventBookingDraft={eventBookingDraft} onBookingSuccess={onBookingSuccess} />
    </div>
  );
};

export default Prenota;
