import BookingForm from '../components/booking/BookingForm';
import './Prenota.css';

const Prenota = ({ onBookingSuccess }) => {
  return (
    <div className="prenota-page">
      <BookingForm onBookingSuccess={onBookingSuccess} />
    </div>
  );
};

export default Prenota;
