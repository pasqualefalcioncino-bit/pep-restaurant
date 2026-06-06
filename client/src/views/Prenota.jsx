import BookingForm from '../components/booking/BookingForm';

const Prenota = ({ onBookingSuccess }) => {
  return (
    <div className="prenota-page">
      <BookingForm onBookingSuccess={onBookingSuccess} />
    </div>
  );
};

export default Prenota;
