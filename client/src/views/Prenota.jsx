import BookingForm from '../components/booking/BookingForm';

const Prenota = ({ eventBookingDraft }) => {
  return (
    <div className="prenota-page">
      <BookingForm eventBookingDraft={eventBookingDraft} />
    </div>
  );
};

export default Prenota;
